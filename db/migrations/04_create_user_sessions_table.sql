-- Create user_sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_valid BOOLEAN DEFAULT true NOT NULL,
    CONSTRAINT user_sessions_token_unique UNIQUE (token)
);

-- Add comment to table
COMMENT ON TABLE public.user_sessions IS 'Stores user session information';

-- Create indexes
CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS user_sessions_token_idx ON public.user_sessions(token);
CREATE INDEX IF NOT EXISTS user_sessions_expires_at_idx ON public.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS user_sessions_is_valid_idx ON public.user_sessions(is_valid);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_sessions_updated_at
BEFORE UPDATE ON public.user_sessions
FOR EACH ROW
EXECUTE FUNCTION update_user_sessions_updated_at();

-- Create trigger to invalidate expired sessions
CREATE OR REPLACE FUNCTION invalidate_expired_sessions()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expires_at < now() THEN
        NEW.is_valid = false;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invalidate_expired_sessions
BEFORE INSERT OR UPDATE ON public.user_sessions
FOR EACH ROW
EXECUTE FUNCTION invalidate_expired_sessions();

-- Enable Row Level Security
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY user_sessions_select_policy ON public.user_sessions
    FOR SELECT USING (auth.role() = 'admin' OR auth.uid()::text = user_id::text);  -- Admins can read all sessions, users can read their own sessions

CREATE POLICY user_sessions_insert_policy ON public.user_sessions
    FOR INSERT WITH CHECK (auth.role() = 'admin' OR auth.uid()::text = user_id::text);  -- Admins can create sessions for any user, users can create their own sessions

CREATE POLICY user_sessions_update_policy ON public.user_sessions
    FOR UPDATE USING (auth.role() = 'admin' OR auth.uid()::text = user_id::text);  -- Admins can update any session, users can update their own sessions

CREATE POLICY user_sessions_delete_policy ON public.user_sessions
    FOR DELETE USING (auth.role() = 'admin' OR auth.uid()::text = user_id::text);  -- Admins can delete any session, users can delete their own sessions
