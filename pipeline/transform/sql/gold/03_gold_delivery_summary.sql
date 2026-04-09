DELETE FROM gold.delivery_summary WHERE _month = :month AND _year = :year;

INSERT INTO gold.delivery_summary (
  delivery_recipient,
  delivery_sales,
  delivery_transactions,
  items_delivered,
  _month,
  _year,
  _refreshed_at
)
SELECT
  COALESCE(s.delivery_recipient, 'Unknown') AS delivery_recipient,
  COALESCE(SUM(s.total_price), 0) AS delivery_sales,
  COUNT(DISTINCT s.transaction_id)::int AS delivery_transactions,
  COALESCE(SUM(s.quantity), 0)::int AS items_delivered,
  :month,
  :year,
  NOW()
FROM silver.sales s
WHERE s._month = :month AND s._year = :year
  AND s.is_delivery = TRUE
GROUP BY 1
ORDER BY 2 DESC, 1;

