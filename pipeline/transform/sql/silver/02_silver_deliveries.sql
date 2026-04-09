CREATE OR REPLACE VIEW silver.deliveries AS
SELECT *
FROM silver.sales
WHERE is_delivery = TRUE;

