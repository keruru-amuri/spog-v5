-- Create migrations table to track applied migrations
CREATE TABLE IF NOT EXISTS public.migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    batch INTEGER NOT NULL,
    migration_time TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    status VARCHAR(50) NOT NULL,
    CONSTRAINT migrations_name_unique UNIQUE (name)
);

-- Add comment to table
COMMENT ON TABLE public.migrations IS 'Tracks applied database migrations';

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS migrations_name_idx ON public.migrations(name);

-- Create index on batch for faster batch operations
CREATE INDEX IF NOT EXISTS migrations_batch_idx ON public.migrations(batch);

-- Enable Row Level Security
ALTER TABLE public.migrations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY migrations_select_policy ON public.migrations
    FOR SELECT USING (auth.role() IN ('admin', 'manager'));  -- Only admins and managers can read migrations

CREATE POLICY migrations_insert_policy ON public.migrations
    FOR INSERT WITH CHECK (auth.role() = 'admin');  -- Only admins can create migrations

CREATE POLICY migrations_update_policy ON public.migrations
    FOR UPDATE USING (auth.role() = 'admin');  -- Only admins can update migrations

CREATE POLICY migrations_delete_policy ON public.migrations
    FOR DELETE USING (auth.role() = 'admin');  -- Only admins can delete migrations
