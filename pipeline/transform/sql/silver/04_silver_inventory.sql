CREATE OR REPLACE VIEW silver.inventory AS
SELECT
  p.id                 AS product_id,
  p.name               AS product_name,
  p.sku                AS sku,
  p.category           AS supplier_name,
  p.price              AS price,
  p.track_stock        AS track_stock,
  p.stock_quantity     AS stock_quantity,
  p.low_stock_threshold AS low_stock_threshold,
  d.is_active          AS discount_is_active,
  d.min_quantity       AS min_quantity,
  d.discounted_price   AS discounted_price,
  p._month             AS _month,
  p._year              AS _year,
  p._loaded_at         AS _loaded_at
FROM bronze.products p
LEFT JOIN bronze.product_discounts d
  ON d.product_id = p.id
 AND d._month = p._month
 AND d._year = p._year;

