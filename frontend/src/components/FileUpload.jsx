import React, { useState } from 'react';
import {
  Box,
  Button,
  Text,
  Input,
  List,
  ListItem,
  ListIcon,
  Flex,
  Badge,
  useToast
} from '@chakra-ui/react';
import { AttachmentIcon, CheckCircleIcon } from '@chakra-ui/icons';

/**
 * Component for uploading context files for the AI Spec Assistant
 */
const FileUpload = ({ onFilesUploaded, isLoading }) => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const toast = useToast();

  const handleFileChange = (e) => {
    if (e.target.files) {
      // Convert FileList to Array
      const fileArray = Array.from(e.target.files);
      setFiles(fileArray);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    try {
      // For our MVP, we'll just pass the file metadata
      onFilesUploaded(files);

      toast({
        title: 'Files ready',
        description: `${files.length} files ready for upload`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Clear files after upload
      setFiles([]);
      setIsUploading(false);
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload files',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIsUploading(false);
    }
  };

  return (
    <Box width="100%" mb={4}>
      <Text mb={2} fontWeight="medium">Upload supporting files (optional):</Text>
      <Input
        type="file"
        multiple
        onChange={handleFileChange}
        display="none"
        id="file-upload"
        isDisabled={isLoading || isUploading}
      />
      <Flex direction="column" gap={3}>
        <label htmlFor="file-upload">
          <Button
            as="span"
            leftIcon={<AttachmentIcon />}
            colorScheme="gray"
            size="md"
            cursor="pointer"
            isDisabled={isLoading || isUploading}
          >
            Select Files
          </Button>
        </label>

        {files.length > 0 && (
          <>
            <List spacing={2} mt={2}>
              {files.map((file, index) => (
                <ListItem key={index}>
                  <Flex alignItems="center">
                    <ListIcon as={CheckCircleIcon} color="green.500" />
                    <Text fontSize="sm">{file.name}</Text>
                    <Badge ml={2} colorScheme="gray" fontSize="xs">
                      {(file.size / 1024).toFixed(1)} KB
                    </Badge>
                  </Flex>
                </ListItem>
              ))}
            </List>

            <Button
              onClick={handleUpload}
              colorScheme="blue"
              size="sm"
              isLoading={isUploading}
              loadingText="Uploading..."
              width="fit-content"
            >
              Upload {files.length} {files.length === 1 ? 'File' : 'Files'}
            </Button>
          </>
        )}
      </Flex>
    </Box>
  );
};

export default FileUpload;