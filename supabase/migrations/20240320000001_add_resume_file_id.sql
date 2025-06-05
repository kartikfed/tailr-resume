-- Add resume_file_id column to job_applications table
ALTER TABLE job_applications
ADD COLUMN resume_file_id UUID REFERENCES resume_files(id);

-- Add index for better query performance
CREATE INDEX idx_job_applications_resume_file_id ON job_applications(resume_file_id); 