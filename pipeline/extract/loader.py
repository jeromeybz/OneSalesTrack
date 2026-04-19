from __future__ import annotations

import os
from datetime import datetime

import pandas as pd
from pandas.api.types import is_bool_dtype
from sqlalchemy import create_engine, text

from pipeline.config import PH_TZ, TargetPeriod, pg_url
from pipeline.extract.extractor import ExtractedData


def pg_engine():
	return create_engine(pg_url(), future=True)


def init_warehouse() -> None:
	schema_path = os.path.join(os.path.dirname(__file__), "..", "warehouse", "schema.sql")
	schema_path = os.path.abspath(schema_path)
	with open(schema_path, "r", encoding="utf-8") as f:
		ddl = f.read()

	engine = pg_engine()
	with engine.begin() as conn:
		conn.execute(text(ddl))


def _refresh_partition(conn, table: str, target: TargetPeriod) -> None:
	conn.execute(
		text(f"DELETE FROM bronze.{table} WHERE _month = :month AND _year = :year"),
		{"month": target.month, "year": target.year},
	)


def _load_df(conn, table: str, df: pd.DataFrame) -> None:
	if df.empty:
		return
	df.to_sql(
		table,
		con=conn,
		schema="bronze",
		if_exists="append",
		index=False,
		chunksize=2000,
		method="multi",
	)


def _coerce_bool_column(df: pd.DataFrame, *, table: str, column: str) -> None:
	if column not in df.columns:
		return

	series = df[column]
	if is_bool_dtype(series.dtype) or str(series.dtype).lower() == "boolean":
		return

	def to_bool_or_na(v):
		if v is None or v is pd.NA:
			return pd.NA
		if isinstance(v, float) and pd.isna(v):
			return pd.NA
		if isinstance(v, bool):
			return v
		if isinstance(v, int):
			if v in (0, 1):
				return bool(v)
			raise ValueError(f"Unexpected int for {table}.{column}: {v!r}")
		if isinstance(v, float) and v.is_integer():
			iv = int(v)
			if iv in (0, 1):
				return bool(iv)
			raise ValueError(f"Unexpected float for {table}.{column}: {v!r}")
		if isinstance(v, str):
			lv = v.strip().lower()
			if lv in ("1", "true", "t", "yes", "y"):
				return True
			if lv in ("0", "false", "f", "no", "n"):
				return False
			if lv == "":
				return pd.NA
			raise ValueError(f"Unexpected str for {table}.{column}: {v!r}")
		raise ValueError(f"Unexpected type for {table}.{column}: {type(v).__name__} ({v!r})")

	df[column] = series.map(to_bool_or_na).astype("boolean")


def _normalize_bronze_dtypes(table: str, df: pd.DataFrame) -> pd.DataFrame:
	# MySQL often returns tinyint(1) as 0/1 ints; Postgres tables use BOOLEAN.
	if table == "products":
		_coerce_bool_column(df, table=table, column="track_stock")
	elif table == "product_discounts":
		_coerce_bool_column(df, table=table, column="is_active")
	elif table == "transactions":
		_coerce_bool_column(df, table=table, column="is_delivery")
	elif table == "transaction_items":
		_coerce_bool_column(df, table=table, column="is_discounted")
	return df


def load_all_to_bronze(extracted: ExtractedData, target: TargetPeriod) -> None:
	engine = pg_engine()
	loaded_at = datetime.now(PH_TZ)

	table_map: dict[str, pd.DataFrame] = {
		"products": extracted.products,
		"product_discounts": extracted.product_discounts,
		"users": extracted.users,
		"transactions": extracted.transactions,
		"transaction_items": extracted.transaction_items,
		"stock_movements": extracted.stock_movements,
	}

	for table, df in table_map.items():
		if "_loaded_at" in df.columns:
			df["_loaded_at"] = loaded_at

	with engine.begin() as conn:
		for table, df in table_map.items():
			df = _normalize_bronze_dtypes(table, df)
			_refresh_partition(conn, table, target)
			_load_df(conn, table, df)
