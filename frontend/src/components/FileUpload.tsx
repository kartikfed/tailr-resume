import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, CircularProgress } from '@mui/material';
import { uploadFilesHtml } from '../services/api';
import { useConversation } from '../hooks/useConversation';

interface FileUploadProps {
  onUploadComplete?: () => void;
  onError?: (error: Error) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  onError,
}) => {
  const { conversationId, addFiles } = useConversation();
  const [isUploading, setIsUploading] = React.useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!conversationId) {
      onError?.(new Error('No conversation ID available'));
      return;
    }

    setIsUploading(true);
    try {
      const response = await uploadFilesHtml(conversationId, acceptedFiles);
      
      if (response.error) {
        throw response.error;
      }

      if (response.data?.files) {
        addFiles(response.data.files);
        onUploadComplete?.();
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      onError?.(error as Error);
    } finally {
      setIsUploading(false);
    }
  }, [conversationId, addFiles, onUploadComplete, onError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: true
  });

  return (
    <Box
      {...getRootProps()}
      sx={{
        border: '2px dashed',
        borderColor: isDragActive ? 'primary.main' : 'grey.300',
        borderRadius: 1,
        p: 3,
        textAlign: 'center',
        cursor: 'pointer',
        bgcolor: isDragActive ? 'action.hover' : 'background.paper',
        '&:hover': {
          bgcolor: 'action.hover'
        }
      }}
    >
      <input {...getInputProps()} />
      {isUploading ? (
        <CircularProgress size={24} />
      ) : (
        <Typography>
          {isDragActive
            ? 'Drop the files here...'
            : 'Drag and drop your resume here, or click to select files'}
        </Typography>
      )}
    </Box>
  );
};

export default FileUpload; 