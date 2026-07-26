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
    plan        TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
    role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    suspended_at TIMESTAMPTZ,
    suspended_by UUID,
    suspension_reason TEXT,
    deleted_at  TIMESTAMPTZ,
    deleted_by  UUID,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_suspended_by_fkey;
ALTER TABLE public.users
    ADD CONSTRAINT users_suspended_by_fkey
    FOREIGN KEY (suspended_by) REFERENCES public.users (id) ON DELETE SET NULL;

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_deleted_by_fkey;
ALTER TABLE public.users
    ADD CONSTRAINT users_deleted_by_fkey
    FOREIGN KEY (deleted_by) REFERENCES public.users (id) ON DELETE SET NULL;

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

-- El plan sólo se administra mediante procesos con privilegios administrativos.
-- RLS de public.users se conserva sin cambios para no alterar handle_new_user().
REVOKE ALL ON TABLE public.users FROM anon, authenticated;

-- Auditoría administrativa. No se expone directamente al cliente.
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id   UUID REFERENCES public.users (id) ON DELETE SET NULL,
    target_user_id  UUID REFERENCES public.users (id) ON DELETE SET NULL,
    action          TEXT NOT NULL CHECK (
        action IN ('plan_changed', 'account_suspended', 'account_reactivated', 'account_deleted')
    ),
    old_value       JSONB,
    new_value       JSONB,
    reason          TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.admin_audit_log FROM anon, authenticated;

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
CREATE INDEX IF NOT EXISTS idx_users_role_status            ON public.users (role, status);
CREATE INDEX IF NOT EXISTS idx_users_suspended_by           ON public.users (suspended_by);
CREATE INDEX IF NOT EXISTS idx_users_deleted_by             ON public.users (deleted_by);
CREATE INDEX IF NOT EXISTS idx_admin_audit_admin            ON public.admin_audit_log (admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_target           ON public.admin_audit_log (target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at       ON public.admin_audit_log (created_at DESC);

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
-- 8. Operaciones administrativas atómicas (solo service_role)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.admin_change_user_plan(
    p_admin_user_id UUID,
    p_target_user_id UUID,
    p_plan TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin public.users%ROWTYPE;
    v_target public.users%ROWTYPE;
BEGIN
    IF p_plan IS NULL OR p_plan NOT IN ('free', 'pro') THEN
        RAISE EXCEPTION 'INVALID_PLAN' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_admin FROM public.users WHERE id = p_admin_user_id FOR UPDATE;
    IF NOT FOUND OR v_admin.role <> 'admin' OR v_admin.status <> 'active' THEN
        RAISE EXCEPTION 'ADMIN_REQUIRED' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_target FROM public.users WHERE id = p_target_user_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'USER_NOT_FOUND' USING ERRCODE = 'P0001';
    END IF;
    IF v_target.status = 'deleted' THEN
        RAISE EXCEPTION 'ACCOUNT_DELETED' USING ERRCODE = 'P0001';
    END IF;
    IF v_target.plan = p_plan THEN
        RETURN jsonb_build_object('id', v_target.id, 'plan', v_target.plan);
    END IF;

    UPDATE public.users SET plan = p_plan WHERE id = p_target_user_id;
    INSERT INTO public.admin_audit_log (
        admin_user_id, target_user_id, action, old_value, new_value
    ) VALUES (
        p_admin_user_id, p_target_user_id, 'plan_changed',
        jsonb_build_object('plan', v_target.plan),
        jsonb_build_object('plan', p_plan)
    );
    RETURN jsonb_build_object('id', p_target_user_id, 'plan', p_plan);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_change_user_status(
    p_admin_user_id UUID,
    p_target_user_id UUID,
    p_status TEXT,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin public.users%ROWTYPE;
    v_target public.users%ROWTYPE;
    v_action TEXT;
BEGIN
    IF p_status IS NULL OR p_status NOT IN ('active', 'suspended') THEN
        RAISE EXCEPTION 'INVALID_STATUS' USING ERRCODE = 'P0001';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtext('admin_account_management'));
    SELECT * INTO v_admin FROM public.users WHERE id = p_admin_user_id FOR UPDATE;
    IF NOT FOUND OR v_admin.role <> 'admin' OR v_admin.status <> 'active' THEN
        RAISE EXCEPTION 'ADMIN_REQUIRED' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_target FROM public.users WHERE id = p_target_user_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'USER_NOT_FOUND' USING ERRCODE = 'P0001';
    END IF;
    IF v_target.status = 'deleted' THEN
        RAISE EXCEPTION 'ACCOUNT_DELETED' USING ERRCODE = 'P0001';
    END IF;
    IF p_status = 'suspended' AND p_admin_user_id = p_target_user_id THEN
        RAISE EXCEPTION 'CANNOT_SUSPEND_SELF' USING ERRCODE = 'P0001';
    END IF;
    IF p_status = 'suspended' AND NULLIF(BTRIM(p_reason), '') IS NULL THEN
        RAISE EXCEPTION 'SUSPENSION_REASON_REQUIRED' USING ERRCODE = 'P0001';
    END IF;
    IF p_status = 'suspended'
       AND v_target.role = 'admin'
       AND v_target.status = 'active'
       AND NOT EXISTS (
           SELECT 1 FROM public.users
            WHERE role = 'admin' AND status = 'active' AND id <> p_target_user_id
       ) THEN
        RAISE EXCEPTION 'LAST_ACTIVE_ADMIN' USING ERRCODE = 'P0001';
    END IF;
    IF v_target.status = p_status THEN
        RETURN jsonb_build_object('id', v_target.id, 'status', v_target.status);
    END IF;

    IF p_status = 'suspended' THEN
        UPDATE public.users
           SET status = 'suspended',
               suspended_at = NOW(),
               suspended_by = p_admin_user_id,
               suspension_reason = BTRIM(p_reason)
         WHERE id = p_target_user_id;
        v_action := 'account_suspended';
    ELSE
        UPDATE public.users
           SET status = 'active',
               suspended_at = NULL,
               suspended_by = NULL,
               suspension_reason = NULL
         WHERE id = p_target_user_id;
        v_action := 'account_reactivated';
    END IF;

    INSERT INTO public.admin_audit_log (
        admin_user_id, target_user_id, action, old_value, new_value, reason
    ) VALUES (
        p_admin_user_id, p_target_user_id, v_action,
        jsonb_build_object('status', v_target.status),
        jsonb_build_object('status', p_status),
        CASE WHEN p_status = 'suspended' THEN BTRIM(p_reason) ELSE NULL END
    );
    RETURN jsonb_build_object('id', p_target_user_id, 'status', p_status);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_soft_delete_user(
    p_admin_user_id UUID,
    p_target_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin public.users%ROWTYPE;
    v_target public.users%ROWTYPE;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtext('admin_account_management'));
    SELECT * INTO v_admin FROM public.users WHERE id = p_admin_user_id FOR UPDATE;
    IF NOT FOUND OR v_admin.role <> 'admin' OR v_admin.status <> 'active' THEN
        RAISE EXCEPTION 'ADMIN_REQUIRED' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_target FROM public.users WHERE id = p_target_user_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'USER_NOT_FOUND' USING ERRCODE = 'P0001';
    END IF;
    IF p_admin_user_id = p_target_user_id THEN
        RAISE EXCEPTION 'CANNOT_DELETE_SELF' USING ERRCODE = 'P0001';
    END IF;
    IF v_target.status = 'deleted' THEN
        RETURN jsonb_build_object('id', v_target.id, 'status', v_target.status);
    END IF;
    IF v_target.role = 'admin'
       AND v_target.status = 'active'
       AND NOT EXISTS (
           SELECT 1 FROM public.users
            WHERE role = 'admin' AND status = 'active' AND id <> p_target_user_id
       ) THEN
        RAISE EXCEPTION 'LAST_ACTIVE_ADMIN' USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.users
       SET status = 'deleted',
           deleted_at = NOW(),
           deleted_by = p_admin_user_id,
           suspended_at = NULL,
           suspended_by = NULL,
           suspension_reason = NULL
     WHERE id = p_target_user_id;
    INSERT INTO public.admin_audit_log (
        admin_user_id, target_user_id, action, old_value, new_value
    ) VALUES (
        p_admin_user_id, p_target_user_id, 'account_deleted',
        jsonb_build_object('status', v_target.status),
        jsonb_build_object('status', 'deleted')
    );
    RETURN jsonb_build_object('id', p_target_user_id, 'status', 'deleted');
END;
$$;

REVOKE ALL ON FUNCTION public.admin_change_user_plan(UUID, UUID, TEXT)
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_change_user_status(UUID, UUID, TEXT, TEXT)
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_soft_delete_user(UUID, UUID)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_change_user_plan(UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_change_user_status(UUID, UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_soft_delete_user(UUID, UUID) TO service_role;

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
