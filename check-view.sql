-- Check if the user_profiles_with_clients view exists
SELECT * FROM information_schema.views 
WHERE table_name = 'user_profiles_with_clients';

-- If it exists, test the view
SELECT * FROM user_profiles_with_clients LIMIT 5;

-- If it doesn't exist, let's see what tables we have
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;