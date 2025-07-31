-- Fix the wrong user roles - CORRECTLY this time
-- client@acme.com should be 'client', NOT 'user'
UPDATE profiles 
SET role = 'client'
WHERE email = 'client@acme.com';

-- user@acme.com should be 'user' 
UPDATE profiles 
SET role = 'user'
WHERE email = 'user@acme.com';

-- admin stays as admin
-- No change needed for admin@financehub.com

-- Verify the changes
SELECT email, role, full_name, client_id 
FROM profiles 
WHERE email IN ('client@acme.com', 'user@acme.com', 'admin@financehub.com')
ORDER BY email;