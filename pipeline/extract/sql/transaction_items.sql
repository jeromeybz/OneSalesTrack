SELECT
  id,
  transaction_id,
  product_id,
  product_name,
  quantity,
  unit_price,
  total_price,
  original_total,
  discount_amount,
  is_discounted,
  created_at
FROM transaction_items
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

