-- Create storage bucket for files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'files',
  'files',
  false,
  104857600, -- 100MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/json',
    'application/xml'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for storage
CREATE POLICY "Admin can upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'files' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Client can upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'files' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'client'
    )
  );

CREATE POLICY "Admin can view all files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'files' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Client can view their uploaded files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'files' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'client'
    ) AND
    owner = auth.uid()
  );

CREATE POLICY "User can view assigned files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'files' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'user'
    ) AND
    EXISTS (
      SELECT 1 FROM public.files f
      JOIN public.file_assignments fa ON fa.file_id = f.id
      WHERE f.file_path = name
      AND (
        fa.assigned_to = auth.uid()
        OR fa.assigned_to_client = (
          SELECT client_id FROM public.profiles WHERE id = auth.uid()
        )
      )
      AND fa.is_active = true
    )
  );

CREATE POLICY "Admin can delete files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'files' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'files' AND
    owner = auth.uid()
  );