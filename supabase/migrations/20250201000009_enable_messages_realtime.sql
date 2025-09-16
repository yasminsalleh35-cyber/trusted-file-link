-- Enable Realtime for messages table in supabase_realtime publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_publication p
    JOIN pg_catalog.pg_publication_rel pr ON p.oid = pr.prpubid
    JOIN pg_catalog.pg_class c ON c.oid = pr.prrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    WHERE p.pubname = 'supabase_realtime'
      AND n.nspname = 'public'
      AND c.relname = 'messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.messages';
  END IF;
END$$;

-- Ensure updates/deletes emit old row data for Realtime triggers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_index i ON i.indrelid = c.oid AND i.indisreplident
    WHERE n.nspname = 'public' AND c.relname = 'messages'
  ) THEN
    -- If no replica identity index exists, set REPLICA IDENTITY FULL
    EXECUTE 'ALTER TABLE public.messages REPLICA IDENTITY FULL';
  END IF;
END$$;