-- Add content_type column to job_applications table
ALTER TABLE job_applications
ADD COLUMN resume_content_type TEXT DEFAULT 'markdown';

-- Add content_type column to resume_versions table
ALTER TABLE resume_versions
ADD COLUMN content_type TEXT DEFAULT 'markdown';

-- Add indexes for better query performance
CREATE INDEX idx_job_applications_resume_content_type ON job_applications(resume_content_type);
CREATE INDEX idx_resume_versions_content_type ON resume_versions(content_type); 