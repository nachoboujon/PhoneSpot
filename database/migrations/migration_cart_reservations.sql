-- Ejecutar antes de desplegar el servidor que usa reservas.
ALTER TABLE products ADD COLUMN IF NOT EXISTS archived_at timestamptz;
CREATE INDEX IF NOT EXISTS products_visible_idx ON products (created_at DESC) WHERE archived_at IS NULL;

CREATE TABLE IF NOT EXISTS cart_reservations (
    cart_id uuid NOT NULL,
    product_id integer NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    variant_name text NOT NULL DEFAULT '',
    quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 20),
    expires_at timestamptz NOT NULL,
    PRIMARY KEY (cart_id, product_id, variant_name)
);
CREATE INDEX IF NOT EXISTS cart_reservations_expiry_idx ON cart_reservations (expires_at);
ALTER TABLE cart_reservations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON cart_reservations FROM PUBLIC, anon, authenticated;
GRANT ALL ON cart_reservations TO service_role;

CREATE OR REPLACE FUNCTION cart_variant_name(v jsonb) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
    SELECT concat_ws(' - ', nullif(v->>'color', ''), nullif(v->>'capacity', ''),
        nullif(v->>'ram', ''), CASE WHEN nullif(v->>'batt', '') IS NOT NULL
        THEN 'Bat: ' || (v->>'batt') END);
$$;

CREATE OR REPLACE FUNCTION protect_reserved_variants() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
    IF OLD.variants IS DISTINCT FROM NEW.variants
        AND EXISTS (SELECT 1 FROM cart_reservations WHERE product_id = OLD.id)
        AND (SELECT array_agg(cart_variant_name(value) ORDER BY ordinality)
             FROM jsonb_array_elements(coalesce(OLD.variants, '[]'::jsonb)) WITH ORDINALITY)
            IS DISTINCT FROM
            (SELECT array_agg(cart_variant_name(value) ORDER BY ordinality)
             FROM jsonb_array_elements(coalesce(NEW.variants, '[]'::jsonb)) WITH ORDINALITY)
    THEN RAISE EXCEPTION 'No se pueden cambiar las variantes mientras haya reservas activas';
    END IF;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS protect_reserved_variants_trigger ON products;
CREATE TRIGGER protect_reserved_variants_trigger BEFORE UPDATE OF variants ON products
FOR EACH ROW EXECUTE FUNCTION protect_reserved_variants();

-- Esta función siempre se llama dentro de la transacción de otra función RPC.
CREATE OR REPLACE FUNCTION cart_adjust_stock(p_product_id integer, p_variant_name text, p_delta integer)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE p products%ROWTYPE; v jsonb; idx integer;
BEGIN
    SELECT * INTO p FROM products WHERE id = p_product_id FOR UPDATE;
    IF NOT FOUND OR p.stock + p_delta < 0 THEN RETURN false; END IF;
    IF jsonb_array_length(coalesce(p.variants, '[]'::jsonb)) > 0 THEN
        SELECT value, ordinality::integer - 1 INTO v, idx
        FROM jsonb_array_elements(p.variants) WITH ORDINALITY
        WHERE cart_variant_name(value) = p_variant_name LIMIT 1;
        IF idx IS NULL OR (v->>'stock')::integer + p_delta < 0 THEN RETURN false; END IF;
        UPDATE products SET stock = stock + p_delta,
            variants = jsonb_set(variants, ARRAY[idx::text, 'stock'],
                to_jsonb((v->>'stock')::integer + p_delta)) WHERE id = p_product_id;
    ELSE
        IF p_variant_name <> '' THEN RETURN false; END IF;
        UPDATE products SET stock = stock + p_delta WHERE id = p_product_id;
    END IF;
    RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION expire_cart_reservations() RETURNS integer
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE r cart_reservations%ROWTYPE; n integer := 0;
BEGIN
    FOR r IN SELECT * FROM cart_reservations WHERE expires_at <= now() ORDER BY product_id LOOP
        -- El bloqueo del producto serializa expiración, reserva y compra.
        PERFORM 1 FROM products WHERE id = r.product_id FOR UPDATE;
        SELECT * INTO r FROM cart_reservations WHERE cart_id = r.cart_id
            AND product_id = r.product_id AND variant_name = r.variant_name FOR UPDATE;
        IF FOUND AND r.expires_at <= now() THEN
            IF NOT cart_adjust_stock(r.product_id, r.variant_name, r.quantity) THEN
                RAISE EXCEPTION 'No se pudo devolver el stock reservado';
            END IF;
            DELETE FROM cart_reservations WHERE cart_id = r.cart_id
                AND product_id = r.product_id AND variant_name = r.variant_name;
            n := n + 1;
        END IF;
    END LOOP;
    RETURN n;
