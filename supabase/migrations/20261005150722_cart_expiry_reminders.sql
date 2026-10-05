-- Private transactional reminders. Existing reservations and stock rules are unchanged.
ALTER TABLE public.cart_reservations ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

CREATE TABLE public.cart_reminder_contacts (
    cart_id uuid PRIMARY KEY,
    user_id integer NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    enabled boolean NOT NULL DEFAULT true,
    active_delivery_id uuid,
    next_attempt_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.cart_reminder_deliveries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id uuid NOT NULL REFERENCES public.cart_reminder_contacts(cart_id) ON DELETE CASCADE,
    user_id integer NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    payload jsonb NOT NULL,
    state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','sent','cancelled')),
    lease_token uuid,
    locked_until timestamptz,
    attempts integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    sent_at timestamptz
);
CREATE INDEX cart_reminder_contacts_due_idx ON public.cart_reminder_contacts(next_attempt_at) WHERE enabled;
CREATE INDEX cart_reminder_delivery_cleanup_idx ON public.cart_reminder_deliveries(created_at);
ALTER TABLE public.cart_reminder_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_reminder_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cart_reminder_contacts, public.cart_reminder_deliveries FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.cart_reminder_contacts, public.cart_reminder_deliveries TO service_role;

CREATE FUNCTION public.set_cart_reminder_contact(p_cart_id uuid,p_user_id integer,p_enabled boolean DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE c public.cart_reminder_contacts%ROWTYPE;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id=p_user_id AND email IS NOT NULL AND email<>'') THEN
        RAISE EXCEPTION 'Cuenta inválida';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.cart_reminder_contacts WHERE cart_id=p_cart_id)
       AND NOT EXISTS (SELECT 1 FROM public.cart_reservations WHERE cart_id=p_cart_id AND expires_at>now()) THEN
        RETURN false;
    END IF;
    INSERT INTO public.cart_reminder_contacts(cart_id,user_id,enabled)
        VALUES(p_cart_id,p_user_id,coalesce(p_enabled,true)) ON CONFLICT(cart_id) DO NOTHING;
    SELECT * INTO c FROM public.cart_reminder_contacts WHERE cart_id=p_cart_id FOR UPDATE;
    IF c.user_id<>p_user_id THEN RAISE EXCEPTION 'Carrito asociado a otro cliente'; END IF;
    -- NULL means automatic synchronization: never undo a customer's opt-out.
    UPDATE public.cart_reminder_contacts SET enabled=coalesce(p_enabled,enabled),updated_at=now()
        WHERE cart_id=p_cart_id RETURNING enabled INTO c.enabled;
    RETURN c.enabled;
END;
$$;

CREATE FUNCTION public.cart_reminder_is_current(p_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.cart_reminder_deliveries d
        JOIN public.cart_reminder_contacts c ON c.cart_id=d.cart_id AND c.user_id=d.user_id
        JOIN public.users u ON u.id=d.user_id
        WHERE d.id=p_id AND d.state='pending' AND c.enabled
        AND u.email=d.payload->>'email'
        AND (d.payload->>'expires_at')::timestamptz>now()
        AND jsonb_array_length(d.payload->'items')>0
        AND NOT EXISTS (
            SELECT 1 FROM jsonb_array_elements(d.payload->'items') i
            WHERE NOT EXISTS (
                SELECT 1 FROM public.cart_reservations r JOIN public.products p ON p.id=r.product_id
                WHERE r.cart_id=d.cart_id AND r.product_id=(i->>'product_id')::integer
                AND r.variant_name=i->>'variant_name' AND r.quantity=(i->>'quantity')::integer
                AND r.expires_at=(i->>'expires_at')::timestamptz AND r.expires_at>now()
                AND r.reminder_sent_at IS NULL AND p.archived_at IS NULL
            )
        )
    );
$$;

CREATE FUNCTION public.claim_cart_reminders(p_lead_minutes integer DEFAULT 60,p_limit integer DEFAULT 5)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE c public.cart_reminder_contacts%ROWTYPE;d public.cart_reminder_deliveries%ROWTYPE;
    items jsonb; expires timestamptz; recipient record; claimed jsonb:='[]'::jsonb;
