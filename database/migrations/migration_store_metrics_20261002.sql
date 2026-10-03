BEGIN;
ALTER TABLE public.site_events DROP CONSTRAINT IF EXISTS site_events_event_type_check;
ALTER TABLE public.site_events ADD CONSTRAINT site_events_event_type_check CHECK (event_type IN ('page_view','product_view','add_to_cart','checkout_started','order_created','search','search_empty','contact_click','web_vital'));
COMMIT;
