import React, { useState, useRef } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  useToast,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  List,
  ListItem,
} from '@chakra-ui/react';
import { useDropzone } from 'react-dropzone';
import { convertPdfToHtml } from '../services/api';
import '../styles/pdf.css';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    ids: {
      total: number;
      unique: number;
      missing: number;
      invalid: number;
    };
    contenteditable: {
      total: number;
      missing: number;
    };
  };
}

/**
 * Page for testing PDF to HTML conversion.
 */
const PdfHtmlTestPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const toast = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const onDrop = async (acceptedFiles: File[]) => {
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
    setHtml(null);
    setValidation(null);
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsLoading(true);
    try {
      const { data, error } = await convertPdfToHtml(file);
      if (error) {
        throw error;
      }
      if (!data || !data.html) {
        throw new Error('No HTML returned from conversion');
      }
      setHtml(data.html);
      if (data.validation) {
        setValidation(data.validation);
        if (!data.validation.isValid) {
          toast({
            title: 'Validation Warnings',
            description: 'HTML conversion completed with some validation issues',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
        }
      } else {
        toast({
          title: 'Success',
          description: 'PDF converted to HTML successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error: any) {
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
        {validation && (
          <Box>
            <Alert
              status={validation.isValid ? 'success' : 'warning'}
              variant="subtle"
              flexDirection="column"
              alignItems="start"
              p={4}
            >
              <AlertIcon />
              <AlertTitle>
                {validation.isValid ? 'Validation Successful' : 'Validation Issues Found'}
              </AlertTitle>
              <AlertDescription>
                <List spacing={2} mt={2}>
                  {validation.errors.map((error, index) => (
                    <ListItem key={index} color="red.500">
                      {error}
                    </ListItem>
                  ))}
                  {validation.warnings.map((warning, index) => (
                    <ListItem key={index} color="orange.500">
                      {warning}
                    </ListItem>
                  ))}
                </List>
                <Box mt={4}>
                  <Text fontWeight="bold">ID Statistics:</Text>
                  <Text>Total IDs: {validation.stats.ids.total}</Text>
                  <Text>Unique IDs: {validation.stats.ids.unique}</Text>
                  <Text>Missing IDs: {validation.stats.ids.missing}</Text>
                  <Text>Invalid IDs: {validation.stats.ids.invalid}</Text>
                </Box>
                <Box mt={4}>
                  <Text fontWeight="bold">Contenteditable Statistics:</Text>
                  <Text>Total Editable Elements: {validation.stats.contenteditable.total}</Text>
                  <Text>Missing Contenteditable: {validation.stats.contenteditable.missing}</Text>
                </Box>
              </AlertDescription>
            </Alert>
          </Box>
        )}
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