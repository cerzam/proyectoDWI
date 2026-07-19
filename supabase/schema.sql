-- =============================================================================
-- CataLog — Esquema completo de base de datos
-- PostgreSQL 15 (Supabase)
-- Ejecutar este archivo en: Supabase Dashboard → SQL Editor → New query
-- =============================================================================

-- Extensión para generar UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. public.users  (espejo de auth.users)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id          UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    email       TEXT,
    full_name   TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: al crear un usuario en auth.users, replicar en public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 2. public.catalogs
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.catalogs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    slug         TEXT NOT NULL UNIQUE,
    description  TEXT,
    whatsapp     TEXT,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 3. public.categories
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    catalog_id  UUID NOT NULL REFERENCES public.catalogs (id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    position    SMALLINT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 4. public.products
--    El campo stock NUNCA debe escribirse directamente desde la aplicación.
--    Solo se modifica a través de inventory_movements (trigger trg_update_stock).
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    catalog_id   UUID NOT NULL REFERENCES public.catalogs (id) ON DELETE CASCADE,
    category_id  UUID REFERENCES public.categories (id) ON DELETE SET NULL,
    name         TEXT NOT NULL,
    description  TEXT,
    price        NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    stock        INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    image_url    TEXT,
    images       TEXT[] NOT NULL DEFAULT '{}' CHECK (array_length(images, 1) IS NULL OR array_length(images, 1) <= 5),
    is_visible   BOOLEAN NOT NULL DEFAULT TRUE,
    position     SMALLINT NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 5. public.inventory_movements
--    Cada entrada/salida de stock se registra aquí. El trigger actualiza
--    products.stock sumando NEW.quantity (positivo = entrada, negativo = salida).
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES public.users (id),
    quantity    INTEGER NOT NULL,
    reason      VARCHAR(100) NOT NULL,
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: actualizar stock del producto al insertar un movimiento
CREATE OR REPLACE FUNCTION public.update_stock_on_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.products
       SET stock      = stock + NEW.quantity,
           updated_at = NOW()
     WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_stock ON public.inventory_movements;
CREATE TRIGGER trg_update_stock
    AFTER INSERT ON public.inventory_movements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_stock_on_movement();

-- =============================================================================
-- 6. Índices (todas las FK + catalogs.slug)
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_catalogs_user_id            ON public.catalogs (user_id);
CREATE INDEX IF NOT EXISTS idx_catalogs_slug               ON public.catalogs (slug);
CREATE INDEX IF NOT EXISTS idx_categories_catalog_id       ON public.categories (catalog_id);
CREATE INDEX IF NOT EXISTS idx_products_catalog_id         ON public.products (catalog_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id        ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_movements_product_id        ON public.inventory_movements (product_id);
CREATE INDEX IF NOT EXISTS idx_movements_user_id           ON public.inventory_movements (user_id);

-- =============================================================================
-- 7. Row Level Security (RLS)
--    Nota: el backend usa SERVICE_ROLE_KEY (omite RLS). Estas políticas
--    protegen el acceso directo con la clave anónima (ej. cliente Supabase
--    en el frontend para Storage / lecturas públicas).
-- =============================================================================
ALTER TABLE public.catalogs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- ---- catalogs ----
DROP POLICY IF EXISTS owner_catalogs ON public.catalogs;
CREATE POLICY owner_catalogs ON public.catalogs
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ---- categories ----
DROP POLICY IF EXISTS owner_categories ON public.categories;
CREATE POLICY owner_categories ON public.categories
    FOR ALL
    USING (catalog_id IN (SELECT id FROM public.catalogs WHERE user_id = auth.uid()))
    WITH CHECK (catalog_id IN (SELECT id FROM public.catalogs WHERE user_id = auth.uid()));

-- ---- products ----
DROP POLICY IF EXISTS owner_products ON public.products;
CREATE POLICY owner_products ON public.products
    FOR ALL
    USING (catalog_id IN (SELECT id FROM public.catalogs WHERE user_id = auth.uid()))
    WITH CHECK (catalog_id IN (SELECT id FROM public.catalogs WHERE user_id = auth.uid()));

-- Lectura pública: cualquiera puede ver productos visibles (catálogo público)
DROP POLICY IF EXISTS public_visible_products ON public.products;
CREATE POLICY public_visible_products ON public.products
    FOR SELECT
    USING (is_visible = TRUE);

-- ---- inventory_movements ----
DROP POLICY IF EXISTS owner_movements ON public.inventory_movements;
CREATE POLICY owner_movements ON public.inventory_movements
    FOR ALL
    USING (
        product_id IN (
            SELECT id FROM public.products
            WHERE catalog_id IN (SELECT id FROM public.catalogs WHERE user_id = auth.uid())
        )
    )
    WITH CHECK (
        product_id IN (
            SELECT id FROM public.products
            WHERE catalog_id IN (SELECT id FROM public.catalogs WHERE user_id = auth.uid())
        )
    );

-- =============================================================================
-- STORAGE — IMPORTANTE (paso manual)
-- =============================================================================
-- El bucket de imágenes de productos NO se crea desde este SQL.
-- Debes crearlo manualmente en el Dashboard de Supabase:
--
--   1. Ve a Supabase Dashboard → Storage → New bucket
--   2. Nombre del bucket:  product-images
--   3. Marca la opción "Public bucket" (acceso PÚBLICO de lectura) para que
--      las URLs de getPublicUrl() sean accesibles sin autenticación.
--   4. (Opcional) Agrega una política de subida para usuarios autenticados.
--
-- Las imágenes se suben directamente desde el frontend a:
--   product-images/{catalog_id}/{timestamp}-{filename}
-- y el backend solo recibe la image_url ya generada.
-- =============================================================================
