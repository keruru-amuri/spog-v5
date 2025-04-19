-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    profile_image_url TEXT,
    email_verified BOOLEAN DEFAULT false NOT NULL,
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP WITH TIME ZONE,
    CONSTRAINT users_email_unique UNIQUE (email),
    CONSTRAINT users_role_check CHECK (role IN ('admin', 'manager', 'user'))
);

-- Add comment to table
COMMENT ON TABLE public.users IS 'Stores user information';

-- Create indexes
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON public.users(role);
CREATE INDEX IF NOT EXISTS users_is_active_idx ON public.users(is_active);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_users_updated_at();

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY users_select_policy ON public.users
    FOR SELECT USING (auth.role() IN ('admin', 'manager') OR auth.uid() = id);  -- Admins and managers can read all users, users can read their own data

CREATE POLICY users_insert_policy ON public.users
    FOR INSERT WITH CHECK (auth.role() = 'admin');  -- Only admins can create users

CREATE POLICY users_update_policy ON public.users
    FOR UPDATE USING (auth.role() = 'admin' OR auth.uid() = id);  -- Admins can update any user, users can update their own data

CREATE POLICY users_delete_policy ON public.users
    FOR DELETE USING (auth.role() = 'admin');  -- Only admins can delete users
