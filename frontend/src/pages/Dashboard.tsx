import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import {
  Box,
  Heading,
  Text,
  Button,
  SimpleGrid,
  useToast,
  Spinner,
  Flex,
} from '@chakra-ui/react';
import { AddIcon, ArrowUpIcon } from '@chakra-ui/icons';
import { ResumeManager } from '../components/ResumeManager';
import { JobApplication } from '../types/jobApplication';

/**
 * Dashboard page for managing resumes and job applications
 */
export const Dashboard: React.FC = () => {
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const toast = useToast();
  const resumeManagerRef = useRef<any>(null);

  // Design colors
  const gradientBg = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  const cardBg = 'rgba(255,255,255,0.95)';
  const borderColor = 'rgba(139,92,246,0.12)';
  const sectionShadow = '0 8px 32px rgba(139,92,246,0.04), 0 1px 3px rgba(0,0,0,0.05)';
  const sectionRadius = '16px';
  const sectionHeaderBg = 'rgba(248,250,252,0.4)';
  const sectionHeaderBorder = '0.5px solid rgba(0,0,0,0.06)';
  const mainText = '#1a1a1a';
  const subtitleText = '#8b949e';
  const purple = '#8B5CF6';
  const purpleGradient = 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)';

  useEffect(() => {
    loadJobApplications();
  }, []);

  const loadJobApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('job_applications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setJobApplications(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load job applications',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    navigate('/job-description');
  };

  const getStatusBadge = (status: string) => {
    if (status === 'submitted') {
      return { label: 'SUBMITTED', className: 'status-submitted', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: '0.5px solid rgba(34,197,94,0.2)' };
    }
    return { label: 'DRAFT', className: 'status-draft', color: '#f59e0b', bg: 'rgba(251,191,36,0.1)', border: '0.5px solid rgba(251,191,36,0.2)' };
  };

  // Upload logic (copied from ResumeManager)
  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    try {
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
      if (resumeManagerRef.current && resumeManagerRef.current.refresh) {
        resumeManagerRef.current.refresh();
      }
    } catch (error: any) {
      toast({
        title: 'Error uploading resumes',
        description: (error && error.message) || 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const triggerFileInput = () => {
    document.getElementById('resume-upload-input')?.click();
  };

  if (loading) {
    return (
      <Box minH="100vh" bg={gradientBg} display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color={purple} />
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg={gradientBg}>
      <Box
        className="content-wrapper"
        maxW="1200px"
        mx="auto"
        py={{ base: 6, md: 10 }}
        px={{ base: 4, md: 12 }}
        border="none"
        boxShadow="none"
        background="none"
      >
        {/* Header */}
        <Box mb={10}>
          <Heading as="h1" fontSize="2.5rem" fontWeight={700} color={mainText} mb={2} letterSpacing="-0.03em">
            Resume Management
          </Heading>
          <Text fontSize="lg" color={subtitleText} fontWeight={400}>
            Organize your resumes and track application progress with precision
          </Text>
        </Box>

        {/* Resume Files Section (single, styled as reference) */}
        <Box
          bg="white"
          borderRadius="20px"
          boxShadow="0 2px 8px rgba(0,0,0,0.10)"
          mb={8}
          border="1px solid #ede9fe"
          overflow="hidden"
        >
          <Flex px={{ base: 4, md: 8 }} py={6} align="center" justify="space-between" borderBottom="1px solid #ede9fe">
            <Heading as="h2" fontSize="1.25rem" fontWeight={600} color={mainText} letterSpacing="-0.02em">
              Resume Files
            </Heading>
            <Button
              leftIcon={<ArrowUpIcon />}
              bgGradient={purpleGradient}
              color="white"
              fontWeight={600}
              borderRadius="10px"
              px={6}
              py={2.5}
              fontSize="md"
              _hover={{ boxShadow: '0 4px 16px rgba(139,92,246,0.3)', transform: 'translateY(-1px)' }}
              _active={{ transform: 'translateY(0)' }}
              boxShadow="0 1px 3px rgba(139,92,246,0.2)"
              onClick={triggerFileInput}
            >
              Upload Resume
            </Button>
          </Flex>
          <input
            id="resume-upload-input"
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
            multiple
            accept="application/pdf,.doc,.docx,.txt"
          />
          <Box p={0}>
            {/* Render the resume list in the new style (no actions) */}
            <ResumeManager mode="list" ref={resumeManagerRef} />
          </Box>
        </Box>

        {/* Job Applications Section */}
        <Box
          bg={cardBg}
          borderRadius={sectionRadius}
          boxShadow={sectionShadow}
          border={borderColor}
          overflow="hidden"
        >
          <Flex
            className="section-header"
            px={{ base: 4, md: 8 }}
            py={6}
            align="center"
            justify="space-between"
            borderBottom={sectionHeaderBorder}
            bg={sectionHeaderBg}
          >
            <Heading as="h2" fontSize="1.25rem" fontWeight={600} color={mainText} letterSpacing="-0.02em">
              Job Applications
            </Heading>
            <Button
              leftIcon={<AddIcon />}
              bgGradient={purpleGradient}
              color="white"
              fontWeight={600}
              borderRadius="8px"
              px={6}
              py={2.5}
              fontSize="md"
              _hover={{ boxShadow: '0 4px 16px rgba(139,92,246,0.3)', transform: 'translateY(-1px)' }}
              _active={{ transform: 'translateY(0)' }}
              boxShadow="0 1px 3px rgba(139,92,246,0.2)"
              onClick={handleCreateNew}
            >
              New Application
            </Button>
          </Flex>
          <Box className="applications-grid" px={0} py={0}>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} p={{ base: 4, md: 8 }}>
              {jobApplications.map((application) => {
                const badge = getStatusBadge(application.status);
                return (
                  <Box
                    key={application.id}
                    className="application-card"
                    bg="rgba(255,255,255,0.8)"
                    borderRadius="12px"
                    p={6}
                    boxShadow="0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(139,92,246,0.04)"
                    border="0.5px solid rgba(255,255,255,0.3)"
                    position="relative"
                    transition="all 0.3s cubic-bezier(0.4,0,0.2,1)"
                    _hover={{
                      transform: 'translateY(-4px) scale(1.01)',
                      boxShadow: '0 8px 32px rgba(139,92,246,0.12), 0 1px 3px rgba(0,0,0,0.1)',
                      borderColor: 'rgba(139,92,246,0.2)',
                    }}
                  >
                    <Box
                      className={`status-badge ${badge.className}`}
                      position="absolute"
                      top="20px"
                      right="20px"
                      px={3}
                      py={1}
                      borderRadius="12px"
                      fontSize="11px"
                      fontWeight={600}
                      textTransform="uppercase"
                      letterSpacing="0.5px"
                      bg={badge.bg}
                      color={badge.color}
                      border={badge.border}
                    >
                      {badge.label}
                    </Box>
                    <Heading as="h3" className="job-title" fontSize="1.125rem" fontWeight={600} color={mainText} mb={2} pr="80px" letterSpacing="-0.02em">
                      {application.job_title}
                    </Heading>
                    <Text className="company-name" color={purple} fontWeight={600} fontSize="14px" mb={4} letterSpacing="-0.01em">
                      {application.company_name}
                    </Text>
                    <Text className="application-meta" color={subtitleText} fontSize="13px" mb={6} fontWeight={400}>
                      {badge.label === 'SUBMITTED'
                        ? `Submitted ${new Date(application.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`
                        : `Started ${new Date(application.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`}
                    </Text>
                    <Button
                      className="continue-button"
                      w="100%"
                      bg="rgba(139,92,246,0.06)"
                      border="0.5px solid rgba(139,92,246,0.15)"
                      color={purple}
                      py={3}
                      borderRadius="8px"
                      fontWeight={600}
                      fontSize="14px"
                      letterSpacing="-0.01em"
                      _hover={{
                        bgGradient: purpleGradient,
                        color: 'white',
                        borderColor: 'transparent',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 16px rgba(139,92,246,0.25)',
                      }}
                      _active={{ transform: 'translateY(0)' }}
                      onClick={() => navigate(`/applications/${application.id}`)}
                    >
                      {badge.label === 'SUBMITTED' ? 'View Application' : 'Continue Application'}
                    </Button>
                  </Box>
                );
              })}
            </SimpleGrid>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}; 