DELETE FROM gold.monthly_sales WHERE _month = :month AND _year = :year;

INSERT INTO gold.monthly_sales (
  sales_date,
  walk_in_sales,
  delivery_sales,
  total_sales,
  walk_in_transactions,
  delivery_transactions,
  items_sold,
  _month,
  _year,
  _refreshed_at
)
SELECT
  s.transaction_created_at::date AS sales_date,
  COALESCE(SUM(CASE WHEN s.is_delivery = FALSE THEN s.total_price ELSE 0 END), 0) AS walk_in_sales,
  COALESCE(SUM(CASE WHEN s.is_delivery = TRUE  THEN s.total_price ELSE 0 END), 0) AS delivery_sales,
  COALESCE(SUM(s.total_price), 0) AS total_sales,
  COUNT(DISTINCT CASE WHEN s.is_delivery = FALSE THEN s.transaction_id END) AS walk_in_transactions,
  COUNT(DISTINCT CASE WHEN s.is_delivery = TRUE  THEN s.transaction_id END) AS delivery_transactions,
  COALESCE(SUM(s.quantity), 0)::int AS items_sold,
  :month AS _month,
  :year  AS _year,
  NOW()  AS _refreshed_at
FROM silver.sales s
WHERE s._month = :month AND s._year = :year
GROUP BY 1
ORDER BY 1;

