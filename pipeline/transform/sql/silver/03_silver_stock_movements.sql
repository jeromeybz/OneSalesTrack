CREATE OR REPLACE VIEW silver.stock_movements AS
SELECT
  sm.id               AS movement_id,
  sm.created_at       AS movement_ts,
  sm.product_id       AS product_id,
  COALESCE(sm.product_name, p.name) AS product_name,
  p.category          AS supplier_name,
  sm.movement_type    AS movement_type,
  sm.quantity_change  AS quantity_change,
  sm.stock_after      AS stock_after,
  sm.note             AS note,
  sm.transaction_id   AS transaction_id,
  sm.user_id          AS user_id,
  u.username          AS username,
  u.display_name      AS display_name,
  sm._month           AS _month,
  sm._year            AS _year,
  sm._loaded_at       AS _loaded_at
FROM bronze.stock_movements sm
LEFT JOIN bronze.products p
  ON p.id = sm.product_id
 AND p._month = sm._month
 AND p._year = sm._year
LEFT JOIN bronze.users u
  ON u.id = sm.user_id
 AND u._month = sm._month
 AND u._year = sm._year;

