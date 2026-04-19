from __future__ import annotations

from datetime import datetime

import pandas as pd

from pipeline.config import PH_TZ, TargetPeriod
from pipeline.extract import extractor


def test_with_metadata_adds_columns(monkeypatch) -> None:
	fixed_now = datetime(2026, 4, 19, 8, 30, 0, tzinfo=PH_TZ)

	class _FixedDatetime:
		@staticmethod
		def now(tz=None):
			assert tz is PH_TZ
			return fixed_now

	monkeypatch.setattr(extractor, "datetime", _FixedDatetime)

	df = pd.DataFrame({"id": [1, 2]})
	target = TargetPeriod(month=4, year=2026, test_date=None)
	out = extractor._with_metadata(df.copy(), target)

	assert list(out.columns) == ["id", "_loaded_at", "_month", "_year"]
	assert out["_month"].tolist() == [4, 4]
	assert out["_year"].tolist() == [2026, 2026]
	assert out["_loaded_at"].iloc[0] == fixed_now

