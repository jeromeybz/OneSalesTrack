SELECT
  id,
  user_id,
  cashier_name,
  is_delivery,
  delivery_recipient,
  delivery_note,
  created_at
FROM transactions
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

