-- All fixture rows are rolled back. No customer orders or inventory are touched.
BEGIN;
DO $$
DECLARE product_id integer; user_id integer; cart uuid:=gen_random_uuid(); key uuid:=gen_random_uuid();
    items jsonb; details jsonb; first jsonb; retry jsonb; cancelled jsonb; amount integer; version integer;
BEGIN
    INSERT INTO public.products(name,price,category,stock,variants) VALUES('__PhoneSpot rollback fixture__',100,'celulares',10,'[]') RETURNING id INTO product_id;
    PERFORM public.set_cart_reservation(cart,product_id,'',2);
    items:=jsonb_build_array(jsonb_build_object('product_id',product_id,'quantity',2,'price',100,'base_price',100,'variant_name',''));
    details:=jsonb_build_object('total',200,'total_ars',200000,'dollar_rate',1000,'shipping_cost_ars',0,'shipping_address','Fixture rollback 123',
        'customer_name','Fixture rollback','customer_email','rollback@example.invalid','customer_phone','3447416011','payment_method','transferencia','shipping_method','A coordinar','request_hash','fixture');
    first:=public.create_store_order(key,cart,null,details,items);
    retry:=public.create_store_order(key,cart,null,details,items);
    IF first->'order'->>'id' IS DISTINCT FROM retry->'order'->>'id' OR NOT (retry->>'replayed')::boolean THEN RAISE EXCEPTION 'Idempotency failed'; END IF;
    SELECT count(*) INTO amount FROM public.orders WHERE request_key=key;
    IF amount<>1 THEN RAISE EXCEPTION 'Duplicate order'; END IF;
    SELECT stock INTO amount FROM public.products WHERE id=product_id;
    IF amount<>8 THEN RAISE EXCEPTION 'Unexpected stock after purchase'; END IF;
    SELECT count(*) INTO amount FROM public.cart_reservations WHERE cart_id=cart;
    IF amount<>0 THEN RAISE EXCEPTION 'Reservations not consumed'; END IF;
    cancelled:=public.transition_store_order((first->'order'->>'id')::integer,'cancelled','');
    PERFORM public.transition_store_order((first->'order'->>'id')::integer,'cancelled','');
    SELECT stock INTO amount FROM public.products WHERE id=product_id;
    IF amount<>10 THEN RAISE EXCEPTION 'Cancellation restored stock incorrectly'; END IF;
    BEGIN
        PERFORM public.transition_store_order((first->'order'->>'id')::integer,'pending','');
        RAISE EXCEPTION USING ERRCODE='XX000',MESSAGE='Cancelled order reopened';
    EXCEPTION WHEN raise_exception THEN NULL; END;
    -- A changed price must not consume the reservation or persist an order.
    cart:=gen_random_uuid();key:=gen_random_uuid();
    PERFORM public.set_cart_reservation(cart,product_id,'',2);
    BEGIN
        PERFORM public.create_store_order(key,cart,null,details,jsonb_set(items,'{0,base_price}','99'));
        RAISE EXCEPTION USING ERRCODE='XX000',MESSAGE='Price mismatch accepted';
    EXCEPTION WHEN raise_exception THEN NULL; END;
    SELECT count(*) INTO amount FROM public.orders WHERE request_key=key;
    IF amount<>0 THEN RAISE EXCEPTION 'Failed order persisted'; END IF;
    SELECT count(*) INTO amount FROM public.cart_reservations WHERE cart_id=cart;
    IF amount<>1 THEN RAISE EXCEPTION 'Failed order lost reservation'; END IF;
    INSERT INTO public.users(name,email,password,role) VALUES('Rollback fixture',gen_random_uuid()||'@example.invalid','fixture','client') RETURNING id INTO user_id;
    IF NOT public.reset_store_password(user_id,0,'changed-fixture') THEN RAISE EXCEPTION 'Reset failed'; END IF;
    IF public.reset_store_password(user_id,0,'reused-fixture') THEN RAISE EXCEPTION 'Reset token reused'; END IF;
    SELECT session_version INTO version FROM public.users WHERE id=user_id;
    IF version<>1 THEN RAISE EXCEPTION 'Sessions not revoked'; END IF;
END;
$$;
ROLLBACK;
SELECT 'atomic purchase, idempotency, cancellation, rollback and password reset passed' AS result;
