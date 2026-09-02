-- Ejecutar una sola vez en el SQL Editor de Supabase para alinear una base existente
-- con el código actual de PhoneSpot. Es idempotente: se puede ejecutar de nuevo.

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS category VARCHAR(50) NOT NULL DEFAULT 'celulares',
    ADD COLUMN IF NOT EXISTS variants JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(100) DEFAULT NULL;

ALTER TABLE order_items
    ADD COLUMN IF NOT EXISTS variant_name VARCHAR(255) DEFAULT NULL;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders
    ADD CONSTRAINT orders_status_check
    CHECK (status IN ('pending', 'completed', 'cancelled', 'shipped'));

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    user_name VARCHAR(100) NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS orders_user_id_created_at_idx ON orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id);
CREATE INDEX IF NOT EXISTS reviews_product_id_created_at_idx ON reviews (product_id, created_at DESC);
