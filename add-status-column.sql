-- Add status column to clients table
-- This SQL should be run in your Supabase SQL editor

-- Add status column with default value
ALTER TABLE clients 
ADD COLUMN status TEXT DEFAULT 'active' 
CHECK (status IN ('active', 'inactive'));

-- Update existing clients to have active status
UPDATE clients SET status = 'active' WHERE status IS NULL;

-- Make status NOT NULL after setting default values
ALTER TABLE clients ALTER COLUMN status SET NOT NULL;