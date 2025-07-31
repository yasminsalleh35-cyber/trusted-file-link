-- =====================================================
-- FIX BROKEN CLIENT REFERENCES
-- =====================================================
-- This will create the missing client and fix references
-- =====================================================

-- First, create the missing client company (only if it doesn't exist)
INSERT INTO clients (
  company_name,
  contact_email,
  contact_phone,
  address
)
SELECT 
  'Acme Corporation',
  'contact@acme.com',
  '+1-555-0123',
  '123 Business St, City, State 12345'
WHERE NOT EXISTS (
  SELECT 1 FROM clients WHERE contact_email = 'contact@acme.com'
);

-- Get the client ID
DO $$
DECLARE
    client_uuid UUID;
BEGIN
    -- Get the client ID
    SELECT id INTO client_uuid FROM clients WHERE contact_email = 'contact@acme.com';
    
    -- Update profiles that should have this client_id
    UPDATE profiles 
    SET client_id = client_uuid 
    WHERE email IN ('client@acme.com', 'user@acme.com') 
    AND client_id IS NULL;
    
    -- Also update any profiles that have invalid client_id references
    UPDATE profiles 
    SET client_id = client_uuid 
    WHERE email IN ('client@acme.com', 'user@acme.com') 
    AND client_id IS NOT NULL 
    AND client_id NOT IN (SELECT id FROM clients);
    
    RAISE NOTICE 'Client ID: %', client_uuid;
    RAISE NOTICE 'Fixed client references for client@acme.com and user@acme.com';
END $$;

-- Verify the fix
SELECT 
    p.email,
    p.role,
    p.client_id,
    c.company_name
FROM profiles p
LEFT JOIN clients c ON p.client_id = c.id
ORDER BY p.email;

-- =====================================================
-- REFERENCES FIXED
-- =====================================================
-- ✅ Client company created
-- ✅ Broken client_id references fixed
-- ✅ Ready to test login
-- =====================================================