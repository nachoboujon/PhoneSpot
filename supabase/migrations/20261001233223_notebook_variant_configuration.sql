-- Optional notebook configuration: existing phone reservation names remain identical.
CREATE OR REPLACE FUNCTION public.cart_variant_name(v jsonb) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
    SELECT concat_ws(' - ', nullif(v->>'color', ''), nullif(v->>'capacity', ''),
        nullif(v->>'ram', ''), CASE WHEN nullif(v->>'batt', '') IS NOT NULL
        THEN 'Bat: ' || (v->>'batt') END,
        CASE WHEN nullif(v->>'condition', '') IS NOT NULL
        THEN 'Cond: ' || (v->>'condition') END,
        CASE WHEN nullif(v->>'configuration', '') IS NOT NULL
        THEN 'Config: ' || (v->>'configuration') END);
$$;
