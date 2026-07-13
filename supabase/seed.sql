-- =============================================================================
-- CataLog — Datos de prueba (seed)
-- =============================================================================
-- CREDENCIALES DEMO
--   Email:           demo@catalog.com
--   Password:        demo1234
--   Catálogo slug:   mi-tienda-demo
--   URL pública:     /c/mi-tienda-demo
--
-- 3 productos de ejemplo:
--   1. "Camiseta básica"   → stock normal (25 unidades)
--   2. "Gorra edición lim." → pocas unidades (3)
--   3. "Sudadera premium"  → AGOTADA (0 unidades)
-- =============================================================================
--
-- ⚠️  IMPORTANTE — CÓMO USAR ESTE SEED
--
-- El usuario NO puede crearse desde SQL puro porque Supabase Auth gestiona
-- auth.users con su propio flujo (hash de contraseña, etc.). Sigue estos pasos:
--
-- 1) Crea el usuario demo de UNA de estas dos formas:
--    a) Supabase Dashboard → Authentication → Add user → email/password:
--         demo@catalog.com  /  demo1234   (marca "Auto confirm user")
--    b) O regístralo desde la app (POST /api/auth/register) con:
--         { "email": "demo@catalog.com", "password": "demo1234",
--           "full_name": "Tienda Demo" }
--
-- 2) El trigger handle_new_user() creará automáticamente la fila en
--    public.users. Copia ese UUID (Authentication → Users → ID).
--
-- 3) Pega el UUID abajo en :demo_user_id y ejecuta el resto del seed
--    en el SQL Editor.
-- =============================================================================

-- Reemplaza este UUID por el id real del usuario demo (paso 2 de arriba):
\set demo_user_id '00000000-0000-0000-0000-000000000000'

DO $$
DECLARE
    v_user_id    UUID := '00000000-0000-0000-0000-000000000000';  -- << REEMPLAZAR
    v_catalog_id UUID;
    v_cat_ropa   UUID;
    v_prod_id    UUID;
BEGIN
    -- Si dejaste el UUID por defecto, intenta resolverlo por email
    IF v_user_id = '00000000-0000-0000-0000-000000000000' THEN
        SELECT id INTO v_user_id FROM public.users WHERE email = 'demo@catalog.com' LIMIT 1;
    END IF;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No existe el usuario demo. Créalo primero (ver instrucciones arriba).';
    END IF;

    -- Catálogo demo
    INSERT INTO public.catalogs (user_id, name, slug, description, whatsapp, is_active)
    VALUES (v_user_id, 'Mi Tienda Demo', 'mi-tienda-demo',
            'Catálogo de demostración de CataLog', '5215555555555', TRUE)
    RETURNING id INTO v_catalog_id;

    -- Categoría
    INSERT INTO public.categories (catalog_id, name, position)
    VALUES (v_catalog_id, 'Ropa', 0)
    RETURNING id INTO v_cat_ropa;

    -- Producto 1: stock normal (25)
    INSERT INTO public.products (catalog_id, category_id, name, description, price, image_url, is_visible, position)
    VALUES (v_catalog_id, v_cat_ropa, 'Camiseta básica',
            'Camiseta de algodón 100%, varios colores.', 149.90, NULL, TRUE, 0)
    RETURNING id INTO v_prod_id;
    INSERT INTO public.inventory_movements (product_id, user_id, quantity, reason, notes)
    VALUES (v_prod_id, v_user_id, 25, 'stock_inicial', 'Carga inicial del seed');

    -- Producto 2: pocas unidades (3)
    INSERT INTO public.products (catalog_id, category_id, name, description, price, image_url, is_visible, position)
    VALUES (v_catalog_id, v_cat_ropa, 'Gorra edición limitada',
            'Gorra ajustable, edición limitada.', 299.00, NULL, TRUE, 1)
    RETURNING id INTO v_prod_id;
    INSERT INTO public.inventory_movements (product_id, user_id, quantity, reason, notes)
    VALUES (v_prod_id, v_user_id, 3, 'stock_inicial', 'Carga inicial del seed');

    -- Producto 3: agotado (0)
    INSERT INTO public.products (catalog_id, category_id, name, description, price, image_url, is_visible, position)
    VALUES (v_catalog_id, v_cat_ropa, 'Sudadera premium',
            'Sudadera con capucha, tela premium.', 599.00, NULL, TRUE, 2)
    RETURNING id INTO v_prod_id;
    -- Sin movimiento de stock → queda en 0 (agotado)

    RAISE NOTICE 'Seed completado. Catálogo: % (slug: mi-tienda-demo)', v_catalog_id;
END $$;
