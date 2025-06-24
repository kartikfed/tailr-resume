import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Box, Container, Heading, Spinner, Text, VStack, useToast, Button, Flex, Tabs, TabList, TabPanels, Tab, TabPanel, Grid, HStack, IconButton } from '@chakra-ui/react';
import ResumeHtmlCanvas from '../components/ResumeHtmlCanvas';
import FloatingChat from '../components/FloatingChat';
import { useChat } from '../hooks/useChat';
import { contextService } from '../services/contextService';
import { FiSave } from 'react-icons/fi';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { JobApplication, JobAnalysisResponse, ResumeEmphasis } from '../types/jobApplication';
import { AnalyticsModal } from '../components/Analytics/AnalyticsModal';
import { apiService } from '../services/apiService';

interface ResumeVersion {
  id: string;
  job_application_id: string;
  content: string;
  html_content: string | null;
  version_number: number;
}

interface JobDescriptionAnalysis {
  results: Record<string, any>;
}

interface ToolResponse {
  success: boolean;
  newHtml?: string;
  explanation?: string;
  changes?: Array<{
    type: 'update' | 'add' | 'remove' | 'reorder';
    location: string;
    content: string;
    elementSelector?: string;
  }>;
}

/**
 * GlassHeaderProps defines the props for the floating glass header.
 */
interface GlassHeaderProps {
  jobTitle: string;
  companyName: string;
  hasUnsavedChanges: boolean;
  onSave: () => void;
  isSaving?: boolean;
  onRunAnalytics: () => void;
  isAnalyticsLoading: boolean;
  onExportPdf: () => void;
}

/**
 * GlassHeader renders the floating glassmorphism header for the application details page.
 */
