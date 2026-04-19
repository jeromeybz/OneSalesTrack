from __future__ import annotations

from pipeline import main


def test_parse_args_defaults() -> None:
	args = main.parse_args([])
	assert args.month is None
	assert args.year is None
	assert args.start_date is None
	assert args.end_date is None
	assert args.steps == "init,bronze,silver,gold"


def test_parse_args_custom_values() -> None:
	args = main.parse_args(
		[
			"--month",
			"3",
			"--year",
			"2026",
			"--start-date",
			"2026-04-05",
			"--end-date",
			"2026-04-09",
			"--steps",
			"silver,gold",
		]
	)
	assert args.month == 3
	assert args.year == 2026
	assert args.start_date == "2026-04-05"
	assert args.end_date == "2026-04-09"
	assert args.steps == "silver,gold"

