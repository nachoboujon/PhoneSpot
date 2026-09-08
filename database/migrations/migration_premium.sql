-- Añadir columna de seguimiento a órdenes
ALTER TABLE orders ADD COLUMN tracking_code VARCHAR(100) DEFAULT NULL;

-- Eliminar la restricción de estados para poder agregar "shipped" (enviado)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Crear tabla de reseñas
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    user_name VARCHAR(100),
    rating INT DEFAULT 5,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