const GlassHeader: React.FC<GlassHeaderProps & { emphasis?: any }> = ({ jobTitle, companyName, hasUnsavedChanges, onSave, isSaving, onRunAnalytics, isAnalyticsLoading, onExportPdf, emphasis }) => {
  const [isEmphasisOpen, setIsEmphasisOpen] = useState(false);
  // Flatten all emphasis items into a single list for 'Key Focus Points'
  const allItems: string[] = emphasis
    ? Object.values(emphasis)
        .filter((items) => Array.isArray(items) && items.length > 0)
        .flat() as string[]
    : [];
  return (
    <Box
      width="100%"
      px={4}
      mt={{ base: 4, md: 8 }}
      mb={{ base: 8, md: 12 }}
      borderRadius="24px"
      bg="rgba(255,255,255,0.08)"
      border="1px solid rgba(255,255,255,0.15)"
      boxShadow="0 25px 80px rgba(0,0,0,0.15), 0 8px 32px rgba(139,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.1)"
      backdropFilter="blur(40px) saturate(200%)"
      position="relative"
      overflow="hidden"
      animation="float 6s ease-in-out infinite"
      zIndex={10}
      transition="max-height 0.4s cubic-bezier(0.4,0,0.2,1)"
      maxHeight={isEmphasisOpen && allItems.length > 0 ? '700px' : '260px'}
      minHeight="180px"
    >
      {/* Shimmer effect */}
      <Box
        as="span"
        position="absolute"
        top={0}
        left={0}
        w="100%"
        h="100%"
        pointerEvents="none"
        zIndex={1}
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
          animation: 'shimmer 3s infinite',
        }}
      />
      <Box px={{ base: 4, md: 10 }} py={{ base: 6, md: 8 }} position="relative" zIndex={2}>
        {/* Top Row: Breadcrumb + Save Section */}
        <Flex justify="space-between" align="center" mb={6} flexWrap="wrap">
          <HStack spacing={2} fontSize="11px" color="rgba(255,255,255,0.6)" textTransform="uppercase" fontWeight={600} letterSpacing="1px">
            <Text>Resume Editor</Text>
            <Text as="span" color="rgba(255,255,255,0.4)" fontSize="10px">→</Text>
            <Text>Applications</Text>
          </HStack>
          <Flex align="center" gap={4} className="save-section">
            <Flex align="center" gap={2} fontSize="12px" color="rgba(255,255,255,0.7)" fontWeight={500}>
              <Box
                w="8px"
                h="8px"
                borderRadius="full"
                bg={hasUnsavedChanges ? '#f59e0b' : '#22c55e'}
                boxShadow={hasUnsavedChanges ? '0 0 8px rgba(245,158,11,0.4)' : '0 0 8px rgba(34,197,94,0.4)'}
                animation={hasUnsavedChanges ? 'pulse 2s infinite' : undefined}
                aria-label={hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved'}
              />
              <Text>{hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved'}</Text>
            </Flex>
            <Button
              leftIcon={<Box as="span" fontSize="16px">{'\u{1F4BE}'}</Box>}
              bg="rgba(255,255,255,0.12)"
              border="1px solid rgba(255,255,255,0.2)"
              borderRadius="12px"
              color="white"
              fontSize="13px"
              fontWeight={600}
              px={6}
              py={3}
              boxShadow="0 4px 16px rgba(139,92,246,0.15)"
              backdropFilter="blur(20px)"
              transition="all 0.3s cubic-bezier(0.4,0,0.2,1)"
              _hover={{
                bg: 'rgba(255,255,255,0.2)',
                borderColor: 'rgba(255,255,255,0.3)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(255,255,255,0.1), 0 4px 16px rgba(139,92,246,0.2)',
              }}
              _active={{ transform: 'translateY(0)' }}
              isDisabled={!hasUnsavedChanges || isSaving}
              isLoading={isSaving}
              onClick={onSave}
              aria-label="Save changes"
            >
              Save Changes
            </Button>
            <Button
              onClick={onRunAnalytics}
              isLoading={isAnalyticsLoading}
              bg="rgba(255,255,255,0.12)"
              border="1px solid rgba(255,255,255,0.2)"
              borderRadius="12px"
              color="white"
              fontSize="13px"
              fontWeight={600}
              px={6}
              py={3}
              _hover={{ bg: 'rgba(255,255,255,0.2)' }}
            >
              Run Analytics
            </Button>
            <Button
              onClick={onExportPdf}
              bg="rgba(255,255,255,0.12)"
              border="1px solid rgba(255,255,255,0.2)"
              borderRadius="12px"
              color="white"
              fontSize="13px"
              fontWeight={600}
              px={6}
              py={3}
              _hover={{ bg: 'rgba(255,255,255,0.2)' }}
            >
              Export to PDF
            </Button>
          </Flex>
        </Flex>
        {/* Job Info Row */}
        <Flex align="center" gap={6} className="floating-job-info">
          <Box
            w={{ base: '48px', md: '60px' }}
            h={{ base: '48px', md: '60px' }}
            bgGradient="linear(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))"
            border="2px solid rgba(255,255,255,0.2)"
            borderRadius="16px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize={{ base: '20px', md: '28px' }}
            boxShadow="0 8px 32px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.2)"
            backdropFilter="blur(20px)"
            aria-label="Company avatar"
          >
            {'\u{1F4BC}'}
          </Box>
          <Box className="floating-details">
            <Heading as="h1" fontSize={{ base: '26px', md: '32px' }} fontWeight={800} color="white" mb={1} letterSpacing="-0.03em" textShadow="0 2px 20px rgba(0,0,0,0.1)">
              {jobTitle}
            </Heading>
            <Flex align="center" gap={2} color="rgba(255,255,255,0.8)" fontSize={{ base: '14px', md: '16px' }} fontWeight={500}>
              <Box as="span" className="company-icon" w="16px" h="16px" borderRadius="4px" bg="rgba(255,255,255,0.2)" display="flex" alignItems="center" justifyContent="center" fontSize="10px">
                {'\u{1F3E2}'}
              </Box>
              <Text as="span">{companyName}</Text>
            </Flex>
          </Box>
        </Flex>
        {/* Key Focus Points section, revealed by expanding header */}
        {allItems.length > 0 && (
          <Box
            mt={isEmphasisOpen ? 8 : 0}
            opacity={isEmphasisOpen ? 1 : 0}
            height={isEmphasisOpen ? 'auto' : 0}
            transition="opacity 0.3s, margin-top 0.3s"
            pointerEvents={isEmphasisOpen ? 'auto' : 'none'}
          >
            <Text
              fontSize="13px"
              fontWeight={700}
              color="white"
              textTransform="uppercase"
              letterSpacing="0.12em"
              mb={4}
              ml={1}
              style={{ opacity: 0.85 }}
            >
              Key Focus Points
            </Text>
            <Box
              bg="rgba(255,255,255,0.18)"
              borderRadius="18px"
              boxShadow="0 4px 24px rgba(139,92,246,0.10), 0 1.5px 6px rgba(0,0,0,0.04)"
              px={{ base: 2, md: 6 }}
              py={{ base: 3, md: 5 }}
              mb={2}
              display="flex"
              flexDirection="column"
              gap={3}
            >
              {allItems.map((item, idx) => (
                <Box
                  key={idx}
                  position="relative"
                  bgGradient="linear(90deg, rgba(139,92,246,0.13) 0%, rgba(168,85,247,0.13) 100%)"
                  borderRadius="12px"
                  px={{ base: 3, md: 5 }}
                  py={{ base: 2, md: 3 }}
                  fontSize="15px"
                  color="white"
                  fontWeight={600}
                  letterSpacing="-0.01em"
                  boxShadow="0 1px 4px rgba(139,92,246,0.04)"
                  style={{ fontFamily: 'inherit', overflow: 'hidden' }}
                  _hover={{
                    transform: 'translateY(-2px) scale(1.01)',
                    boxShadow: '0 4px 16px rgba(139,92,246,0.13)',
                    bgGradient: 'linear(90deg, rgba(139,92,246,0.18) 0%, rgba(168,85,247,0.18) 100%)',
                    transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)'
                  }}
                  transition="all 0.25s cubic-bezier(0.4,0,0.2,1)"
                  _before={{
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-60%',
                    width: '60%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.13), transparent)',
                    zIndex: 1,
                    pointerEvents: 'none',
                    animation: 'shimmerFocus 2.5s infinite',
                  }}
                  zIndex={2}
                >
                  <Box position="relative" zIndex={2}>{item}</Box>
                </Box>
              ))}
            </Box>
            {/* Shimmer keyframes for focus points */}
            <style>{`
              @keyframes shimmerFocus {
                0% { left: -60%; }
                100% { left: 120%; }
              }
            `}</style>
          </Box>
        )}
        {/* Expand/collapse button at bottom right, inside header */}
        {allItems.length > 0 && (
          <Flex position="absolute" bottom={4} right={6} zIndex={20} justify="flex-end" width="100%">
            <IconButton
              aria-label={isEmphasisOpen ? 'Collapse key focus points' : 'Expand key focus points'}
              icon={isEmphasisOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
              size="md"
              variant="ghost"
              color="white"
              bg="rgba(139,92,246,0.2)"
              border="1px solid rgba(139,92,246,0.2)"
              borderRadius="full"
              fontSize="24px"
              _hover={{ bg: 'rgba(139,92,246,0.3)', borderColor: 'rgba(139,92,246,0.3)', transform: 'translateY(-1px)' }}
              onClick={() => setIsEmphasisOpen((v) => !v)}
            />
          </Flex>
        )}
      </Box>
      {/* Keyframes for float, shimmer, pulse */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.9); }
        }
      `}</style>
    </Box>
  );
};

/**
 * ApplicationDetails page displays a job application and its latest resume version.
 * Shows emphasis areas and resume content in the ResumeHtmlCanvas.
 */
const ApplicationDetailsWrapper: React.FC = () => {
  return (
    <Flex direction="row" align="stretch" minH="100vh" bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
      <Box ml="0" flex={1} p={4}>
        <ApplicationDetails />
      </Box>
    </Flex>
  );
};

const ApplicationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [application, setApplication] = useState<JobApplication | null>(null);
  const [resume, setResume] = useState<ResumeVersion | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [unsavedResumeContent, setUnsavedResumeContent] = useState<string | null>(null);
  const [jobDescriptionAnalysis, setJobDescriptionAnalysis] = useState<JobAnalysisResponse | null>(null);
  const [isAnalyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [analyticsResult, setAnalyticsResult] = useState<any | null>(null);
  const [isAnalyticsLoading, setAnalyticsLoading] = useState(false);
  const [currentChanges, setCurrentChanges] = useState<Array<{
    type: 'update' | 'add' | 'remove' | 'reorder';
    location: string;
    content: string;
    elementSelector?: string;
  }>>([]);
  const conversationId = `app-${id}`;
  const { updateContext } = useChat(conversationId);

  const fetchResume = useCallback(async (appId: string) => {
    const { data: resumes, error: resumeError } = await supabase
      .from('resume_versions')
      .select('*')
      .eq('job_application_id', appId)
      .order('version_number', { ascending: false })
      .limit(1);
    if (resumeError) {
      toast({
        title: 'Error fetching resume',
        description: resumeError.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    setResume(resumes && resumes.length > 0 ? resumes[0] : null);
  }, [toast]);

  const handleSaveResume = useCallback(async () => {
    if (!unsavedResumeContent || !id || !resume) return;
    try {
      const { data: versions, error: versionError } = await supabase
        .from('resume_versions')
        .select('version_number')
        .eq('job_application_id', id)
        .order('version_number', { ascending: false })
        .limit(1);
      if (versionError) throw versionError;
      const nextVersion = versions && versions.length > 0 ? versions[0].version_number + 1 : 1;

      const { error: insertError } = await supabase
        .from('resume_versions')
        .insert([
          {
            job_application_id: id,
            content: resume.content || '',
            html_content: unsavedResumeContent,
            version_number: nextVersion,
          },
        ]);
      if (insertError) throw insertError;

      toast({
        title: 'Resume saved',
        description: 'Your changes have been saved as a new version.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setUnsavedResumeContent(null);
      await fetchResume(id);
    } catch (err: any) {
      toast({
        title: 'Save failed',
        description: err.message || 'Failed to save resume',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [id, unsavedResumeContent, resume, toast, fetchResume]);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: app, error: appError } = await supabase
          .from('job_applications')
          .select('*')
          .eq('id', id)
          .single();
        if (appError) throw appError;
        setApplication(app);

        if (app.resume_emphasis) {
          // No need to parse, it's already an object
        }

        await fetchResume(id);

        setJobDescriptionAnalysis({
          results: {
            required_skills: app.required_skills || [],
            preferred_qualifications: app.preferred_qualifications || [],
            experience_level: app.experience_level || '',
            key_responsibilities: app.key_responsibilities || [],
            company_info: app.company_info || { description: '', industry: '' },
            keywords: app.keywords || [],
            resume_emphasis: app.resume_emphasis || { summary: '', key_points: [] },
            keywords_by_priority: app.keywords_by_priority || { critical: [], important: [], nice_to_have: [] },
            exact_phrases: app.exact_phrases || [],
            acronym_pairs: app.acronym_pairs || [],
            experience_requirements: app.experience_requirements || [],
            section_keywords: app.section_keywords || { summary_emphasis: [], skills_section: [], experience_bullets: [] }
          }
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load application');
        toast({
          title: 'Error',
          description: err.message || 'Failed to load application',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, toast, fetchResume]);

  useEffect(() => {
    if (!conversationId || !resume || !application || !jobDescriptionAnalysis) return;
    contextService.updateContent(conversationId, { type: 'resume', content: resume.html_content || '', version: resume.version_number });
    contextService.updateContent(conversationId, { type: 'jobDescription', content: application.job_description || '', version: 1 });
    contextService.updateContent(conversationId, { type: 'analysis', content: JSON.stringify(jobDescriptionAnalysis) || '', version: 1 });
  }, [conversationId, resume, application, jobDescriptionAnalysis]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (unsavedResumeContent) {
          handleSaveResume();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [unsavedResumeContent, handleSaveResume]);

  const handleRunAnalytics = async () => {
    if (!jobDescriptionAnalysis || !resume?.html_content) {
      toast({
        title: 'Missing Data',
        description: 'Cannot run analysis without a job description and resume.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    setAnalyticsLoading(true);
    setAnalyticsModalOpen(true);
    const { data, error } = await apiService.analyzeSimilarity(jobDescriptionAnalysis.results, resume.html_content);
    setAnalyticsLoading(false);
    if (error) {
      toast({
        title: 'Analysis Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setAnalyticsResult(null);
    } else {
      setAnalyticsResult(data.analysis);
    }
  };

  const handleExportPdf = async () => {
    if (!resume?.html_content) {
      toast({
        title: 'No Content',
        description: 'There is no resume content to export.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      const { data, error } = await apiService.exportPdf(resume.html_content);
      if (error) {
        throw error;
      }
      if (data) {
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'resume.pdf');
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
      }
    } catch (err: any) {
      toast({
        title: 'Export Failed',
        description: err.message || 'Failed to export PDF',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleToolResponse = (response: ToolResponse) => {
    if (response.success && response.newHtml && resume) {
      setUnsavedResumeContent(response.newHtml);
      setResume(prev => prev ? { ...prev, html_content: response.newHtml || null } : null);
      if (response.changes) {
        setCurrentChanges(response.changes);
        setTimeout(() => setCurrentChanges([]), 2000);
      }
    }
  };

  if (loading) {
    return <Box minH="100vh" display="flex" alignItems="center" justifyContent="center"><Spinner size="xl" color="purple.400" /></Box>;
  }
  if (error) {
    return <Container maxW="container.md" py={16}><VStack spacing={6}><Heading size="lg">Error</Heading><Text color="red.400">{error}</Text><Button onClick={() => navigate(-1)} colorScheme="purple">Back</Button></VStack></Container>;
  }
  if (!application) {
    return <Container maxW="container.md" py={16}><VStack spacing={6}><Heading size="lg">Not Found</Heading><Text>Job application not found.</Text><Button onClick={() => navigate(-1)} colorScheme="purple">Back</Button></VStack></Container>;
  }

  return (
    <Container maxW="container.xl" p={0} position="relative">
      <VStack spacing={8} align="stretch">
        <GlassHeader
          jobTitle={application.job_title || 'Untitled Position'}
          companyName={application.company_name || ''}
          hasUnsavedChanges={!!unsavedResumeContent}
          onSave={handleSaveResume}
          emphasis={application.resume_emphasis}
          onRunAnalytics={handleRunAnalytics}
          isAnalyticsLoading={isAnalyticsLoading}
          onExportPdf={handleExportPdf}
        />
        <Box px={4} position="relative">
          <ResumeHtmlCanvas
            htmlContent={resume?.html_content || null}
            conversationId={conversationId}
            onUpdate={(newHtml) => {
              setUnsavedResumeContent(newHtml);
              if (resume) {
                setResume({ ...resume, html_content: newHtml });
              }
            }}
            changes={currentChanges}
          />
          <FloatingChat
            conversationId={conversationId}
            onUpdateMessages={() => {}}
            onToolResponse={handleToolResponse}
          />
        </Box>
      </VStack>
      <AnalyticsModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setAnalyticsModalOpen(false)}
        analysis={analyticsResult}
        isLoading={isAnalyticsLoading}
      />
    </Container>
  );
};

export default ApplicationDetailsWrapper; 