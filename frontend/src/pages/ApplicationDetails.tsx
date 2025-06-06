import React from 'react';
import { Box } from '@mui/material';
import ResumeHtmlViewer from '../components/ResumeHtmlViewer';
import ResumeViewer from '../components/ResumeViewer';
import { ResumeContent } from '../types';

interface ApplicationDetailsProps {
  resumeContent: ResumeContent;
  onTextSelect: (text: string) => void;
}

const ApplicationDetails: React.FC<ApplicationDetailsProps> = ({
  resumeContent,
  onTextSelect,
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      {resumeContent && (
        <Box sx={{ mb: 3 }}>
          {resumeContent.contentType === 'html' ? (
            <ResumeHtmlViewer
              content={resumeContent.content}
              onTextSelect={onTextSelect}
              className="resume-viewer"
            />
          ) : (
            <ResumeViewer
              content={resumeContent.content}
              onTextSelect={onTextSelect}
              className="resume-viewer"
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default ApplicationDetails; 