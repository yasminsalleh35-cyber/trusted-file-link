-- Create files table
CREATE TABLE IF NOT EXISTS public.files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT,
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    
    -- File metadata
    metadata JSONB DEFAULT '{}',
    
    -- Security and access control
    access_level TEXT DEFAULT 'private' CHECK (access_level IN ('private', 'client', 'public')),
    
    CONSTRAINT files_name_check CHECK (char_length(name) > 0),
    CONSTRAINT files_original_name_check CHECK (char_length(original_name) > 0),
    CONSTRAINT files_file_path_check CHECK (char_length(file_path) > 0),
    CONSTRAINT files_file_size_check CHECK (file_size > 0)
);

-- Create file assignments table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.file_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_to_client UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Assignment metadata
    assignment_type TEXT DEFAULT 'user' CHECK (assignment_type IN ('user', 'client', 'all_users_in_client')),
    notes TEXT,
    
    -- Access tracking
    is_active BOOLEAN DEFAULT true,
    
    -- Ensure either assigned_to or assigned_to_client is set, but not both
    CONSTRAINT file_assignments_target_check CHECK (
        (assigned_to IS NOT NULL AND assigned_to_client IS NULL) OR
        (assigned_to IS NULL AND assigned_to_client IS NOT NULL) OR
        (assignment_type = 'all_users_in_client' AND assigned_to_client IS NOT NULL)
    )
);

-- Create file access logs table
CREATE TABLE IF NOT EXISTS public.file_access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    access_type TEXT NOT NULL CHECK (access_type IN ('view', 'download', 'preview')),
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}'
);

-- Create file versions table (for version control)
CREATE TABLE IF NOT EXISTS public.file_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    change_notes TEXT,
    is_current BOOLEAN DEFAULT false,
    
    CONSTRAINT file_versions_version_number_check CHECK (version_number > 0),
    CONSTRAINT file_versions_file_size_check CHECK (file_size > 0),
    UNIQUE(file_id, version_number)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON public.files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_at ON public.files(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_files_is_active ON public.files(is_active);
CREATE INDEX IF NOT EXISTS idx_files_access_level ON public.files(access_level);

CREATE INDEX IF NOT EXISTS idx_file_assignments_file_id ON public.file_assignments(file_id);
CREATE INDEX IF NOT EXISTS idx_file_assignments_assigned_to ON public.file_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_file_assignments_assigned_to_client ON public.file_assignments(assigned_to_client);
CREATE INDEX IF NOT EXISTS idx_file_assignments_assigned_by ON public.file_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_file_assignments_is_active ON public.file_assignments(is_active);

CREATE INDEX IF NOT EXISTS idx_file_access_logs_file_id ON public.file_access_logs(file_id);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_user_id ON public.file_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_accessed_at ON public.file_access_logs(accessed_at);

CREATE INDEX IF NOT EXISTS idx_file_versions_file_id ON public.file_versions(file_id);
CREATE INDEX IF NOT EXISTS idx_file_versions_is_current ON public.file_versions(is_current);

-- Enable Row Level Security (RLS)
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for files table
CREATE POLICY "Admin can manage all files" ON public.files
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Client can view their assigned files" ON public.files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'client'
        ) AND (
            -- Files assigned to the client
            EXISTS (
                SELECT 1 FROM public.file_assignments fa
                WHERE fa.file_id = files.id
                AND fa.assigned_to_client = (
                    SELECT client_id FROM public.profiles WHERE id = auth.uid()
                )
                AND fa.is_active = true
            )
            OR
            -- Files uploaded by the client
            files.uploaded_by = auth.uid()
        )
    );

