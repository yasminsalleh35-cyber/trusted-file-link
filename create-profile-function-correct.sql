-- Create a function to insert profiles that bypasses RLS
-- Using the correct enum type: user_role
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  user_email TEXT,
  user_full_name TEXT,
  user_role TEXT, -- We'll cast this to user_role inside the function
  user_client_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role, client_id, created_at, updated_at)
  VALUES (
    user_id,
    user_email,
    user_full_name,
    user_role::user_role, -- Cast to the correct enum type
    user_client_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    client_id = EXCLUDED.client_id,
    updated_at = NOW();
END;
$$;