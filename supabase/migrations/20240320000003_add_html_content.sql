-- Add html_content column to resume_versions table
ALTER TABLE resume_versions
ADD COLUMN html_content TEXT;

-- Add index for better query performance
CREATE INDEX idx_resume_versions_html_content ON resume_versions(html_content); 