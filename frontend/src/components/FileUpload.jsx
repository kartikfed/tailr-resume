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
  useToast,
  Radio,
  RadioGroup,
  Stack
} from '@chakra-ui/react';
import { AttachmentIcon, CheckCircleIcon } from '@chakra-ui/icons';
import { uploadFiles } from '../services/apiService';

/**
 * Component for uploading context files for the AI Spec Assistant
 */
const FileUpload = ({ onFilesUploaded, isLoading, conversationId }) => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadEngine, setUploadEngine] = useState('affinda');
  const toast = useToast();

  const handleFileChange = (e) => {
    if (e.target.files) {
      // Convert FileList to Array
      const fileArray = Array.from(e.target.files);
      console.log('Frontend: Files selected:', fileArray.map(f => ({ name: f.name, type: f.type, size: f.size })));
      setFiles(fileArray);
    }
  };

  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onerror = function(error) {
        console.error(`Frontend: Error reading file ${file.name}:`, error);
        reject(error);
      };

      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // Read PDF as ArrayBuffer and encode as base64
        reader.onload = function(event) {
          const arrayBuffer = event.target.result;
          // Convert ArrayBuffer to base64
          const base64String = btoa(
            new Uint8Array(arrayBuffer)
              .reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          resolve(base64String);
        };
        reader.readAsArrayBuffer(file);
      } else {
        // Read as text for other file types
        reader.onload = function(event) {
          const content = event.target.result;
          resolve(content);
        };
        reader.readAsText(file);
      }
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    try {
      console.log('Frontend: Starting file upload process...');
      
      // Read all files with content
      const filePromises = files.map(async (file) => {
        try {
          const content = await readFileContent(file);
          return {
            name: file.name,
            type: file.type,
            size: file.size,
            content: content,
            isPdf: file.type === 'application/pdf' || file.name.endsWith('.pdf'),
            useClaude: uploadEngine === 'claude',
          };
        } catch (error) {
          console.error(`Frontend: Failed to read file ${file.name}:`, error);
          throw error;
        }
      });

      const fileMetadata = await Promise.all(filePromises);
      
      console.log('Frontend: All files read successfully:', fileMetadata.map(f => ({
        name: f.name,
        hasContent: Boolean(f.content),
        contentLength: f.content ? f.content.length : 0
      })));

      // Send to backend
      const response = await uploadFiles(conversationId, fileMetadata);
      
      console.log('Frontend: Received response from backend:', response);
      console.log('Frontend: Files in response:', response.files);
      console.log('Frontend: First file content:', response.files[0]?.content?.substring(0, 200) + '...');
      
      // Update the UI with response
      onFilesUploaded(response.files);
      
      toast({
        title: 'Files uploaded',
        description: `${files.length} files uploaded successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Clear files after upload
      setFiles([]);
      setIsUploading(false);
    } catch (error) {
      console.error('Frontend: Upload error:', error);
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
      <RadioGroup onChange={setUploadEngine} value={uploadEngine} mb={2}>
        <Stack direction="row" spacing={4}>
          <Radio value="affinda">Use Affinda</Radio>
          <Radio value="claude">Use Claude</Radio>
        </Stack>
      </RadioGroup>
      <Input
        type="file"
        multiple
        onChange={handleFileChange}
        display="none"
        id="file-upload"
        isDisabled={isLoading || isUploading}
        accept=".txt,.md,.doc,.docx,.pdf,application/pdf,text/*"
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