CREATE POLICY "User can view their assigned files" ON public.files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'user'
        ) AND (
            -- Files assigned directly to the user
            EXISTS (
                SELECT 1 FROM public.file_assignments fa
                WHERE fa.file_id = files.id
                AND fa.assigned_to = auth.uid()
                AND fa.is_active = true
            )
            OR
            -- Files assigned to user's client
            EXISTS (
                SELECT 1 FROM public.file_assignments fa
                JOIN public.profiles p ON p.id = auth.uid()
                WHERE fa.file_id = files.id
                AND fa.assigned_to_client = p.client_id
                AND fa.is_active = true
            )
        )
    );

-- RLS Policies for file_assignments table
CREATE POLICY "Admin can manage all file assignments" ON public.file_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Client can view their file assignments" ON public.file_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'client'
        ) AND (
            assigned_to_client = (
                SELECT client_id FROM public.profiles WHERE id = auth.uid()
            )
            OR assigned_by = auth.uid()
        )
    );

CREATE POLICY "User can view their file assignments" ON public.file_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'user'
        ) AND (
            assigned_to = auth.uid()
            OR assigned_to_client = (
                SELECT client_id FROM public.profiles WHERE id = auth.uid()
            )
        )
    );

-- RLS Policies for file_access_logs table
CREATE POLICY "Admin can view all access logs" ON public.file_access_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can create their own access logs" ON public.file_access_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own access logs" ON public.file_access_logs
    FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for file_versions table
CREATE POLICY "Admin can manage all file versions" ON public.file_versions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can view versions of files they can access" ON public.file_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.files f
            WHERE f.id = file_versions.file_id
            -- This will use the files table RLS policies
        )
    );

-- Create functions for file management
CREATE OR REPLACE FUNCTION public.log_file_access(
    p_file_id UUID,
    p_access_type TEXT,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.file_access_logs (
        file_id,
        user_id,
        access_type,
        ip_address,
        user_agent
    ) VALUES (
        p_file_id,
        auth.uid(),
        p_access_type,
        p_ip_address,
        p_user_agent
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;

-- Create function to get user's accessible files
CREATE OR REPLACE FUNCTION public.get_user_files(
    p_user_id UUID DEFAULT auth.uid(),
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    file_id UUID,
    file_name TEXT,
    original_name TEXT,
    file_size BIGINT,
    mime_type TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE,
    uploaded_by_name TEXT,
    uploaded_by_role TEXT,
    assignment_type TEXT,
    assigned_at TIMESTAMP WITH TIME ZONE,
    assigned_by_name TEXT,
    last_accessed TIMESTAMP WITH TIME ZONE,
    access_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id as file_id,
        f.name as file_name,
        f.original_name,
        f.file_size,
        f.mime_type,
        f.uploaded_at,
        up.full_name as uploaded_by_name,
        up.role as uploaded_by_role,
        fa.assignment_type,
        fa.assigned_at,
        ap.full_name as assigned_by_name,
        MAX(fal.accessed_at) as last_accessed,
        COUNT(fal.id) as access_count
    FROM public.files f
    JOIN public.file_assignments fa ON fa.file_id = f.id
    JOIN public.profiles up ON up.id = f.uploaded_by
    JOIN public.profiles ap ON ap.id = fa.assigned_by
    LEFT JOIN public.file_access_logs fal ON fal.file_id = f.id AND fal.user_id = p_user_id
    WHERE f.is_active = true 
    AND fa.is_active = true
    AND (
        fa.assigned_to = p_user_id
        OR (
            fa.assigned_to_client = (
                SELECT client_id FROM public.profiles WHERE id = p_user_id
            )
        )
    )
    GROUP BY f.id, f.name, f.original_name, f.file_size, f.mime_type, f.uploaded_at, 
             up.full_name, up.role, fa.assignment_type, fa.assigned_at, ap.full_name
    ORDER BY fa.assigned_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_files_updated_at 
    BEFORE UPDATE ON public.files 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.files TO authenticated;
GRANT ALL ON public.file_assignments TO authenticated;
GRANT ALL ON public.file_access_logs TO authenticated;
GRANT ALL ON public.file_versions TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.log_file_access TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_files TO authenticated;