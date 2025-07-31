-- Check what the actual role enum type is called
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname LIKE '%role%'
ORDER BY t.typname, e.enumsortorder;

-- Also check the profiles table structure
\d profiles;