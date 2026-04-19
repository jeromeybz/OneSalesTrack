SELECT
  id,
  product_id,
  product_name,
  movement_type,
  quantity_change,
  stock_after,
  note,
  transaction_id,
  user_id,
  created_at
FROM stock_movements
WHERE
  (
    :test_date IS NOT NULL
    AND DATE(created_at) = :test_date
  )
  OR (
    :test_date IS NULL
    AND created_at >= :start_dt
    AND created_at < :end_dt
  );

