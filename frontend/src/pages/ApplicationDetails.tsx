import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Box, Container, Heading, Spinner, Text, VStack, useToast, Button, Flex, Tabs, TabList, TabPanels, Tab, TabPanel, Grid } from '@chakra-ui/react';
import EmphasisAreas from '../components/EmphasisAreas';
import ResumeHtmlCanvas from '../components/ResumeHtmlCanvas';
import ChatInterface from '../components/ChatInterface';
import { useChat } from '../hooks/useChat';
import { contextService } from '../services/contextService';

interface Application {
  id: string;
  job_title: string;
  company_name: string;
  job_description: string;
  resume_emphasis?: string | any[];
  required_skills?: string[];
  preferred_qualifications?: string[];
  experience_level?: string;
  key_responsibilities?: string[];
  company_info?: any;
  keywords?: string[];
}

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
}

/**
 * ApplicationDetails page displays a job application and its latest resume version.
 * Shows emphasis areas and resume content in the SpecCanvas or ResumeHtmlCanvas.
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
  const [application, setApplication] = useState<Application | null>(null);
  const [resume, setResume] = useState<ResumeVersion | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [unsavedResumeContent, setUnsavedResumeContent] = useState<string | null>(null);
  const [emphasisAreas, setEmphasisAreas] = useState<any[]>([]);
  const [jobDescriptionAnalysis, setJobDescriptionAnalysis] = useState<JobDescriptionAnalysis | null>(null);
  const conversationId = `app-${id}`;
  const { updateContext } = useChat(conversationId);

  // Helper to reload resume after upload
  const fetchResume = async (appId: string) => {
    const { data: resumes, error: resumeError } = await supabase
      .from('resume_versions')
      .select('*')
      .eq('job_application_id', appId)
      .order('version_number', { ascending: false })
      .limit(1);
    if (resumeError) {
      toast({
        title: 'Error',
        description: resumeError.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    setResume(resumes && resumes.length > 0 ? resumes[0] : null);
  };

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch job application
        const { data: app, error: appError } = await supabase
          .from('job_applications')
          .select('*')
          .eq('id', id)
          .single();
        if (appError) throw appError;
        setApplication(app);

        // Parse emphasis areas (assume stored as JSON/text array in job_description_analysis or similar)
        let emphasis: any[] = [];
        if (app.resume_emphasis) {
          emphasis = Array.isArray(app.resume_emphasis)
            ? app.resume_emphasis
            : typeof app.resume_emphasis === 'string'
              ? JSON.parse(app.resume_emphasis)
              : [];
        }
        setEmphasisAreas(emphasis);

        // Fetch latest resume version
        await fetchResume(id);

        // If we have a job description, analyze it
        setJobDescriptionAnalysis({
          results: {
            required_skills: app.required_skills,
            preferred_qualifications: app.preferred_qualifications,
            experience_level: app.experience_level,
            key_responsibilities: app.key_responsibilities,
            company_info: app.company_info,
            keywords: app.keywords,
            resume_emphasis: app.resume_emphasis,
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
    // eslint-disable-next-line
  }, [id, toast]);

  // Initialize chat context after data is loaded
  useEffect(() => {
    if (!conversationId || !resume || !application || !jobDescriptionAnalysis) return;
    
    // Update resume content
    contextService.updateContent(conversationId, {
      type: 'resume',
      content: resume.html_content || '',
      version: resume.version_number
    });

    // Update job description content
    contextService.updateContent(conversationId, {
      type: 'jobDescription',
      content: application.job_description || '',
      version: 1
    });

    // Update analysis content
    contextService.updateContent(conversationId, {
      type: 'analysis',
      content: JSON.stringify(jobDescriptionAnalysis) || '',
      version: 1
    });
  }, [conversationId, resume, application, jobDescriptionAnalysis]);

  // Save button handler: persist to DB
  const handleSaveResume = async () => {
    if (!unsavedResumeContent || !id) return;
    try {
      // Get the current max version number for this application
      const { data: versions, error: versionError } = await supabase
        .from('resume_versions')
        .select('version_number')
        .eq('job_application_id', id)
        .order('version_number', { ascending: false })
        .limit(1);
      if (versionError) throw versionError;
      const nextVersion = versions && versions.length > 0 ? versions[0].version_number + 1 : 1;

      // Insert new resume version with both HTML and Markdown content
      const { error: insertError } = await supabase
        .from('resume_versions')
        .insert([
          {
            job_application_id: id,
            content: resume?.content || '',  // Keep the original Markdown content
            html_content: unsavedResumeContent,  // Save the HTML content
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
      // Reload resume from DB to ensure state is in sync
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
  };

  // Handle tool responses from chat
  const handleToolResponse = (response: ToolResponse) => {
    console.log('🔍 handleToolResponse called with:', response);
    console.log('📥 Tool response received in ApplicationDetails:', {
      success: response.success,
      newHtmlLength: response.newHtml?.length,
      explanation: response.explanation,
      resume: resume,  // Log the entire resume object
      resumeExists: !!resume,
      currentHtmlContent: resume?.html_content?.substring(0, 100) + '...',
      newHtmlPreview: response.newHtml?.substring(0, 100) + '...'
    });

    if (response.success && response.newHtml && resume) {
      console.log('🔄 Updating resume state with new HTML');
      // Update the HTML content
      setUnsavedResumeContent(response.newHtml);
      setResume(prevResume => {
        if (!prevResume) return null;
        console.log('📝 Previous resume state:', {
          hasHtmlContent: !!prevResume.html_content,
          htmlContentLength: prevResume.html_content?.length,
          newHtmlLength: response.newHtml?.length
        });
        return {
          ...prevResume,
          html_content: response.newHtml || null
        };
      });
    } else {
      console.log('⚠️ Skipping resume update:', {
        success: response.success,
        hasNewHtml: !!response.newHtml,
        hasResume: !!resume,
        newHtmlPreview: response.newHtml?.substring(0, 100) + '...'
      });
    }
  };

  if (loading) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="purple.400" />
      </Box>
    );
  }
  if (error) {
    return (
      <Container maxW="container.md" py={16}>
        <VStack spacing={6}>
          <Heading size="lg">Error</Heading>
          <Text color="red.400">{error}</Text>
          <Button onClick={() => navigate(-1)} colorScheme="purple">Back</Button>
        </VStack>
      </Container>
    );
  }
  if (!application) {
    return (
      <Container maxW="container.md" py={16}>
        <VStack spacing={6}>
          <Heading size="lg">Not Found</Heading>
          <Text color="gray.400">Job application not found.</Text>
          <Button onClick={() => navigate(-1)} colorScheme="purple">Back</Button>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" p={0} position="relative">
      <VStack spacing={8} align="stretch">
        <Flex justify="space-between" align="center" px={4}>
          <Box>
            <Heading color="gray.100">{application.job_title || 'Untitled Position'}</Heading>
            <Text color="gray.400">{application.company_name}</Text>
          </Box>
          <Flex gap={2}>
            <Button
              colorScheme="purple"
              onClick={handleSaveResume}
              isDisabled={!unsavedResumeContent}
            >
              Save
            </Button>
          </Flex>
        </Flex>
        {/* Show EmphasisAreas above the canvas in both views */}
        {application?.resume_emphasis && (
          <Box px={4}>
            <EmphasisAreas emphasis={typeof application.resume_emphasis === 'string' ? JSON.parse(application.resume_emphasis) : application.resume_emphasis} />
          </Box>
        )}
        
        {/* Main content area */}
        <Box px={4} position="relative">
          <Tabs
            index={0}
            variant="enclosed"
            colorScheme="purple"
          >
            <TabList>
              <Tab>HTML</Tab>
            </TabList>
            <TabPanels>
              <TabPanel p={0} position="relative">
                <Box>
                  <ResumeHtmlCanvas 
                    htmlContent={resume?.html_content || null} 
                    conversationId={conversationId}
                    onUpdate={(newHtml) => {
                      setUnsavedResumeContent(newHtml);
                      if (resume) {
                        setResume({
                          ...resume,
                          html_content: newHtml
                        });
                      }
                    }}
                  />
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>

          {/* Floating chat interface */}
          <Box 
            position="fixed"
            right="4"
            top="50%"
            transform="translateY(-50%)"
            width="600px"
            height="calc(100vh - 200px)"
            bg="white"
            borderRadius="lg"
            boxShadow="2xl"
            overflow="hidden"
            zIndex={10}
            display={{ base: 'none', lg: 'block' }}
            css={{
              '&::-webkit-scrollbar': {
                width: '4px',
              },
              '&::-webkit-scrollbar-track': {
                width: '6px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'gray.200',
                borderRadius: '24px',
              },
            }}
          >
            <Box 
              height="100%" 
              overflowY="auto"
              css={{
                '&::-webkit-scrollbar': {
                  width: '4px',
                },
                '&::-webkit-scrollbar-track': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'gray.200',
                  borderRadius: '24px',
                },
              }}
            >
              <ChatInterface 
                conversationId={conversationId}
                onUpdateMessages={(messages) => {
                  console.log('Messages updated:', messages);
                }}
                onToolResponse={handleToolResponse}
              />
            </Box>
          </Box>
        </Box>
      </VStack>
    </Container>
  );
};

export default ApplicationDetailsWrapper; 