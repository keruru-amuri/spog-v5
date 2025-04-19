-- Create locations table
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    parent_id UUID REFERENCES public.locations(id),
    CONSTRAINT locations_name_unique UNIQUE (name)
);

-- Add comment to table
COMMENT ON TABLE public.locations IS 'Stores location information for inventory items';

-- Create index on parent_id for faster hierarchical queries
CREATE INDEX IF NOT EXISTS locations_parent_id_idx ON public.locations(parent_id);

-- Create index on is_active for filtering active locations
CREATE INDEX IF NOT EXISTS locations_is_active_idx ON public.locations(is_active);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_locations_updated_at
BEFORE UPDATE ON public.locations
FOR EACH ROW
EXECUTE FUNCTION update_locations_updated_at();

-- Enable Row Level Security
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY locations_select_policy ON public.locations
    FOR SELECT USING (true);  -- Everyone can read locations

CREATE POLICY locations_insert_policy ON public.locations
    FOR INSERT WITH CHECK (auth.role() IN ('admin', 'manager'));  -- Only admins and managers can create locations

CREATE POLICY locations_update_policy ON public.locations
    FOR UPDATE USING (auth.role() IN ('admin', 'manager'));  -- Only admins and managers can update locations

CREATE POLICY locations_delete_policy ON public.locations
    FOR DELETE USING (auth.role() = 'admin');  -- Only admins can delete locations
