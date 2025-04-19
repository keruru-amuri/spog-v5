-- Create user_permissions table
CREATE TABLE IF NOT EXISTS public.user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    permission VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    granted_by UUID REFERENCES public.users(id),
    CONSTRAINT user_permissions_unique UNIQUE (user_id, permission, resource)
);

-- Add comment to table
COMMENT ON TABLE public.user_permissions IS 'Stores user permission information';

-- Create indexes
CREATE INDEX IF NOT EXISTS user_permissions_user_id_idx ON public.user_permissions(user_id);
CREATE INDEX IF NOT EXISTS user_permissions_permission_idx ON public.user_permissions(permission);
CREATE INDEX IF NOT EXISTS user_permissions_resource_idx ON public.user_permissions(resource);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_permissions_updated_at
BEFORE UPDATE ON public.user_permissions
FOR EACH ROW
EXECUTE FUNCTION update_user_permissions_updated_at();

-- Enable Row Level Security
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY user_permissions_select_policy ON public.user_permissions
    FOR SELECT USING (auth.role() IN ('admin', 'manager') OR auth.uid()::text = user_id::text);  -- Admins and managers can read all permissions, users can read their own permissions

CREATE POLICY user_permissions_insert_policy ON public.user_permissions
    FOR INSERT WITH CHECK (auth.role() = 'admin');  -- Only admins can create permissions

CREATE POLICY user_permissions_update_policy ON public.user_permissions
    FOR UPDATE USING (auth.role() = 'admin');  -- Only admins can update permissions

CREATE POLICY user_permissions_delete_policy ON public.user_permissions
    FOR DELETE USING (auth.role() = 'admin');  -- Only admins can delete permissions