END;
$$;

CREATE OR REPLACE FUNCTION set_cart_reservation(p_cart_id uuid, p_product_id integer,
    p_variant_name text, p_quantity integer)
RETURNS TABLE(quantity integer, expires_at timestamptz)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE p products%ROWTYPE; r cart_reservations%ROWTYPE; desired integer; delta integer;
BEGIN
    IF p_quantity < 0 OR p_quantity > 20 OR p_variant_name IS NULL OR length(p_variant_name) > 255 THEN
        RAISE EXCEPTION 'Cantidad o variante inválida';
    END IF;
    SELECT * INTO p FROM products WHERE id = p_product_id FOR UPDATE;
    IF NOT FOUND OR (p.archived_at IS NOT NULL AND p_quantity > 0) THEN
        RAISE EXCEPTION 'Producto no disponible';
    END IF;
    SELECT * INTO r FROM cart_reservations WHERE cart_id = p_cart_id
        AND product_id = p_product_id AND variant_name = p_variant_name FOR UPDATE;
    IF FOUND AND r.expires_at <= now() THEN
        IF NOT cart_adjust_stock(p_product_id, p_variant_name, r.quantity) THEN
            RAISE EXCEPTION 'No se pudo devolver el stock reservado';
        END IF;
        DELETE FROM cart_reservations WHERE cart_id = p_cart_id AND product_id = p_product_id
            AND variant_name = p_variant_name;
        r.quantity := 0;
        r.expires_at := NULL;
    END IF;
    delta := coalesce(r.quantity, 0) - p_quantity;
    IF delta <> 0 AND NOT cart_adjust_stock(p_product_id, p_variant_name, delta) THEN
        RAISE EXCEPTION 'Stock insuficiente';
    END IF;
    IF p_quantity = 0 THEN
        DELETE FROM cart_reservations WHERE cart_id = p_cart_id AND product_id = p_product_id
            AND variant_name = p_variant_name;
        RETURN QUERY SELECT 0, NULL::timestamptz;
    ELSE
        INSERT INTO cart_reservations(cart_id, product_id, variant_name, quantity, expires_at)
        VALUES (p_cart_id, p_product_id, p_variant_name, p_quantity,
            coalesce(r.expires_at, now() + interval '24 hours'))
        ON CONFLICT (cart_id, product_id, variant_name) DO UPDATE
            SET quantity = excluded.quantity, expires_at = excluded.expires_at;
        RETURN QUERY SELECT p_quantity, coalesce(r.expires_at, now() + interval '24 hours');
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION consume_cart_reservations(p_cart_id uuid, p_items jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE item jsonb; r cart_reservations%ROWTYPE; matched integer := 0;
BEGIN
    IF jsonb_typeof(p_items) <> 'array' THEN RETURN false; END IF;
    FOR item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
        SELECT * INTO r FROM cart_reservations WHERE cart_id = p_cart_id
            AND product_id = (item->>'product_id')::integer
            AND variant_name = coalesce(item->>'variant_name', '') FOR UPDATE;
        IF NOT FOUND OR r.expires_at <= now() OR r.quantity <> (item->>'quantity')::integer THEN
            RETURN false;
        END IF;
        matched := matched + 1;
    END LOOP;
    IF matched <> (SELECT count(*) FROM cart_reservations WHERE cart_id = p_cart_id)
        OR matched <> (SELECT count(*) FROM (
            SELECT DISTINCT value->>'product_id', coalesce(value->>'variant_name', '')
            FROM jsonb_array_elements(p_items)) AS unique_items) THEN RETURN false; END IF;
    DELETE FROM cart_reservations WHERE cart_id = p_cart_id;
    RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION cart_variant_name(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION protect_reserved_variants() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION cart_adjust_stock(integer, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION expire_cart_reservations() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION set_cart_reservation(uuid, integer, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION consume_cart_reservations(uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION cart_variant_name(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION protect_reserved_variants() TO service_role;
GRANT EXECUTE ON FUNCTION cart_adjust_stock(integer, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION expire_cart_reservations() TO service_role;
GRANT EXECUTE ON FUNCTION set_cart_reservation(uuid, integer, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION consume_cart_reservations(uuid, jsonb) TO service_role;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
SELECT cron.schedule('phonespot-expire-cart-reservations', '* * * * *',
    'SELECT public.expire_cart_reservations()');
