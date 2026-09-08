-- Migración aplicada en Supabase el 2026-09-03.
-- Es aditiva e idempotente para conservar pedidos históricos.

CREATE TABLE IF NOT EXISTS stock_alerts (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE (product_id, email)
);

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS customer_name VARCHAR(120),
    ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
    ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(40),
    ADD COLUMN IF NOT EXISTS payment_method VARCHAR(40) NOT NULL DEFAULT 'transferencia',
    ADD COLUMN IF NOT EXISTS shipping_method VARCHAR(100),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
    CHECK (status IN ('pending', 'confirmed', 'completed', 'preparing', 'shipped', 'delivered', 'cancelled'));

ALTER TABLE reviews
    ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

CREATE TABLE IF NOT EXISTS site_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_type VARCHAR(40) NOT NULL CHECK (event_type IN ('page_view', 'product_view', 'add_to_cart', 'checkout_started', 'order_created', 'search')),
    product_id INT REFERENCES products(id) ON DELETE SET NULL,
    page_path VARCHAR(180),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS stock_alerts_product_id_idx ON stock_alerts (product_id);
CREATE INDEX IF NOT EXISTS orders_customer_email_idx ON orders (customer_email);
CREATE INDEX IF NOT EXISTS orders_status_created_at_idx ON orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_user_id_created_at_idx ON orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id);
CREATE INDEX IF NOT EXISTS order_items_product_id_idx ON order_items (product_id);
CREATE INDEX IF NOT EXISTS reviews_public_product_idx ON reviews (product_id, created_at DESC) WHERE approved = TRUE;
CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON reviews (user_id);
CREATE INDEX IF NOT EXISTS site_events_created_at_idx ON site_events (created_at DESC);
CREATE INDEX IF NOT EXISTS site_events_type_created_at_idx ON site_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS site_events_product_id_idx ON site_events (product_id);

ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
