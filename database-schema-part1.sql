-- =====================================================
-- CLIENT PORTAL SYSTEM - DATABASE SCHEMA PART 1
-- =====================================================
-- Run this first to create basic tables and types
-- =====================================================

-- Create custom types for roles and message types (skip if they exist)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'client', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE message_type AS ENUM ('direct', 'broadcast', 'announcement');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE file_status AS ENUM ('active', 'archived', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 1. CLIENTS TABLE (Companies/Organizations)
-- =====================================================
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    address TEXT,
    client_admin_id UUID, -- Will add foreign key constraint later
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. PROFILES TABLE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint from clients to profiles (skip if exists)
DO $$ BEGIN
    ALTER TABLE clients ADD CONSTRAINT fk_clients_admin 
        FOREIGN KEY (client_admin_id) REFERENCES profiles(id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 3. FILES TABLE (Document Storage Tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL, -- Display name
    original_filename TEXT NOT NULL, -- Original upload name
    file_type TEXT NOT NULL, -- MIME type
    file_size BIGINT NOT NULL, -- Size in bytes
    storage_path TEXT NOT NULL, -- Supabase storage path
    description TEXT,
    uploaded_by UUID NOT NULL REFERENCES profiles(id),
    status file_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. FILE ASSIGNMENTS (Who can access which files)
-- =====================================================
CREATE TABLE IF NOT EXISTS file_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES profiles(id),
    assigned_to_client UUID REFERENCES clients(id), -- If assigned to entire client
    assigned_to_user UUID REFERENCES profiles(id),  -- If assigned to specific user
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure either client or user is assigned, not both
    CONSTRAINT check_assignment CHECK (
        (assigned_to_client IS NOT NULL AND assigned_to_user IS NULL) OR
        (assigned_to_client IS NULL AND assigned_to_user IS NOT NULL)
    )
);

-- =====================================================
-- 5. NEWS/REPORTS TABLE (Announcements and Reports)
-- =====================================================
CREATE TABLE IF NOT EXISTS news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- Rich text content (HTML/Markdown)
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. NEWS ASSIGNMENTS (Who can see which news)
-- =====================================================
CREATE TABLE IF NOT EXISTS news_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES profiles(id),
    assigned_to_client UUID REFERENCES clients(id), -- If assigned to entire client
    assigned_to_user UUID REFERENCES profiles(id),  -- If assigned to specific user
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure either client or user is assigned, not both
    CONSTRAINT check_news_assignment CHECK (
        (assigned_to_client IS NOT NULL AND assigned_to_user IS NULL) OR
        (assigned_to_client IS NULL AND assigned_to_user IS NOT NULL)
    )
);

-- =====================================================
-- 7. MESSAGES TABLE (Communication System)
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES profiles(id),
    recipient_id UUID NOT NULL REFERENCES profiles(id),
    subject TEXT,
    content TEXT NOT NULL,
    message_type message_type DEFAULT 'direct',
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES for Performance (skip if they exist)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_client_id ON profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_file_assignments_client ON file_assignments(assigned_to_client);
CREATE INDEX IF NOT EXISTS idx_file_assignments_user ON file_assignments(assigned_to_user);
CREATE INDEX IF NOT EXISTS idx_news_assignments_client ON news_assignments(assigned_to_client);
CREATE INDEX IF NOT EXISTS idx_news_assignments_user ON news_assignments(assigned_to_user);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- =====================================================
-- PART 1 COMPLETE
-- =====================================================
-- ✅ All tables created
-- ✅ Foreign key relationships established
-- ✅ Indexes added for performance
-- 
-- Next: Run Part 2 for Row Level Security and policies
-- =====================================================