-- Create media storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true);

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- Allow users to view all media (public bucket)
CREATE POLICY "Anyone can view media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'media');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own media"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);