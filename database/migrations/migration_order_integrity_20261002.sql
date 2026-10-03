-- Additive migration. Historic orders are not assumed to have consumed stock.
BEGIN;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS request_key uuid;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cart_id uuid;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS request_hash text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_ars numeric(14,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dollar_rate numeric(14,4);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_cost_ars numeric(14,2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS inventory_committed boolean NOT NULL DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS inventory_restored boolean NOT NULL DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS session_version integer NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS orders_request_key_idx ON public.orders(request_key) WHERE request_key IS NOT NULL;

CREATE OR REPLACE FUNCTION public.create_store_order(p_key uuid, p_cart uuid, p_owner integer, p_order jsonb, p_items jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE existing public.orders%ROWTYPE; inserted public.orders%ROWTYPE; item jsonb; product public.products%ROWTYPE; variant jsonb; current_price numeric;
BEGIN
    IF p_key IS NULL OR p_cart IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 30
        OR coalesce((p_order->>'total')::numeric,-1) < 0 OR coalesce((p_order->>'dollar_rate')::numeric,0) <= 0 THEN
        RAISE EXCEPTION 'Datos de pedido inválidos';
    END IF;
    PERFORM pg_advisory_xact_lock(hashtextextended(p_key::text, 0));
    SELECT * INTO existing FROM public.orders WHERE request_key=p_key;
    IF FOUND THEN
        IF existing.cart_id <> p_cart OR existing.user_id IS DISTINCT FROM p_owner OR existing.request_hash IS DISTINCT FROM p_order->>'request_hash' THEN
            RAISE EXCEPTION 'El identificador ya corresponde a otro pedido';
        END IF;
        RETURN jsonb_build_object('order',to_jsonb(existing),'replayed',true);
    END IF;
    -- Same lock order as stock reservations, expiry and cancellation.
    PERFORM 1 FROM public.products WHERE id IN (SELECT (value->>'product_id')::integer FROM jsonb_array_elements(p_items)) ORDER BY id FOR UPDATE;
    FOR item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
        IF (item->>'quantity')::integer NOT BETWEEN 1 AND 20 OR coalesce((item->>'price')::numeric,-1) < 0 THEN RAISE EXCEPTION 'Artículo inválido'; END IF;
        SELECT * INTO product FROM public.products WHERE id=(item->>'product_id')::integer;
        IF NOT FOUND OR product.archived_at IS NOT NULL THEN RAISE EXCEPTION 'Producto no disponible'; END IF;
        current_price := product.price;
        IF jsonb_array_length(coalesce(product.variants,'[]'::jsonb))>0 THEN
            SELECT value INTO variant FROM jsonb_array_elements(product.variants) WHERE public.cart_variant_name(value)=coalesce(item->>'variant_name','');
            IF NOT FOUND THEN RAISE EXCEPTION 'Variante no disponible'; END IF;
            IF coalesce((variant->>'price')::numeric,0)>0 THEN current_price:=(variant->>'price')::numeric; END IF;
        END IF;
        IF current_price IS DISTINCT FROM (item->>'base_price')::numeric THEN RAISE EXCEPTION 'El precio cambió. Revisá el carrito'; END IF;
    END LOOP;
    IF NOT public.consume_cart_reservations(p_cart,p_items) THEN RAISE EXCEPTION 'La reserva venció o cambió'; END IF;
    INSERT INTO public.orders(user_id,total,shipping_address,status,customer_name,customer_email,customer_phone,payment_method,shipping_method,
        request_key,cart_id,request_hash,total_ars,dollar_rate,shipping_cost_ars,inventory_committed)
    VALUES(p_owner,(p_order->>'total')::numeric,p_order->>'shipping_address','pending',p_order->>'customer_name',p_order->>'customer_email',
        p_order->>'customer_phone',p_order->>'payment_method',p_order->>'shipping_method',p_key,p_cart,p_order->>'request_hash',
        (p_order->>'total_ars')::numeric,(p_order->>'dollar_rate')::numeric,(p_order->>'shipping_cost_ars')::numeric,true)
    RETURNING * INTO inserted;
    INSERT INTO public.order_items(order_id,product_id,quantity,price,variant_name)
    SELECT inserted.id,(value->>'product_id')::integer,(value->>'quantity')::integer,(value->>'price')::numeric,nullif(value->>'variant_name','') FROM jsonb_array_elements(p_items);
    RETURN jsonb_build_object('order',to_jsonb(inserted),'replayed',false);
END;
$$;

CREATE OR REPLACE FUNCTION public.transition_store_order(p_id integer,p_status text,p_tracking text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE purchase public.orders%ROWTYPE; item public.order_items%ROWTYPE; allowed text[];
BEGIN
    SELECT * INTO purchase FROM public.orders WHERE id=p_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Pedido no encontrado'; END IF;
    IF purchase.status=p_status THEN
        IF purchase.tracking_code IS DISTINCT FROM nullif(p_tracking,'') THEN
            UPDATE public.orders SET tracking_code=nullif(p_tracking,''),updated_at=now() WHERE id=p_id RETURNING * INTO purchase;
            RETURN jsonb_build_object('order',to_jsonb(purchase),'changed',true);
        END IF;
        RETURN jsonb_build_object('order',to_jsonb(purchase),'changed',false);
    END IF;
    allowed := CASE purchase.status
        WHEN 'pending' THEN ARRAY['confirmed','preparing','completed','cancelled']
        WHEN 'confirmed' THEN ARRAY['preparing','completed','cancelled']
        WHEN 'preparing' THEN ARRAY['shipped','completed','cancelled']
        WHEN 'shipped' THEN ARRAY['delivered','completed']
        WHEN 'delivered' THEN ARRAY['completed'] ELSE ARRAY[]::text[] END;
    IF NOT p_status=ANY(allowed) THEN RAISE EXCEPTION 'Transición de estado no permitida'; END IF;
    IF p_status='cancelled' AND purchase.inventory_committed AND NOT purchase.inventory_restored THEN
        PERFORM 1 FROM public.products WHERE id IN (SELECT product_id FROM public.order_items WHERE order_id=p_id) ORDER BY id FOR UPDATE;
        FOR item IN SELECT * FROM public.order_items WHERE order_id=p_id ORDER BY product_id LOOP
            IF item.product_id IS NULL OR NOT public.cart_adjust_stock(item.product_id,coalesce(item.variant_name,''),item.quantity) THEN
                RAISE EXCEPTION 'No se pudo restituir el stock de la variante';
            END IF;
        END LOOP;
    END IF;
    UPDATE public.orders SET status=p_status,tracking_code=nullif(p_tracking,''),updated_at=now(),
        inventory_restored=inventory_restored OR (p_status='cancelled' AND inventory_committed)
    WHERE id=p_id RETURNING * INTO purchase;
    RETURN jsonb_build_object('order',to_jsonb(purchase),'changed',true);
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_store_password(p_user integer,p_version integer,p_password text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
BEGIN
    UPDATE public.users SET password=p_password,session_version=session_version+1 WHERE id=p_user AND session_version=p_version;
    RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.create_store_order(uuid,uuid,integer,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.transition_store_order(integer,text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.reset_store_password(integer,integer,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_store_order(uuid,uuid,integer,jsonb,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.transition_store_order(integer,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.reset_store_password(integer,integer,text) TO service_role;
COMMIT;
