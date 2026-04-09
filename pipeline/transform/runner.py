from __future__ import annotations

import os

from sqlalchemy import create_engine, text

from pipeline.config import TargetPeriod, pg_url


def _sql_root() -> str:
	return os.path.join(os.path.dirname(__file__), "sql")


def _read_sql(path: str) -> str:
	with open(path, "r", encoding="utf-8") as f:
		return f.read()


def _run_sql_files(*, subdir: str, params: dict) -> None:
	root = os.path.join(_sql_root(), subdir)
	paths = [
		os.path.join(root, name)
		for name in sorted(os.listdir(root))
		if name.lower().endswith(".sql")
	]
	engine = create_engine(pg_url(), future=True)
	with engine.begin() as conn:
		for p in paths:
			conn.execute(text(_read_sql(p)), params)


def run_silver() -> None:
	_run_sql_files(subdir="silver", params={})


def run_gold(target: TargetPeriod) -> None:
	params = {"month": target.month, "year": target.year}
	_run_sql_files(subdir="gold", params=params)

