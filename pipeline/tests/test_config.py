from __future__ import annotations

from datetime import date, datetime

import pytest

from pipeline import config


def test_resolve_target_period_previous_month_crosses_year(monkeypatch: pytest.MonkeyPatch) -> None:
	monkeypatch.setattr(config, "load_env", lambda: None)
	monkeypatch.delenv("PIPELINE_TEST_DATE", raising=False)
	monkeypatch.delenv("PIPELINE_START_DATE", raising=False)
	monkeypatch.delenv("PIPELINE_END_DATE", raising=False)
	monkeypatch.delenv("PIPELINE_MONTH", raising=False)
	monkeypatch.delenv("PIPELINE_YEAR", raising=False)

	now = datetime(2026, 1, 15, 12, 0, 0, tzinfo=config.PH_TZ)
	target = config.resolve_target_period(now=now)

	assert target.month == 12
	assert target.year == 2025
	assert target.test_date is None


def test_resolve_target_period_test_date_env_wins(monkeypatch: pytest.MonkeyPatch) -> None:
	monkeypatch.setattr(config, "load_env", lambda: None)
	monkeypatch.setenv("PIPELINE_TEST_DATE", "2026-04-09")
	monkeypatch.setenv("PIPELINE_MONTH", "1")
	monkeypatch.setenv("PIPELINE_YEAR", "2020")
	monkeypatch.setenv("PIPELINE_START_DATE", "2026-04-01")

	target = config.resolve_target_period(month=2, year=2024, start_date="2026-04-05", end_date="2026-04-06")

	assert target.month == 4
	assert target.year == 2026
	assert target.test_date == date(2026, 4, 9)
	assert target.range_start is None
	assert target.range_end is None


def test_resolve_target_period_start_end_dates(monkeypatch: pytest.MonkeyPatch) -> None:
	monkeypatch.setattr(config, "load_env", lambda: None)
	monkeypatch.delenv("PIPELINE_TEST_DATE", raising=False)
	monkeypatch.delenv("PIPELINE_MONTH", raising=False)
	monkeypatch.delenv("PIPELINE_YEAR", raising=False)
	monkeypatch.delenv("PIPELINE_START_DATE", raising=False)
	monkeypatch.delenv("PIPELINE_END_DATE", raising=False)

	now = datetime(2026, 4, 10, 13, 37, 0, tzinfo=config.PH_TZ)
	target = config.resolve_target_period(start_date="2026-04-05", end_date="2026-04-09", now=now)

	assert target.month == 4
	assert target.year == 2026
	assert target.test_date is None
	assert target.range_start == datetime(2026, 4, 5, 0, 0, 0, tzinfo=config.PH_TZ)
	# End date is treated as inclusive; stored as exclusive-next-day.
	assert target.range_end == datetime(2026, 4, 10, 0, 0, 0, tzinfo=config.PH_TZ)


def test_resolve_target_period_env_month_year_must_both_be_set(monkeypatch: pytest.MonkeyPatch) -> None:
	monkeypatch.setattr(config, "load_env", lambda: None)
	monkeypatch.delenv("PIPELINE_TEST_DATE", raising=False)
	monkeypatch.delenv("PIPELINE_START_DATE", raising=False)
	monkeypatch.delenv("PIPELINE_END_DATE", raising=False)
	monkeypatch.setenv("PIPELINE_MONTH", "4")
	monkeypatch.delenv("PIPELINE_YEAR", raising=False)

	with pytest.raises(ValueError, match="PIPELINE_MONTH and PIPELINE_YEAR must be set together"):
		config.resolve_target_period(now=datetime(2026, 4, 10, tzinfo=config.PH_TZ))
