-- Create resume_files table
CREATE TABLE resume_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE resume_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own resume files"
    ON resume_files FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own resume files"
    ON resume_files FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resume files"
    ON resume_files FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resume files"
    ON resume_files FOR DELETE
    USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON resume_files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 