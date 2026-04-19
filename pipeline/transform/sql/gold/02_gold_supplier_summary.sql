DELETE FROM gold.supplier_summary WHERE _month = :month AND _year = :year;

INSERT INTO gold.supplier_summary (
  supplier_name,
  gross_sales,
  quantity_sold,
  transactions,
  _month,
  _year,
  _refreshed_at
)
SELECT
  COALESCE(s.supplier_name, 'Unknown') AS supplier_name,
  COALESCE(SUM(s.total_price), 0) AS gross_sales,
  COALESCE(SUM(s.quantity), 0)::int AS quantity_sold,
  COUNT(DISTINCT s.transaction_id)::int AS transactions,
  :month,
  :year,
  NOW()
FROM silver.sales s
WHERE s._month = :month AND s._year = :year
GROUP BY 1
ORDER BY 2 DESC, 1;

