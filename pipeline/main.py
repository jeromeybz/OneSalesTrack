from __future__ import annotations

import argparse
import os
import sys

if __package__ is None:
	sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from pipeline.config import resolve_target_period


def _missing_dep_help(missing_module: str) -> str:
	return (
		f"Error: Missing required dependency '{missing_module}'.\n"
	)


def parse_args(argv: list[str]) -> argparse.Namespace:
	parser = argparse.ArgumentParser(description="SalesTrack monthly warehouse pipeline")
	parser.add_argument("--month", type=int, default=None)
	parser.add_argument("--year", type=int, default=None)
	parser.add_argument("--start-date", type=str, default=None, help="YYYY-MM-DD (overrides month/year)")
	parser.add_argument("--end-date", type=str, default=None, help="YYYY-MM-DD inclusive (optional)")
	parser.add_argument(
		"--steps",
		type=str,
		default="init,bronze,silver,gold",
		help="Comma-separated steps: init,bronze,silver,gold",
	)
	return parser.parse_args(argv)


def main(argv: list[str]) -> int:
	args = parse_args(argv)
	target = resolve_target_period(
		month=args.month,
		year=args.year,
		start_date=args.start_date,
		end_date=args.end_date,
	)
	steps = {s.strip().lower() for s in args.steps.split(",") if s.strip()}

	if "init" in steps:
		try:
			from pipeline.extract.loader import init_warehouse
		except ModuleNotFoundError as e:
			raise SystemExit(_missing_dep_help(e.name)) from e
		init_warehouse()

	if "bronze" in steps:
		try:
			from pipeline.extract.extractor import extract_all
			from pipeline.extract.loader import load_all_to_bronze
		except ModuleNotFoundError as e:
			raise SystemExit(_missing_dep_help(e.name)) from e

		extracted = extract_all(target)
		load_all_to_bronze(extracted, target)

	if "silver" in steps:
		try:
			from pipeline.transform.runner import run_silver
		except ModuleNotFoundError as e:
			raise SystemExit(_missing_dep_help(e.name)) from e
		run_silver()

	if "gold" in steps:
		try:
			from pipeline.transform.runner import run_gold
		except ModuleNotFoundError as e:
			raise SystemExit(_missing_dep_help(e.name)) from e
		run_gold(target)

	return 0


if __name__ == "__main__":
	raise SystemExit(main(sys.argv[1:]))
