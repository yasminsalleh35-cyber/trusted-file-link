-- Check what users actually exist in the database
SELECT 
  id,
  email,
  role,
  full_name,
  client_id,
  company_name,
  created_at
FROM user_profiles_with_clients
ORDER BY role, email;

-- Also check the raw profiles table
SELECT 
  id,
  email,
  role,
  full_name,
  client_id,
  created_at
FROM profiles
ORDER BY role, email;