BEGIN
    IF p_lead_minutes<5 OR p_lead_minutes>240 OR p_limit<1 OR p_limit>20 THEN
        RAISE EXCEPTION 'Configuración de recordatorios inválida';
    END IF;
    -- Delivery data is private and retained for at most 30 days after it is no longer active.
    DELETE FROM public.cart_reminder_contacts c0 WHERE c0.updated_at<now()-interval '30 days'
        AND NOT EXISTS(SELECT 1 FROM public.cart_reservations r WHERE r.cart_id=c0.cart_id AND r.expires_at>now());
    DELETE FROM public.cart_reminder_deliveries WHERE state<>'pending' AND created_at<now()-interval '30 days';
    FOR c IN SELECT c1.* FROM public.cart_reminder_contacts c1
        WHERE c1.enabled AND c1.next_attempt_at<=now()
        AND (c1.active_delivery_id IS NOT NULL OR EXISTS (
            SELECT 1 FROM public.cart_reservations r JOIN public.products p ON p.id=r.product_id
            WHERE r.cart_id=c1.cart_id AND r.expires_at>now() AND r.expires_at<=now()+make_interval(mins=>p_lead_minutes)
            AND r.reminder_sent_at IS NULL AND p.archived_at IS NULL))
        ORDER BY c1.next_attempt_at,c1.cart_id LIMIT p_limit FOR UPDATE OF c1 SKIP LOCKED
    LOOP
        d:=NULL;
        IF c.active_delivery_id IS NOT NULL THEN
            SELECT * INTO d FROM public.cart_reminder_deliveries WHERE id=c.active_delivery_id FOR UPDATE;
            IF FOUND AND d.state='pending' AND d.locked_until>now() THEN CONTINUE; END IF;
            IF d.id IS NOT NULL AND NOT public.cart_reminder_is_current(d.id) THEN
                UPDATE public.cart_reminder_deliveries SET state='cancelled',lease_token=NULL,locked_until=NULL WHERE id=d.id;
                d:=NULL;
                UPDATE public.cart_reminder_contacts SET active_delivery_id=NULL WHERE cart_id=c.cart_id;
            END IF;
        END IF;
        IF d.id IS NULL THEN
            SELECT jsonb_agg(jsonb_build_object('product_id',r.product_id,'variant_name',r.variant_name,
                    'quantity',r.quantity,'expires_at',r.expires_at,'name',p.name) ORDER BY r.expires_at,r.product_id,r.variant_name),min(r.expires_at)
                INTO items,expires FROM public.cart_reservations r JOIN public.products p ON p.id=r.product_id
                WHERE r.cart_id=c.cart_id AND r.expires_at>now() AND r.expires_at<=now()+make_interval(mins=>p_lead_minutes)
                AND r.reminder_sent_at IS NULL AND p.archived_at IS NULL;
            IF items IS NULL THEN CONTINUE; END IF;
            SELECT email,name INTO recipient FROM public.users WHERE id=c.user_id;
            IF NOT FOUND OR recipient.email IS NULL OR recipient.email='' THEN CONTINUE; END IF;
            INSERT INTO public.cart_reminder_deliveries(cart_id,user_id,payload)
                VALUES(c.cart_id,c.user_id,jsonb_build_object('email',recipient.email,'name',recipient.name,'items',items,'expires_at',expires)) RETURNING * INTO d;
            UPDATE public.cart_reminder_contacts SET active_delivery_id=d.id WHERE cart_id=c.cart_id;
        END IF;
        UPDATE public.cart_reminder_deliveries SET lease_token=gen_random_uuid(),locked_until=now()+interval '10 minutes',attempts=attempts+1
            WHERE id=d.id RETURNING * INTO d;
        UPDATE public.cart_reminder_contacts SET next_attempt_at=d.locked_until WHERE cart_id=c.cart_id;
        claimed:=claimed||jsonb_build_array(jsonb_build_object('id',d.id,'cart_id',d.cart_id,'user_id',d.user_id,'lease_token',d.lease_token,'payload',d.payload));
    END LOOP;
    RETURN claimed;
END;
$$;

CREATE FUNCTION public.validate_cart_reminder(p_id uuid,p_lease uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$
    SELECT EXISTS(SELECT 1 FROM public.cart_reminder_deliveries WHERE id=p_id AND lease_token=p_lease AND locked_until>now())
        AND public.cart_reminder_is_current(p_id);
$$;

CREATE FUNCTION public.finish_cart_reminder(p_id uuid,p_lease uuid,p_sent boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE d public.cart_reminder_deliveries%ROWTYPE;cart uuid;
BEGIN
    SELECT cart_id INTO cart FROM public.cart_reminder_deliveries WHERE id=p_id;
    IF NOT FOUND THEN RETURN false; END IF;
    -- Always lock contact before delivery, matching the claim function's lock order.
    PERFORM 1 FROM public.cart_reminder_contacts WHERE cart_id=cart FOR UPDATE;
    SELECT * INTO d FROM public.cart_reminder_deliveries WHERE id=p_id FOR UPDATE;
    IF d.state<>'pending' OR d.lease_token IS DISTINCT FROM p_lease THEN RETURN false; END IF;
    IF p_sent THEN
        UPDATE public.cart_reservations r SET reminder_sent_at=now()
            FROM jsonb_array_elements(d.payload->'items') i
            WHERE r.cart_id=d.cart_id AND r.product_id=(i->>'product_id')::integer
            AND r.variant_name=i->>'variant_name' AND r.expires_at=(i->>'expires_at')::timestamptz;
        UPDATE public.cart_reminder_deliveries SET state='sent',sent_at=now(),lease_token=NULL,locked_until=NULL WHERE id=p_id;
        UPDATE public.cart_reminder_contacts SET active_delivery_id=NULL,next_attempt_at=now() WHERE cart_id=d.cart_id AND active_delivery_id=p_id;
    ELSE
        UPDATE public.cart_reminder_deliveries SET lease_token=NULL,locked_until=NULL WHERE id=p_id;
        UPDATE public.cart_reminder_contacts SET next_attempt_at=now()+interval '5 minutes' WHERE cart_id=d.cart_id AND active_delivery_id=p_id;
    END IF;
    RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.set_cart_reminder_contact(uuid,integer,boolean) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.cart_reminder_is_current(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.claim_cart_reminders(integer,integer) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.validate_cart_reminder(uuid,uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.finish_cart_reminder(uuid,uuid,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.set_cart_reminder_contact(uuid,integer,boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.cart_reminder_is_current(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_cart_reminders(integer,integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.validate_cart_reminder(uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.finish_cart_reminder(uuid,uuid,boolean) TO service_role;
