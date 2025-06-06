import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Box,
  VStack,
  Text,
  useToast,
  HStack,
  Spinner,
  Icon,
  Flex,
} from '@chakra-ui/react';
import { FiFile } from 'react-icons/fi';
import { supabase } from '../../services/supabase';
import { ElementType } from 'react';

interface ResumeFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  created_at: string;
}

interface ResumeManagerProps {
  /**
   * Display mode: 'list' (view only) or 'select' (allows selection)
   */
  mode?: 'list' | 'select';
  /**
   * Callback when a resume is selected (only in 'select' mode)
   */
  onResumeSelect?: (resumeId: string) => void;
  /**
   * The currently selected resume ID (only in 'select' mode)
   */
  selectedResumeId?: string;
}

/**
 * ResumeManager component styled to match the new dashboard design
 */
export const ResumeManager = forwardRef<any, ResumeManagerProps>(({ mode = 'list', onResumeSelect, selectedResumeId }, ref) => {
  const [resumeFiles, setResumeFiles] = useState<ResumeFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const toast = useToast();

  const borderColor = 'rgba(255,255,255,0.08)';

  // Design colors for list mode
  const rowBg = 'white';

  useEffect(() => {
    fetchResumeFiles();
  }, []);

  useImperativeHandle(ref, () => ({
    refresh: fetchResumeFiles
  }));

  const fetchResumeFiles = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('resume_files')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setResumeFiles(data || []);
    } catch (error) {
      toast({
        title: 'Error fetching resume files',
        description: (error as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    try {
      setIsUploading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw userError || new Error('User not authenticated');
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}_${i}.${fileExt}`;
        const filePath = `${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(filePath, file);
        if (uploadError) throw uploadError;
        const { error: dbError } = await supabase
          .from('resume_files')
          .insert([
            {
              user_id: user.id,
              file_name: file.name,
              file_path: filePath,
              file_size: file.size,
              file_type: file.type,
            },
          ]);
        if (dbError) throw dbError;
      }
      toast({
        title: 'Resumes uploaded successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchResumeFiles();
    } catch (error) {
      toast({
        title: 'Error uploading resumes',
        description: (error as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteResume = async (resumeId: string, filePath: string) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('resumes')
        .remove([filePath]);
      if (storageError) throw storageError;
      const { error: dbError } = await supabase
        .from('resume_files')
        .delete()
        .eq('id', resumeId);
      if (dbError) throw dbError;
      toast({
        title: 'Resume deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      fetchResumeFiles();
    } catch (error) {
      toast({
        title: 'Error deleting resume',
        description: (error as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (mode === 'select') {
    return (
      <VStack spacing={0} align="stretch">
        {isLoading ? (
          <Box textAlign="center" py={8}>
            <Spinner color="#8B5CF6" />
          </Box>
        ) : resumeFiles.length === 0 ? (
          <Box textAlign="center" py={8} color="gray.400">
            No resumes found. Please upload a resume first.
          </Box>
        ) : (
          resumeFiles.map((file, idx) => {
            const isSelected = file.id === selectedResumeId;
            return (
              <Flex
                key={file.id}
                align="center"
                justify="space-between"
                px={6}
                py={5}
                bg={isSelected ? 'purple.50' : rowBg}
                borderBottom={idx === resumeFiles.length - 1 ? 'none' : `1px solid ${borderColor}`}
                borderLeft={isSelected ? '4px solid #8B5CF6' : '4px solid transparent'}
                transition="background 0.2s, border-color 0.2s"
                cursor="pointer"
                onClick={() => onResumeSelect && onResumeSelect(file.id)}
                role="button"
                aria-label={`Select resume ${file.file_name}`}
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onResumeSelect && onResumeSelect(file.id);
                  }
                }}
              >
                <HStack spacing={4} align="center">
                  <Box
                    as="span"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    height="24px"
                    width="24px"
                    borderRadius="full"
                    border={isSelected ? '6px solid #8B5CF6' : '2px solid #c4b5fd'}
                    bg={isSelected ? '#8B5CF6' : 'white'}
                    transition="border 0.2s, background 0.2s"
                    aria-checked={isSelected}
                    role="radio"
                  >
                    {isSelected && (
                      <Box
                        as="span"
                        display="block"
                        width="10px"
                        height="10px"
                        borderRadius="full"
                        bg="white"
                      />
                    )}
                  </Box>
                  <Box>
                    <Text color="#1a1a1a" fontWeight={700} fontSize="16px" mb={1} letterSpacing="-0.01em" opacity={1}>
                      {file.file_name}
                    </Text>
                    <Text color="#8b949e" fontWeight={500} fontSize="14px" opacity={1}>
                      {formatFileSize(file.file_size)} • Modified {getRelativeDate(file.created_at)}
                    </Text>
                  </Box>
                </HStack>
              </Flex>
            );
          })
        )}
      </VStack>
    );
  }

  return (
    <VStack spacing={0} align="stretch">
      {isLoading ? (
        <Box textAlign="center" py={8}>
          <Spinner color="#8B5CF6" />
        </Box>
      ) : (
        resumeFiles.map((file, idx) => (
          <Flex
            key={file.id}
            align="center"
            justify="space-between"
            px={6}
            py={5}
            bg={rowBg}
            borderBottom={idx === resumeFiles.length - 1 ? 'none' : `1px solid ${borderColor}`}
            transition="background 0.2s"
          >
            <HStack spacing={4} align="center">
              <Icon as={FiFile as ElementType} color="#8B5CF6" boxSize={8} bg="#f5f3ff" borderRadius="10px" p={2} />
              <Box>
                <Text color="#1a1a1a" fontWeight={700} fontSize="16px" mb={1} letterSpacing="-0.01em" opacity={1}>
                  {file.file_name}
                </Text>
                <Text color="#8b949e" fontWeight={500} fontSize="14px" opacity={1}>
                  {formatFileSize(file.file_size)} • Modified {getRelativeDate(file.created_at)}
                </Text>
              </Box>
            </HStack>
          </Flex>
        ))
      )}
    </VStack>
  );
});

function getRelativeDate(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

export default ResumeManager; 