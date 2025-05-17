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
  Stack,
  Spinner,
  ScaleFade,
  Center
} from '@chakra-ui/react';
import { AttachmentIcon, CheckCircleIcon } from '@chakra-ui/icons';
import { uploadFiles } from '../services/apiService';

/**
 * Component for uploading context files for the AI Spec Assistant
 */
const FileUpload = ({ onFilesUploaded, isLoading, conversationId, bg, color }) => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
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
            useClaude: true, // Always use Claude now
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
      
      // Show success animation
      setShowSuccess(true);
      
      // Wait for animation to complete before proceeding
      setTimeout(() => {
        onFilesUploaded(response.files);
        setShowSuccess(false);
        setFiles([]);
      }, 1500);

      toast({
        title: 'File uploaded successfully',
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top-right'
      });

    } catch (error) {
      console.error('Frontend: Upload error:', error);
      toast({
        title: 'Error uploading file',
        description: error.message || 'Failed to upload file',
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top-right'
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (showSuccess) {
    return (
      <ScaleFade initialScale={0.9} in={showSuccess}>
        <Center h="200px">
          <Flex direction="column" align="center" gap={4}>
            <CheckCircleIcon w={16} h={16} color="green.400" />
            <Text fontSize="xl" color="white" fontWeight="medium">
              Resume Successfully Uploaded!
            </Text>
          </Flex>
        </Center>
      </ScaleFade>
    );
  }

  return (
    <Box 
      width="100%" 
      mb={4}
      position="relative"
      _before={{
        content: '""',
        position: 'absolute',
        top: '-1px',
        left: '-1px',
        right: '-1px',
        bottom: '-1px',
        borderRadius: 'lg',
        background: 'linear-gradient(45deg, rgba(128, 90, 213, 0.1), rgba(128, 90, 213, 0.05))',
        zIndex: -1,
        transition: 'all 0.3s ease'
      }}
      _hover={{
        _before: {
          background: 'linear-gradient(45deg, rgba(128, 90, 213, 0.15), rgba(128, 90, 213, 0.1))',
        }
      }}
    >
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
            bg={bg}
            color={color}
            size="md"
            cursor="pointer"
            isDisabled={isLoading || isUploading}
            _hover={{ 
              bg: 'purple.700',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(128, 90, 213, 0.2)'
            }}
            _active={{
              transform: 'translateY(0)',
              boxShadow: '0 2px 6px rgba(128, 90, 213, 0.15)'
            }}
            border="1px solid"
            borderColor="purple.700"
            transition="all 0.2s ease"
            boxShadow="0 2px 8px rgba(128, 90, 213, 0.1)"
          >
            Select Files
          </Button>
        </label>

        {files.length > 0 && (
          <>
            <List spacing={2} mt={2}>
              {files.map((file, index) => (
                <ListItem 
                  key={index}
                  bg="rgba(128, 90, 213, 0.05)"
                  p={2}
                  borderRadius="md"
                  border="1px solid"
                  borderColor="purple.700"
                  opacity={0.8}
                  transition="all 0.2s ease"
                  _hover={{
                    opacity: 1,
                    bg: "rgba(128, 90, 213, 0.1)",
                    transform: 'translateX(4px)'
                  }}
                >
                  <Flex alignItems="center">
                    <ListIcon as={CheckCircleIcon} color="purple.400" />
                    <Text fontSize="sm" color={color}>{file.name}</Text>
                    <Badge 
                      ml={2} 
                      bg="purple.700" 
                      color="white" 
                      fontSize="xs"
                      px={2}
                      py={0.5}
                      borderRadius="full"
                      boxShadow="0 2px 4px rgba(128, 90, 213, 0.2)"
                    >
                      {(file.size / 1024).toFixed(1)} KB
                    </Badge>
                  </Flex>
                </ListItem>
              ))}
            </List>

            <Button
              onClick={handleUpload}
              bg={isUploading ? "green.500" : "purple.700"}
              color="white"
              size="sm"
              isLoading={isUploading}
              loadingText="Uploading..."
              width="fit-content"
              spinner={<Spinner color="white" />}
              _hover={{ 
                bg: isUploading ? "green.600" : "purple.800",
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(128, 90, 213, 0.2)'
              }}
              _active={{
                transform: 'translateY(0)',
                boxShadow: '0 2px 6px rgba(128, 90, 213, 0.15)'
              }}
              border="1px solid"
              borderColor={isUploading ? "green.600" : "purple.700"}
              transition="all 0.3s ease"
              boxShadow="0 2px 8px rgba(128, 90, 213, 0.1)"
            >
              {isUploading ? "Uploading..." : "Let's Go!"}
            </Button>
          </>
        )}
      </Flex>
    </Box>
  );
};

export default FileUpload;