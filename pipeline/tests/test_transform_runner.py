from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import pytest

from pipeline.config import TargetPeriod
from pipeline.transform import runner


@dataclass
class _Exec:
	sql: str
	params: dict


class _Conn:
	def __init__(self, executed: list[_Exec]) -> None:
		self._executed = executed

	def execute(self, stmt, params):
		self._executed.append(_Exec(sql=str(stmt), params=dict(params)))


class _Begin:
	def __init__(self, executed: list[_Exec]) -> None:
		self._executed = executed

	def __enter__(self):
		return _Conn(self._executed)

	def __exit__(self, exc_type, exc, tb):
		return False


class _Engine:
	def __init__(self, executed: list[_Exec]) -> None:
		self._executed = executed

	def begin(self):
		return _Begin(self._executed)


def test_run_silver_executes_sorted_sql_files(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
	sql_root = tmp_path / "sql"
	(sql_root / "silver").mkdir(parents=True)
	(sql_root / "silver" / "02_b.sql").write_text("SELECT 2;", encoding="utf-8")
	(sql_root / "silver" / "01_a.sql").write_text("SELECT 1;", encoding="utf-8")
	(sql_root / "silver" / "readme.txt").write_text("ignore", encoding="utf-8")

	executed: list[_Exec] = []
	monkeypatch.setattr(runner, "_sql_root", lambda: str(sql_root))
	monkeypatch.setattr(runner, "pg_url", lambda: "postgresql://unused")
	monkeypatch.setattr(runner, "create_engine", lambda *_args, **_kwargs: _Engine(executed))

	runner.run_silver()

	assert [e.sql.strip() for e in executed] == ["SELECT 1;", "SELECT 2;"]
	assert executed[0].params == {}


def test_run_gold_passes_month_year_params(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
	sql_root = tmp_path / "sql"
	(sql_root / "gold").mkdir(parents=True)
	(sql_root / "gold" / "01.sql").write_text("SELECT :month, :year;", encoding="utf-8")

	executed: list[_Exec] = []
	monkeypatch.setattr(runner, "_sql_root", lambda: str(sql_root))
	monkeypatch.setattr(runner, "pg_url", lambda: "postgresql://unused")
	monkeypatch.setattr(runner, "create_engine", lambda *_args, **_kwargs: _Engine(executed))

	target = TargetPeriod(month=4, year=2026, test_date=None)
	runner.run_gold(target)

	assert executed[0].params == {"month": 4, "year": 2026}

