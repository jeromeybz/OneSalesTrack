DELETE FROM gold.inventory_snapshot WHERE _month = :month AND _year = :year;

INSERT INTO gold.inventory_snapshot (
  product_id,
  product_name,
  sku,
  supplier_name,
  price,
  track_stock,
  stock_quantity,
  low_stock_threshold,
  discount_is_active,
  min_quantity,
  discounted_price,
  _month,
  _year,
  _refreshed_at
)
SELECT
  i.product_id,
  i.product_name,
  i.sku,
  i.supplier_name,
  i.price,
  i.track_stock,
  i.stock_quantity,
  i.low_stock_threshold,
  i.discount_is_active,
  i.min_quantity,
  i.discounted_price,
  :month,
  :year,
  NOW()
FROM silver.inventory i
WHERE i._month = :month AND i._year = :year
ORDER BY i.product_name;

