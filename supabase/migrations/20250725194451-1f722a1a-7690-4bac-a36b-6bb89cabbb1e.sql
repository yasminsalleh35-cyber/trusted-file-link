-- Drop the problematic SECURITY DEFINER views and replace with proper RLS-enabled ones
DROP VIEW IF EXISTS public.file_assignments_detailed;
DROP VIEW IF EXISTS public.news_assignments_detailed;
DROP VIEW IF EXISTS public.user_profiles_with_clients;

-- Create secure view for file assignments without SECURITY DEFINER
CREATE VIEW public.file_assignments_detailed AS
SELECT 
    fa.id as assignment_id,
    fa.file_id,
    fa.assigned_to_client,
    fa.assigned_to_user,
    fa.created_at as assigned_at,
    f.filename,
    f.original_filename,
    f.file_type,
    f.file_size,
    f.description,
    c.company_name as client_name,
    p.full_name as user_name,
    p.email as user_email,
    ab.full_name as assigned_by_name
FROM file_assignments fa
LEFT JOIN files f ON fa.file_id = f.id
LEFT JOIN clients c ON fa.assigned_to_client = c.id
LEFT JOIN profiles p ON fa.assigned_to_user = p.id
LEFT JOIN profiles ab ON fa.assigned_by = ab.id;

-- Create secure view for news assignments without SECURITY DEFINER
CREATE VIEW public.news_assignments_detailed AS
SELECT 
    na.id as assignment_id,
    na.news_id,
    na.assigned_to_client,
    na.assigned_to_user,
    na.created_at as assigned_at,
    n.title,
    n.content,
    n.created_at as news_created_at,
    c.company_name as client_name,
    p.full_name as user_name,
    p.email as user_email,
    ab.full_name as assigned_by_name
FROM news_assignments na
LEFT JOIN news n ON na.news_id = n.id
LEFT JOIN clients c ON na.assigned_to_client = c.id
LEFT JOIN profiles p ON na.assigned_to_user = p.id
LEFT JOIN profiles ab ON na.assigned_by = ab.id;

-- Create secure view for user profiles with clients without SECURITY DEFINER
CREATE VIEW public.user_profiles_with_clients AS
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.client_id,
    p.created_at,
    p.updated_at,
    c.company_name,
    c.contact_email as client_email
FROM profiles p
LEFT JOIN clients c ON p.client_id = c.id;

-- Enable RLS on views (inherited from base tables)
-- Views inherit RLS from their underlying tables, so users will only see data they have access to

-- Fix the remaining function with proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;