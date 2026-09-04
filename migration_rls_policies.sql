-- PhoneSpot: Migracion de Seguridad y Politicas RLS (Supabase)
-- Fecha: 2026-09-04
-- Ejecutar en el SQL Editor del Dashboard de Supabase.

ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS site_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS products_public_select ON products;
DROP POLICY IF EXISTS products_service_role_all ON products;
DROP POLICY IF EXISTS reviews_public_select_approved ON reviews;
DROP POLICY IF EXISTS reviews_service_role_all ON reviews;
DROP POLICY IF EXISTS users_service_role_all ON users;
DROP POLICY IF EXISTS orders_service_role_all ON orders;
DROP POLICY IF EXISTS order_items_service_role_all ON order_items;
DROP POLICY IF EXISTS stock_alerts_service_role_all ON stock_alerts;
DROP POLICY IF EXISTS site_events_service_role_all ON site_events;

CREATE POLICY products_public_select ON products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY products_service_role_all ON products FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY reviews_public_select_approved ON reviews FOR SELECT TO anon, authenticated USING (approved = true);
CREATE POLICY reviews_service_role_all ON reviews FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY users_service_role_all ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY orders_service_role_all ON orders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY order_items_service_role_all ON order_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY stock_alerts_service_role_all ON stock_alerts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY site_events_service_role_all ON site_events FOR ALL TO service_role USING (true) WITH CHECK (true);
