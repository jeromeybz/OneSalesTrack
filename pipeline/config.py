from __future__ import annotations

import os
from urllib.parse import quote_plus
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from dotenv import load_dotenv


PH_TZ = ZoneInfo("Asia/Manila")


@dataclass(frozen=True)
class TargetPeriod:
    month: int
    year: int
    test_date: date | None
    range_start: datetime | None = None
    range_end: datetime | None = None

    @property
    def start_dt(self) -> datetime:
        if self.range_start is not None:
            return self.range_start
        return datetime(self.year, self.month, 1, 0, 0, 0, tzinfo=PH_TZ)

    @property
    def end_dt(self) -> datetime:
        if self.range_end is not None:
            return self.range_end
        if self.month == 12:
            return datetime(self.year + 1, 1, 1, 0, 0, 0, tzinfo=PH_TZ)
        return datetime(self.year, self.month + 1, 1, 0, 0, 0, tzinfo=PH_TZ)


def load_env() -> None:
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"), override=False)


def _previous_month(now: datetime) -> tuple[int, int]:
    first_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    prev_month_last_day = first_of_month - timedelta(days=1)
    return prev_month_last_day.month, prev_month_last_day.year


def _parse_date_env(value: str) -> date:
    return date.fromisoformat(value)


def _date_start(d: date) -> datetime:
    return datetime.combine(d, time(0, 0, 0), tzinfo=PH_TZ)


def _date_end_exclusive(d: date) -> datetime:
    # Treat end date as inclusive for convenience by making it exclusive-next-day.
    return datetime.combine(d + timedelta(days=1), time(0, 0, 0), tzinfo=PH_TZ)


def resolve_target_period(
    *,
    month: int | None = None,
    year: int | None = None,
    start_date: str | None = None,
    end_date: str | None = None,
    now: datetime | None = None,
) -> TargetPeriod:
    load_env()
    now = now or datetime.now(PH_TZ)

    env_test_date = os.getenv("PIPELINE_TEST_DATE")
    if env_test_date:
        test_dt = date.fromisoformat(env_test_date)
        return TargetPeriod(month=test_dt.month, year=test_dt.year, test_date=test_dt)

    env_start_date = os.getenv("PIPELINE_START_DATE")
    env_end_date = os.getenv("PIPELINE_END_DATE")
    start_date = start_date or env_start_date
    end_date = end_date or env_end_date

    if start_date:
        start_d = _parse_date_env(start_date)
        start_dt = _date_start(start_d)
        # If end_date isn't provided, use "now" (to the current time).
        end_dt = _date_end_exclusive(_parse_date_env(end_date)) if end_date else now
        return TargetPeriod(
            month=start_d.month,
            year=start_d.year,
            test_date=None,
            range_start=start_dt,
            range_end=end_dt,
        )

    env_month = os.getenv("PIPELINE_MONTH")
    env_year = os.getenv("PIPELINE_YEAR")
    if env_month or env_year:
        if not (env_month and env_year):
            raise ValueError("PIPELINE_MONTH and PIPELINE_YEAR must be set together.")
        default_month = int(env_month)
        default_year = int(env_year)
    else:
        default_month, default_year = _previous_month(now)

    return TargetPeriod(
        month=int(month) if month is not None else default_month,
        year=int(year) if year is not None else default_year,
        test_date=None,
    )


def mysql_url() -> str:
    load_env()
    host = os.getenv("MYSQL_HOST", "localhost")
    port = os.getenv("MYSQL_PORT", "3306")
    db = os.getenv("MYSQL_DATABASE", "salestrack_db")
    user = quote_plus(os.getenv("MYSQL_USER", "root"))
    password = quote_plus(os.getenv("MYSQL_PASSWORD", ""))
    return f"mysql+pymysql://{user}:{password}@{host}:{port}/{db}?charset=utf8mb4"


def pg_url() -> str:
    load_env()
    host = os.getenv("PG_HOST", "localhost")
    port = os.getenv("PG_PORT", "5432")
    db = os.getenv("PG_DATABASE", "salestrack_dw")
    user = quote_plus(os.getenv("PG_USER", "postgres"))
    password = quote_plus(os.getenv("PG_PASSWORD", ""))
    return f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{db}"
