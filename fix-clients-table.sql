-- Fix clients table to add missing status column
-- This will be executed to fix the database schema

-- Add status column to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- Update existing clients to have active status
UPDATE clients SET status = 'active' WHERE status IS NULL;

-- Make status NOT NULL after setting default values
ALTER TABLE clients ALTER COLUMN status SET NOT NULL;