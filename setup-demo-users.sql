-- Setup Demo Users in Supabase Auth
-- Run this in your Supabase SQL Editor

-- First, let's check if the users already exist in auth.users
SELECT id, email, created_at FROM auth.users WHERE email IN ('client@acme.com', 'user@acme.com');

-- If they don't exist, we need to create them
-- Note: This is a workaround since we can't directly insert into auth.users in production
-- In a real app, users should register through the registration form

-- For now, let's update the existing demo credentials to match a user that actually works
-- We'll change the demo credentials to use the admin user for testing

-- Alternative: Create a setup function that can be called from the app
CREATE OR REPLACE FUNCTION setup_demo_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function would normally create users through Supabase Auth
  -- For now, we'll just ensure the profiles exist
  
  -- Check if client profile exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'client@acme.com') THEN
    INSERT INTO profiles (id, email, full_name, role, client_id)
    VALUES (
      gen_random_uuid(),
      'client@acme.com',
      'John Client',
      'client',
      'bacb2c3b-7714-494f-ad13-158d6a008b09'
    );
  END IF;
  
  -- Check if user profile exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'user@acme.com') THEN
    INSERT INTO profiles (id, email, full_name, role, client_id)
    VALUES (
      gen_random_uuid(),
      'user@acme.com',
      'Jane User',
      'user',
      'bacb2c3b-7714-494f-ad13-158d6a008b09'
    );
  END IF;
  
  RAISE NOTICE 'Demo profiles setup complete';
END;
$$;

-- Call the function
SELECT setup_demo_users();