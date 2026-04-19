from __future__ import annotations

import pandas as pd
import pytest

from pipeline.extract import loader


def test_normalize_products_track_stock_coerces_to_boolean() -> None:
	df = pd.DataFrame({"track_stock": [1, 0, "true", "false", "", None, 1.0, 0.0]})
	out = loader._normalize_bronze_dtypes("products", df)
	assert str(out["track_stock"].dtype).lower() == "boolean"
	values = out["track_stock"].tolist()
	assert values[0:4] == [True, False, True, False]
	assert pd.isna(values[4])
	assert pd.isna(values[5])
	assert values[6:8] == [True, False]


def test_normalize_transactions_is_delivery_rejects_unexpected_values() -> None:
	df = pd.DataFrame({"is_delivery": [2]})
	with pytest.raises(ValueError, match=r"Unexpected int for transactions\.is_delivery"):
		loader._normalize_bronze_dtypes("transactions", df)
