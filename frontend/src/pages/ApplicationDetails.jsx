import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Box, Container, Heading, Spinner, Text, VStack, useToast, Button, HStack, Badge, Flex } from '@chakra-ui/react';
import SpecCanvas from '../components/SpecCanvas';
import ChatWrapper from '../components/ChatWrapper';
import EmphasisAreas from '../components/EmphasisAreas';
import { Sidebar } from '../components/Sidebar';

/**
 * ApplicationDetails page displays a job application and its latest resume version.
 * Shows emphasis areas and resume content in the SpecCanvas.
 */
export default function ApplicationDetailsWrapper() {
  return (
    <Flex direction="row" align="stretch" minH="100vh" bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
      <Box ml="0" flex={1} p={4}>
        <ApplicationDetails />
      </Box>
    </Flex>
  );
}

function ApplicationDetails() {
  const { id } = useParams();
  /** @type {[boolean, Function]} */
  const [loading, setLoading] = useState(true);
  /** @type {[string, Function]} */
  const [error, setError] = useState('');
  /** @type {[object|null, Function]} */
  const [application, setApplication] = useState(null);
  /** @type {[object|null, Function]} */
  const [resume, setResume] = useState(null);
  /** @type {[string[], Function]} */
  const [emphasisAreas, setEmphasisAreas] = useState([]);
  /** @type {[object|null, Function]} */
  const [jobDescriptionAnalysis, setJobDescriptionAnalysis] = useState(null);
  /** @type {[Array, Function]} */
  const [messages, setMessages] = useState([]);
  /** @type {[boolean, Function]} */
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  /** @type {[object, Function]} */
  const [promptPresets, setPromptPresets] = useState({});
  /** @type {[string|null, Function]} */
  const [unsavedResumeContent, setUnsavedResumeContent] = useState(null);

  // Generate a unique conversationId for this application
  const conversationId = id ? `app-${id}` : undefined;

  // Helper to reload resume after upload
  const fetchResume = async (appId) => {
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

  // Helper to analyze job description
  const analyzeJobDescription = async (jobDescription) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/spec/analyze-job-description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: jobDescription,
          analysisType: 'full_analysis'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze job description');
      }

      const analysis = await response.json();
      setJobDescriptionAnalysis(analysis);
      return analysis;
    } catch (error) {
      toast({
        title: 'Analysis Failed',
        description: 'Unable to analyze job description',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    }
  };

  // Handle sending a message
  const handleSendMessage = async (message) => {
    setIsSendingMessage(true);
    try {
      const newMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, newMessage]);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/spec/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationId,
          jobDescription: application?.job_description,
          resumeContent: resume?.content
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get response from assistant',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  /**
   * Returns quick revision prompts for a given bullet (selected text)
   * @param {string} selectedText
   * @returns {Array<{title: string, prompt: string}>}
   */
  const getQuickRevisionsForBullet = (selectedText) => {
    if (!selectedText) return [];
    return promptPresets[selectedText] || [];
  };

  // Update promptPresets when jobDescriptionAnalysis changes
  useEffect(() => {
    if (jobDescriptionAnalysis?.results?.prompt_presets) {
      setPromptPresets(jobDescriptionAnalysis.results.prompt_presets);
    }
  }, [jobDescriptionAnalysis]);

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
        let emphasis = [];
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
      } catch (err) {
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

  // Modified handleAcceptRevision: only update local state
  const handleAcceptRevision = (selectedText, revisedText) => {
    if (!resume) return;
    // Replace selectedText with revisedText in the current resume content
    const updatedContent = resume.content.replace(selectedText, revisedText);
    setUnsavedResumeContent(updatedContent);
    setResume(prev => ({ ...prev, content: updatedContent }));
    toast({
      title: 'Revision applied',
      description: 'Your revision has been applied. Click Save to persist changes.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

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
      // Insert new resume version
      const { error: insertError } = await supabase
        .from('resume_versions')
        .insert([
          {
            job_application_id: id,
            content: unsavedResumeContent,
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
    } catch (err) {
      toast({
        title: 'Save failed',
        description: err.message || 'Failed to save resume',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  /**
   * Regenerates quick revision prompts for a given bullet (selected text)
   * @param {string} selectedText
   * @param {boolean} force
   */
  const onRegeneratePrompts = async (selectedText, force = false) => {
    if (!selectedText || !application?.job_description) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/spec/generate-prompts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedText,
          jobDescription: application.job_description,
          writingTone: 'concise',
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to generate prompts');
      }
      const data = await response.json();
      setPromptPresets(prev => ({ ...prev, [selectedText]: data.prompts }));
    } catch (error) {
      throw error;
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
    <Container maxW="container.xl">
      <VStack spacing={8} align="stretch">
        <Heading color="gray.100">{application.job_title || 'Untitled Position'}</Heading>
        <Text color="gray.400">{application.company_name}</Text>
        <Box display="flex" gap={8}>
          <Box flex="1">
            {/* Show EmphasisAreas above the canvas if available */}
            {application?.resume_emphasis && (
              <EmphasisAreas emphasis={typeof application.resume_emphasis === 'string' ? JSON.parse(application.resume_emphasis) : application.resume_emphasis} />
            )}
            <SpecCanvas 
              resumeMarkdown={resume?.content || ''} 
              emphasisAreas={emphasisAreas}
              jobDescription={application.job_description}
              jobDescriptionProvided={!!application.job_description}
              onAcceptRevision={handleAcceptRevision}
              conversationId={conversationId}
              onUpdateMessages={setMessages}
              resumeEmphasis={jobDescriptionAnalysis?.results?.emphasis_areas}
              getQuickRevisionsForBullet={getQuickRevisionsForBullet}
              onRegeneratePrompts={onRegeneratePrompts}
            />
            <Button
              mt={4}
              colorScheme="purple"
              onClick={handleSaveResume}
              isDisabled={!unsavedResumeContent}
            >
              Save
            </Button>
          </Box>
          <Box width="400px">
            <ChatWrapper
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isSendingMessage}
              inputBg="gray.800"
              inputColor="gray.100"
            />
          </Box>
        </Box>
      </VStack>
    </Container>
  );
} 