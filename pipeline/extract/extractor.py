from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime
from typing import Any

import pandas as pd
from sqlalchemy import create_engine, text

from pipeline.config import PH_TZ, TargetPeriod, mysql_url


@dataclass(frozen=True)
class ExtractedData:
	products: pd.DataFrame
	product_discounts: pd.DataFrame
	users: pd.DataFrame
	transactions: pd.DataFrame
	transaction_items: pd.DataFrame
	stock_movements: pd.DataFrame


def _sql_dir() -> str:
	return os.path.join(os.path.dirname(__file__), "sql")


def _read_sql(filename: str) -> str:
	path = os.path.join(_sql_dir(), filename)
	with open(path, "r", encoding="utf-8") as f:
		return f.read()


def _read_df(engine, sql_filename: str, params: dict[str, Any]) -> pd.DataFrame:
	sql = _read_sql(sql_filename)
	return pd.read_sql(text(sql), con=engine, params=params)


def _with_metadata(df: pd.DataFrame, target: TargetPeriod) -> pd.DataFrame:
	loaded_at = datetime.now(PH_TZ)
	df["_loaded_at"] = loaded_at
	df["_month"] = target.month
	df["_year"] = target.year
	return df


def extract_all(target: TargetPeriod) -> ExtractedData:
	engine = create_engine(mysql_url())
	params: dict[str, Any] = {
		"start_dt": target.start_dt.replace(tzinfo=None),
		"end_dt": target.end_dt.replace(tzinfo=None),
		"test_date": target.test_date.isoformat() if target.test_date else None,
	}

	products = _with_metadata(_read_df(engine, "products.sql", params), target)
	product_discounts = _with_metadata(_read_df(engine, "product_discounts.sql", params), target)
	users = _with_metadata(_read_df(engine, "users.sql", params), target)
	transactions = _with_metadata(_read_df(engine, "transactions.sql", params), target)
	transaction_items = _with_metadata(_read_df(engine, "transaction_items.sql", params), target)
	stock_movements = _with_metadata(_read_df(engine, "stock_movements.sql", params), target)

	return ExtractedData(
		products=products,
		product_discounts=product_discounts,
		users=users,
		transactions=transactions,
		transaction_items=transaction_items,
		stock_movements=stock_movements,
	)

