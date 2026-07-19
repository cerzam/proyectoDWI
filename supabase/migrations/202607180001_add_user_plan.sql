-- Planes de cuenta: los usuarios existentes y nuevos comienzan en Free.
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS plan TEXT;

UPDATE public.users
   SET plan = 'free'
 WHERE plan IS NULL;

ALTER TABLE public.users
    ALTER COLUMN plan SET DEFAULT 'free',
    ALTER COLUMN plan SET NOT NULL;

ALTER TABLE public.users
    DROP CONSTRAINT IF EXISTS users_plan_check;

ALTER TABLE public.users
    ADD CONSTRAINT users_plan_check CHECK (plan IN ('free', 'pro'));

-- El plan sólo se administra mediante procesos con privilegios administrativos.
-- RLS de public.users se conserva sin cambios; handle_new_user() sigue a cargo del alta.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.users FROM anon, authenticated;
