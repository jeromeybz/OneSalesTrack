DELETE FROM gold.discount_performance WHERE _month = :month AND _year = :year;

INSERT INTO gold.discount_performance (
  product_id,
  product_name,
  supplier_name,
  discounted_items,
  gross_sales,
  original_sales,
  discount_amount,
  _month,
  _year,
  _refreshed_at
)
SELECT
  s.product_id,
  MAX(s.product_name) AS product_name,
  MAX(s.supplier_name) AS supplier_name,
  COALESCE(SUM(s.quantity), 0)::int AS discounted_items,
  COALESCE(SUM(s.total_price), 0) AS gross_sales,
  COALESCE(SUM(s.original_total), 0) AS original_sales,
  COALESCE(SUM(s.discount_amount), 0) AS discount_amount,
  :month,
  :year,
  NOW()
FROM silver.sales s
WHERE s._month = :month AND s._year = :year
  AND s.is_discounted = TRUE
GROUP BY s.product_id
ORDER BY discount_amount DESC, gross_sales DESC, s.product_id;

