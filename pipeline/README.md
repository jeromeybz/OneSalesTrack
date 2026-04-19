# SalesTrack Data Warehouse Pipeline

This folder contains a simple monthly pipeline that:

1. Extracts data from MySQL (`salestrack_db`)
2. Loads raw copies into PostgreSQL `bronze` schema (`salestrack_dw`)
3. Builds `silver` views and refreshes `gold` tables for Power BI

## Setup

1. Create `pipeline/.env` (copy from `pipeline/.env.example`)
2. Create a virtualenv and install deps:
   - `python -m venv .venv`
   - `.venv\\Scripts\\Activate.ps1`
   - `pip install -r pipeline\\requirements.txt`

## Run

- Run commands from the repo root (`c:\SalesAppV4`) so Python can resolve the `pipeline` package.
- Default (previous month, Asia/Manila):
  - `python -m pipeline.main`
- Backfill:
  - `python -m pipeline.main --month 3 --year 2026`
- Date range (for testing):
  - `python -m pipeline.main --start-date 2026-04-05` (up to "now")
  - `python -m pipeline.main --start-date 2026-04-05 --end-date 2026-04-09`
- Run only specific steps:
  - `python -m pipeline.main --steps init,bronze`
  - `python -m pipeline.main --steps silver,gold`

## Test mode (single day)

Set `PIPELINE_TEST_DATE=YYYY-MM-DD` in `pipeline/.env`. This forces extraction for that day only and stores data under that month/year.

## Tests

- Install dev deps:
  - `pip install -r pipeline\\requirements-dev.txt`
- Run unit tests:
  - PowerShell: `pipeline\\scripts\\run_tests.ps1`
  - Bash: `pipeline/scripts/run_tests.sh`
  - Output: prints one line per test, including the duration
- CI-friendly (installs deps then runs tests):
  - PowerShell: `pipeline\\scripts\\run_tests.ps1 -Install`
  - Bash: `INSTALL=1 pipeline/scripts/run_tests.sh`
  - If your runner only has `python3`: `PYTHON=python3 pipeline/scripts/run_tests.sh`
  - If `pip` is missing on Linux: install `python3-pip` (Debian/Ubuntu) or run `python3 -m ensurepip --upgrade` if available
  - If you hit `externally-managed-environment` (PEP 668): the bash script installs into `pipeline/.venv` automatically; ensure `python3-venv` is available
