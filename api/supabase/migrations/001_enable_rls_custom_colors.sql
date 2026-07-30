-- Enable RLS on custom_colors table
ALTER TABLE custom_colors ENABLE ROW LEVEL SECURITY;

-- Allow public read access (script_tag.js reads directly from Supabase)
CREATE POLICY "Allow public read custom_colors"
ON custom_colors
FOR SELECT
TO anon
USING (true);
