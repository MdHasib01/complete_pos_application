-- The sessions table (000001) was created with snake_case columns `expire_at`
-- and `last_used`, but dao.UpdateSession queries them as `expireat` / `lastused`.
-- Reconcile the column names with the code (idempotent).

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'sessions' AND column_name = 'expire_at') THEN
        ALTER TABLE public.sessions RENAME COLUMN expire_at TO expireat;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'sessions' AND column_name = 'last_used') THEN
        ALTER TABLE public.sessions RENAME COLUMN last_used TO lastused;
    END IF;
END $$;
