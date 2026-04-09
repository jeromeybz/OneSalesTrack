DELETE FROM gold.cashier_performance WHERE _month = :month AND _year = :year;

INSERT INTO gold.cashier_performance (
  cashier_name,
  walk_in_sales,
  delivery_sales,
  total_sales,
  transactions,
  items_sold,
  _month,
  _year,
  _refreshed_at
)
SELECT
  COALESCE(s.cashier_name, 'Unknown') AS cashier_name,
  COALESCE(SUM(CASE WHEN s.is_delivery = FALSE THEN s.total_price ELSE 0 END), 0) AS walk_in_sales,
  COALESCE(SUM(CASE WHEN s.is_delivery = TRUE  THEN s.total_price ELSE 0 END), 0) AS delivery_sales,
  COALESCE(SUM(s.total_price), 0) AS total_sales,
  COUNT(DISTINCT s.transaction_id)::int AS transactions,
  COALESCE(SUM(s.quantity), 0)::int AS items_sold,
  :month,
  :year,
  NOW()
FROM silver.sales s
WHERE s._month = :month AND s._year = :year
GROUP BY 1
ORDER BY total_sales DESC, cashier_name;

