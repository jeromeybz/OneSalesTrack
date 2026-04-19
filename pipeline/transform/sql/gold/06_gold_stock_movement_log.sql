DELETE FROM gold.stock_movement_log WHERE _month = :month AND _year = :year;

INSERT INTO gold.stock_movement_log (
  movement_id,
  movement_ts,
  product_id,
  product_name,
  supplier_name,
  movement_type,
  quantity_change,
  stock_after,
  note,
  transaction_id,
  user_id,
  username,
  display_name,
  _month,
  _year,
  _refreshed_at
)
SELECT
  sm.movement_id,
  sm.movement_ts,
  sm.product_id,
  sm.product_name,
  sm.supplier_name,
  sm.movement_type,
  sm.quantity_change,
  sm.stock_after,
  sm.note,
  sm.transaction_id,
  sm.user_id,
  sm.username,
  sm.display_name,
  :month,
  :year,
  NOW()
FROM silver.stock_movements sm
WHERE sm._month = :month AND sm._year = :year
ORDER BY sm.movement_ts, sm.movement_id;

