CREATE SCHEMA IF NOT EXISTS bronze;
CREATE SCHEMA IF NOT EXISTS silver;
CREATE SCHEMA IF NOT EXISTS gold;

-- BRONZE: raw copies of MySQL tables, tagged by load time and target month/year

CREATE TABLE IF NOT EXISTS bronze.users (
  id BIGINT NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT,
  role TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  last_login TIMESTAMP,
  _loaded_at TIMESTAMPTZ NOT NULL,
  _month INT NOT NULL,
  _year INT NOT NULL,
  PRIMARY KEY (id, _month, _year)
);

CREATE TABLE IF NOT EXISTS bronze.products (
  id BIGINT NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  category TEXT,
  sku TEXT,
  track_stock BOOLEAN,
  stock_quantity INT,
  low_stock_threshold INT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  _loaded_at TIMESTAMPTZ NOT NULL,
  _month INT NOT NULL,
  _year INT NOT NULL,
  PRIMARY KEY (id, _month, _year)
);

CREATE TABLE IF NOT EXISTS bronze.product_discounts (
  id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  min_quantity INT NOT NULL,
  discounted_price NUMERIC(12, 2) NOT NULL,
  is_active BOOLEAN NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  _loaded_at TIMESTAMPTZ NOT NULL,
  _month INT NOT NULL,
  _year INT NOT NULL,
  PRIMARY KEY (id, _month, _year)
);

CREATE TABLE IF NOT EXISTS bronze.transactions (
  id BIGINT NOT NULL,
  user_id BIGINT,
  cashier_name TEXT,
  is_delivery BOOLEAN NOT NULL,
  delivery_recipient TEXT,
  delivery_note TEXT,
  created_at TIMESTAMP NOT NULL,
  _loaded_at TIMESTAMPTZ NOT NULL,
  _month INT NOT NULL,
  _year INT NOT NULL,
  PRIMARY KEY (id, _month, _year)
);

CREATE TABLE IF NOT EXISTS bronze.transaction_items (
  id BIGINT NOT NULL,
  transaction_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  product_name TEXT,
  quantity INT NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  total_price NUMERIC(12, 2) NOT NULL,
  original_total NUMERIC(12, 2),
  discount_amount NUMERIC(12, 2),
  is_discounted BOOLEAN NOT NULL,
  created_at TIMESTAMP NOT NULL,
  _loaded_at TIMESTAMPTZ NOT NULL,
  _month INT NOT NULL,
  _year INT NOT NULL,
  PRIMARY KEY (id, _month, _year)
);

CREATE TABLE IF NOT EXISTS bronze.stock_movements (
  id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  product_name TEXT,
  movement_type TEXT NOT NULL,
  quantity_change INT NOT NULL,
  stock_after INT,
  note TEXT,
  transaction_id BIGINT,
  user_id BIGINT,
  created_at TIMESTAMP NOT NULL,
  _loaded_at TIMESTAMPTZ NOT NULL,
  _month INT NOT NULL,
  _year INT NOT NULL,
  PRIMARY KEY (id, _month, _year)
);

CREATE INDEX IF NOT EXISTS idx_bronze_transactions_period ON bronze.transactions (_year, _month);
CREATE INDEX IF NOT EXISTS idx_bronze_transaction_items_period ON bronze.transaction_items (_year, _month);
CREATE INDEX IF NOT EXISTS idx_bronze_stock_movements_period ON bronze.stock_movements (_year, _month);

-- GOLD: Power BI reads only these tables.

CREATE TABLE IF NOT EXISTS gold.monthly_sales (
  sales_date DATE NOT NULL,
  walk_in_sales NUMERIC(14, 2) NOT NULL,
  delivery_sales NUMERIC(14, 2) NOT NULL,
  total_sales NUMERIC(14, 2) NOT NULL,
  walk_in_transactions INT NOT NULL,
  delivery_transactions INT NOT NULL,
  items_sold INT NOT NULL,
  _month INT NOT NULL,
  _year INT NOT NULL,
  _refreshed_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (sales_date, _month, _year)
);

