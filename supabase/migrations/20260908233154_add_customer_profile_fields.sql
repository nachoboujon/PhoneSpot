-- Datos de contacto y entrega guardados por cada cliente.
-- Las columnas son opcionales para no bloquear las cuentas existentes; el backend
-- exige una ficha completa cuando el cliente decide guardar datos de envío.
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
    ADD COLUMN IF NOT EXISTS dni VARCHAR(8),
    ADD COLUMN IF NOT EXISTS address VARCHAR(180),
    ADD COLUMN IF NOT EXISTS province VARCHAR(100),
    ADD COLUMN IF NOT EXISTS city VARCHAR(100),
    ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10);

COMMENT ON COLUMN public.users.phone IS 'Teléfono argentino de contacto del cliente.';
COMMENT ON COLUMN public.users.dni IS 'Documento para identificar la entrega.';
COMMENT ON COLUMN public.users.address IS 'Dirección de entrega guardada por el cliente.';
