import React, { useState, useRef } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  useToast,
  Button,
  Spinner,
} from '@chakra-ui/react';
import { useDropzone } from 'react-dropzone';
import { convertPdfToHtml } from '../services/api';
import '../styles/pdf.css';

const PdfHtmlTestPage = () => {
  const [file, setFile] = useState(null);
  const [html, setHtml] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const iframeRef = useRef(null);

  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    const selectedFile = acceptedFiles[0];
    if (selectedFile.type !== 'application/pdf') {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF file',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    setFile(selectedFile);
    setHtml(null); // Reset HTML when new file is selected
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsLoading(true);
    try {
      const { data, error } = await convertPdfToHtml(file);
      if (error) {
        throw error;
      }
      setHtml(data.html);
      toast({
        title: 'Success',
        description: 'PDF converted to HTML successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to convert PDF to HTML',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  });

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading>PDF to HTML Test</Heading>
        <Box
          {...getRootProps()}
          p={8}
          border="2px dashed"
          borderColor={isDragActive ? 'blue.500' : 'gray.200'}
          borderRadius="md"
          textAlign="center"
          cursor="pointer"
          bg={isDragActive ? 'blue.50' : 'white'}
          _hover={{ bg: 'gray.50' }}
        >
          <input {...getInputProps()} />
          {file ? (
            <Text>Selected file: {file.name}</Text>
          ) : (
            <Text>
              {isDragActive
                ? 'Drop the PDF file here...'
                : 'Drag and drop a PDF file here, or click to select'}
            </Text>
          )}
        </Box>
        <Button
          colorScheme="blue"
          onClick={handleConvert}
          isDisabled={!file || isLoading}
          isLoading={isLoading}
          loadingText="Converting..."
        >
          Convert to HTML
        </Button>
        {html && (
          <Box
            p={0}
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            bg="white"
            className="pdf-html-content"
            position="relative"
          >
            <Button
              onClick={handlePrint}
              colorScheme="teal"
              size="sm"
              position="absolute"
              top={2}
              right={2}
              zIndex={10}
            >
              Print Resume
            </Button>
            <iframe
              ref={iframeRef}
              title="Resume Preview"
              srcDoc={html}
              style={{
                width: '100%',
                minHeight: '1100px',
                border: 'none',
                background: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}
              sandbox="allow-same-origin"
            />
          </Box>
        )}
      </VStack>
    </Container>
  );
};

export default PdfHtmlTestPage; 