CREATE TABLE IF NOT EXISTS gold.supplier_summary (
  supplier_name TEXT NOT NULL,
  gross_sales NUMERIC(14, 2) NOT NULL,
  quantity_sold INT NOT NULL,
  transactions INT NOT NULL,
  _month INT NOT NULL,
  _year INT NOT NULL,
  _refreshed_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (supplier_name, _month, _year)
);

CREATE TABLE IF NOT EXISTS gold.delivery_summary (
  delivery_recipient TEXT NOT NULL,
  delivery_sales NUMERIC(14, 2) NOT NULL,
  delivery_transactions INT NOT NULL,
  items_delivered INT NOT NULL,
  _month INT NOT NULL,
  _year INT NOT NULL,
  _refreshed_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (delivery_recipient, _month, _year)
);

CREATE TABLE IF NOT EXISTS gold.discount_performance (
  product_id BIGINT NOT NULL,
  product_name TEXT,
  supplier_name TEXT,
  discounted_items INT NOT NULL,
  gross_sales NUMERIC(14, 2) NOT NULL,
  original_sales NUMERIC(14, 2) NOT NULL,
  discount_amount NUMERIC(14, 2) NOT NULL,
  _month INT NOT NULL,
  _year INT NOT NULL,
  _refreshed_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (product_id, _month, _year)
);

CREATE TABLE IF NOT EXISTS gold.inventory_snapshot (
  product_id BIGINT NOT NULL,
  product_name TEXT NOT NULL,
  sku TEXT,
  supplier_name TEXT,
  price NUMERIC(12, 2) NOT NULL,
  track_stock BOOLEAN,
  stock_quantity INT,
  low_stock_threshold INT,
  discount_is_active BOOLEAN,
  min_quantity INT,
  discounted_price NUMERIC(12, 2),
  _month INT NOT NULL,
  _year INT NOT NULL,
  _refreshed_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (product_id, _month, _year)
);

CREATE TABLE IF NOT EXISTS gold.stock_movement_log (
  movement_id BIGINT NOT NULL,
  movement_ts TIMESTAMP NOT NULL,
  product_id BIGINT NOT NULL,
  product_name TEXT,
  supplier_name TEXT,
  movement_type TEXT NOT NULL,
  quantity_change INT NOT NULL,
  stock_after INT,
  note TEXT,
  transaction_id BIGINT,
  user_id BIGINT,
  username TEXT,
  display_name TEXT,
  _month INT NOT NULL,
  _year INT NOT NULL,
  _refreshed_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (movement_id, _month, _year)
);

CREATE TABLE IF NOT EXISTS gold.cashier_performance (
  cashier_name TEXT NOT NULL,
  walk_in_sales NUMERIC(14, 2) NOT NULL,
  delivery_sales NUMERIC(14, 2) NOT NULL,
  total_sales NUMERIC(14, 2) NOT NULL,
  transactions INT NOT NULL,
  items_sold INT NOT NULL,
  _month INT NOT NULL,
  _year INT NOT NULL,
  _refreshed_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (cashier_name, _month, _year)
);

CREATE INDEX IF NOT EXISTS idx_gold_monthly_sales_period ON gold.monthly_sales (_year, _month);
CREATE INDEX IF NOT EXISTS idx_gold_supplier_summary_period ON gold.supplier_summary (_year, _month);
CREATE INDEX IF NOT EXISTS idx_gold_delivery_summary_period ON gold.delivery_summary (_year, _month);
CREATE INDEX IF NOT EXISTS idx_gold_discount_perf_period ON gold.discount_performance (_year, _month);
CREATE INDEX IF NOT EXISTS idx_gold_inventory_period ON gold.inventory_snapshot (_year, _month);
CREATE INDEX IF NOT EXISTS idx_gold_stock_log_period ON gold.stock_movement_log (_year, _month);
CREATE INDEX IF NOT EXISTS idx_gold_cashier_perf_period ON gold.cashier_performance (_year, _month);

