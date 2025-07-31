-- Check what users exist in profiles table
SELECT 
    id,
    email,
    full_name,
    role,
    client_id,
    created_at
FROM profiles 
ORDER BY created_at DESC;

-- Check what users exist in auth.users (if accessible)
-- Note: This might not work depending on RLS settings
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
ORDER BY created_at DESC;