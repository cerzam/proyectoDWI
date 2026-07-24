-- Administración de cuentas: roles, estados, auditoría y mutaciones atómicas.
-- Esta migración es idempotente y no promueve automáticamente a ningún usuario.

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS role TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT,
    ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS suspended_by UUID,
    ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Solo completa filas que aún no tengan valor. Una segunda ejecución no degrada admins.
UPDATE public.users SET role = 'user' WHERE role IS NULL;
UPDATE public.users SET status = 'active' WHERE status IS NULL;

ALTER TABLE public.users
    ALTER COLUMN role SET DEFAULT 'user',
    ALTER COLUMN role SET NOT NULL,
    ALTER COLUMN status SET DEFAULT 'active',
    ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users
    ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE public.users
    ADD CONSTRAINT users_status_check CHECK (status IN ('active', 'suspended', 'deleted'));

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint
         WHERE conname = 'users_suspended_by_fkey'
           AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT users_suspended_by_fkey
            FOREIGN KEY (suspended_by) REFERENCES public.users (id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint
         WHERE conname = 'users_deleted_by_fkey'
           AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT users_deleted_by_fkey
            FOREIGN KEY (deleted_by) REFERENCES public.users (id) ON DELETE SET NULL;
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_users_role_status ON public.users (role, status);
CREATE INDEX IF NOT EXISTS idx_users_suspended_by ON public.users (suspended_by);
CREATE INDEX IF NOT EXISTS idx_users_deleted_by ON public.users (deleted_by);

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

CREATE INDEX IF NOT EXISTS idx_admin_audit_admin ON public.admin_audit_log (admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_target ON public.admin_audit_log (target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at ON public.admin_audit_log (created_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.admin_audit_log FROM anon, authenticated;
REVOKE ALL ON TABLE public.users FROM anon, authenticated;

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

    SELECT * INTO v_admin
      FROM public.users
     WHERE id = p_admin_user_id
     FOR UPDATE;

    IF NOT FOUND OR v_admin.role <> 'admin' OR v_admin.status <> 'active' THEN
        RAISE EXCEPTION 'ADMIN_REQUIRED' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_target
      FROM public.users
     WHERE id = p_target_user_id
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'USER_NOT_FOUND' USING ERRCODE = 'P0001';
    END IF;

    IF v_target.status = 'deleted' THEN
        RAISE EXCEPTION 'ACCOUNT_DELETED' USING ERRCODE = 'P0001';
    END IF;

    IF v_target.plan = p_plan THEN
        RETURN jsonb_build_object('id', v_target.id, 'plan', v_target.plan);
    END IF;

    UPDATE public.users
       SET plan = p_plan
     WHERE id = p_target_user_id;

    INSERT INTO public.admin_audit_log (
        admin_user_id, target_user_id, action, old_value, new_value
    )
    VALUES (
        p_admin_user_id,
        p_target_user_id,
        'plan_changed',
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
    v_now TIMESTAMPTZ := NOW();
BEGIN
    IF p_status IS NULL OR p_status NOT IN ('active', 'suspended') THEN
        RAISE EXCEPTION 'INVALID_STATUS' USING ERRCODE = 'P0001';
    END IF;

    -- Serializa operaciones que podrían reducir el conjunto de admins activos.
    PERFORM pg_advisory_xact_lock(hashtext('admin_account_management'));

    SELECT * INTO v_admin
      FROM public.users
     WHERE id = p_admin_user_id
     FOR UPDATE;

    IF NOT FOUND OR v_admin.role <> 'admin' OR v_admin.status <> 'active' THEN
        RAISE EXCEPTION 'ADMIN_REQUIRED' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_target
      FROM public.users
     WHERE id = p_target_user_id
     FOR UPDATE;

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
           SELECT 1
             FROM public.users
            WHERE role = 'admin'
              AND status = 'active'
              AND id <> p_target_user_id
       ) THEN
        RAISE EXCEPTION 'LAST_ACTIVE_ADMIN' USING ERRCODE = 'P0001';
    END IF;

    IF v_target.status = p_status THEN
        RETURN jsonb_build_object('id', v_target.id, 'status', v_target.status);
    END IF;

    IF p_status = 'suspended' THEN
        UPDATE public.users
           SET status = 'suspended',
               suspended_at = v_now,
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
    )
    VALUES (
        p_admin_user_id,
        p_target_user_id,
        v_action,
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
    v_now TIMESTAMPTZ := NOW();
BEGIN
    -- Evita que dos eliminaciones concurrentes invaliden la regla del último admin.
    PERFORM pg_advisory_xact_lock(hashtext('admin_account_management'));

    SELECT * INTO v_admin
      FROM public.users
     WHERE id = p_admin_user_id
     FOR UPDATE;

    IF NOT FOUND OR v_admin.role <> 'admin' OR v_admin.status <> 'active' THEN
        RAISE EXCEPTION 'ADMIN_REQUIRED' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_target
      FROM public.users
     WHERE id = p_target_user_id
     FOR UPDATE;

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
           SELECT 1
             FROM public.users
            WHERE role = 'admin'
              AND status = 'active'
              AND id <> p_target_user_id
       ) THEN
        RAISE EXCEPTION 'LAST_ACTIVE_ADMIN' USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.users
       SET status = 'deleted',
           deleted_at = v_now,
           deleted_by = p_admin_user_id,
           suspended_at = NULL,
           suspended_by = NULL,
           suspension_reason = NULL
     WHERE id = p_target_user_id;

    INSERT INTO public.admin_audit_log (
        admin_user_id, target_user_id, action, old_value, new_value
    )
    VALUES (
        p_admin_user_id,
        p_target_user_id,
        'account_deleted',
        jsonb_build_object('status', v_target.status),
        jsonb_build_object('status', 'deleted')
    );

    RETURN jsonb_build_object('id', p_target_user_id, 'status', 'deleted');
END;
$$;

REVOKE ALL ON FUNCTION public.admin_change_user_plan(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_change_user_status(UUID, UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_soft_delete_user(UUID, UUID) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_change_user_plan(UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_change_user_status(UUID, UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_soft_delete_user(UUID, UUID) TO service_role;
