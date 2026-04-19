CREATE OR REPLACE VIEW silver.discounts AS
SELECT
  d.id               AS discount_id,
  d.product_id       AS product_id,
  p.name             AS product_name,
  p.category         AS supplier_name,
  d.min_quantity     AS min_quantity,
  d.discounted_price AS discounted_price,
  d.is_active        AS is_active,
  d.created_at       AS created_at,
  d.updated_at       AS updated_at,
  d._month           AS _month,
  d._year            AS _year,
  d._loaded_at       AS _loaded_at
FROM bronze.product_discounts d
LEFT JOIN bronze.products p
  ON p.id = d.product_id
 AND p._month = d._month
 AND p._year = d._year;

