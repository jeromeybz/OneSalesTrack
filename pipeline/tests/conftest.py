from __future__ import annotations

import time
from typing import Any


_terminal_reporter: Any | None = None
_start_time: float | None = None
_counts = {"passed": 0, "failed": 0, "skipped": 0}


def pytest_configure(config) -> None:
	global _terminal_reporter
	_terminal_reporter = config.pluginmanager.getplugin("terminalreporter")


def _write_line(line: str) -> None:
	if _terminal_reporter is not None:
		_terminal_reporter.write_line(line)
	else:
		print(line, flush=True)


def pytest_sessionstart(session) -> None:
	global _start_time
	_start_time = time.perf_counter()


def pytest_runtest_logreport(report) -> None:
	# Report one line per test with timing.
	# Skips happen during setup; most tests are reported during "call".
	if report.when == "call" or (report.when == "setup" and report.outcome == "skipped"):
		outcome = report.outcome.lower()
		if outcome in _counts:
			_counts[outcome] += 1
		_write_line(f"{report.nodeid} {outcome} in {report.duration:.3f}s")

		if outcome == "failed":
			longrepr = getattr(report, "longreprtext", None)
			if longrepr:
				_write_line(longrepr.rstrip())


def pytest_sessionfinish(session, exitstatus: int) -> None:
	elapsed = None
	if _start_time is not None:
		elapsed = time.perf_counter() - _start_time

	passed = _counts["passed"]
	failed = _counts["failed"]
	skipped = _counts["skipped"]
	parts = [f"{passed} passed"]
	if skipped:
		parts.append(f"{skipped} skipped")
	if failed:
		parts.append(f"{failed} failed")

	if elapsed is not None:
		_write_line(f"{', '.join(parts)} in {elapsed:.2f}s")
	else:
		_write_line(", ".join(parts))
