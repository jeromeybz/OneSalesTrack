CREATE OR REPLACE VIEW silver.sales AS
SELECT
  ti.id                         AS transaction_item_id,
  ti.transaction_id             AS transaction_id,
  t.user_id                     AS user_id,
  t.cashier_name                AS cashier_name,
  t.is_delivery                 AS is_delivery,
  t.delivery_recipient          AS delivery_recipient,
  t.delivery_note               AS delivery_note,
  t.created_at                  AS transaction_created_at,
  ti.created_at                 AS item_created_at,
  ti.product_id                 AS product_id,
  COALESCE(ti.product_name, p.name) AS product_name,
  p.sku                         AS sku,
  p.category                    AS supplier_name,
  p.track_stock                 AS track_stock,
  ti.quantity                   AS quantity,
  ti.unit_price                 AS unit_price,
  ti.total_price                AS total_price,
  ti.original_total             AS original_total,
  ti.discount_amount            AS discount_amount,
  ti.is_discounted              AS is_discounted,
  d.min_quantity                AS discount_min_quantity,
  d.discounted_price            AS discount_bundle_price,
  d.is_active                   AS discount_is_active,
  ti._month                     AS _month,
  ti._year                      AS _year,
  ti._loaded_at                 AS _loaded_at
FROM bronze.transaction_items ti
JOIN bronze.transactions t
  ON t.id = ti.transaction_id
 AND t._month = ti._month
 AND t._year = ti._year
LEFT JOIN bronze.products p
  ON p.id = ti.product_id
 AND p._month = ti._month
 AND p._year = ti._year
LEFT JOIN bronze.product_discounts d
  ON d.product_id = ti.product_id
 AND d._month = ti._month
 AND d._year = ti._year;

