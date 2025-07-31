-- Fix the wrong user roles
UPDATE profiles 
SET role = 'client'::user_roles 
WHERE email = 'client@acme.com';

UPDATE profiles 
SET role = 'user'::user_roles 
WHERE email = 'user@acme.com';

-- Verify the changes
SELECT email, role, full_name, client_id 
FROM profiles 
WHERE email IN ('client@acme.com', 'user@acme.com', 'admin@financehub.com')
ORDER BY role;