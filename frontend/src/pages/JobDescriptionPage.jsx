import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  useToast,
  useColorModeValue,
  Textarea,
  Input,
  FormControl,
  FormLabel,
  FormHelperText,
  Spinner,
  HStack,
  IconButton,
} from '@chakra-ui/react';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { ResumeManager } from '../components/ResumeManager';
import { uploadFiles } from '../services/apiService';
import { readFileContent } from '../utils/fileReader';

const JobDescriptionPage = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobDescriptionSaved, setJobDescriptionSaved] = useState(false);
  const [jobDescriptionProvided, setJobDescriptionProvided] = useState(false);
  const [isSavingJobDescription, setIsSavingJobDescription] = useState(false);
  const [resumeEmphasis, setResumeEmphasis] = useState(null);
  const [promptPresets, setPromptPresets] = useState([]);
  const [writingTone, setWritingTone] = useState('concise');
  const [jobUrl, setJobUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState('');
  const [error, setError] = useState('');
  const [processedResumeContent, setProcessedResumeContent] = useState('');
  const [isProcessingResume, setIsProcessingResume] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const bgColor = useColorModeValue('gray.900', 'gray.900');
  const borderColor = useColorModeValue('gray.700', 'gray.700');
  const textColor = useColorModeValue('gray.100', 'gray.100');
  const chatPaneBgColor = useColorModeValue('purple.900', 'purple.900');
  const chatInputBgColor = useColorModeValue('purple.800', 'purple.800');

  // Fetch most recent resume on component mount
  useEffect(() => {
    const fetchMostRecentResume = async () => {
      try {
        const { data, error } = await supabase
          .from('resume_files')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;
        
        if (data && data.length > 0) {
          setSelectedResumeId(data[0].id);
        }
      } catch (error) {
        console.error('Error fetching most recent resume:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch most recent resume',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchMostRecentResume();
  }, [toast]);

  const handleSaveJobDescription = async () => {
    console.log('handleSaveJobDescription: started');
    if (jobDescription.trim()) {
      try {
        if (!jobTitle.trim() || !companyName.trim()) {
          console.warn('Missing job title or company name');
          toast({
            title: 'Missing Information',
            description: 'Please provide both job title and company name',
            status: 'warning',
            duration: 5000,
            isClosable: true,
            position: 'top-right'
          });
          console.log('Exiting: missing job title or company name');
          return;
        }

        if (!selectedResumeId) {
          console.warn('Missing selectedResumeId', { selectedResumeId });
          toast({
            title: 'Missing Resume',
            description: 'Please select a resume to use for this application',
            status: 'warning',
            duration: 5000,
            isClosable: true,
            position: 'top-right'
          });
          console.log('Exiting: missing selectedResumeId');
          return;
        }

        setIsSavingJobDescription(true);
        setIsAnalyzing(true);
        setProgressValue(0);
        setAnalysisStage('Initializing analysis...');
        console.log('Step: after initial validation');

        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('User fetch error:', userError);
          console.log('Exiting: user fetch error');
          throw userError || new Error('No user found');
        }
        console.log('Fetched user:', user);

        // Fetch resume file metadata
        const { data: resumeFile, error: fileError } = await supabase
          .from('resume_files')
          .select('*')
          .eq('id', selectedResumeId)
          .single();
        if (fileError || !resumeFile) {
          console.error('Resume file fetch error:', fileError);
          console.log('Exiting: resume file fetch error');
          throw fileError || new Error('No resume file found');
        }
        console.log('Fetched resume file metadata:', resumeFile);

        // Download file from Supabase Storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('resumes')
          .download(resumeFile.file_path);
        if (downloadError || !fileData) {
          console.error('Resume file download error:', downloadError);
          console.log('Exiting: resume file download error');
          throw downloadError || new Error('Failed to download resume file');
        }
        console.log('Downloaded file from Supabase Storage:', fileData);

        // Convert Blob to File object to match the working flow
        let file;
        try {
          file = new File([
            fileData
          ], resumeFile.file_name, { type: resumeFile.file_type });
        } catch (e) {
          console.error('Failed to create File object from Blob:', e);
          console.log('Exiting: failed to create File object');
          throw new Error('Failed to process resume file');
        }
        console.log('Created File object:', {
          name: file.name,
          type: file.type,
          size: file.size
        });

        // Read file as base64 or text using shared utility
        let fileContent;
        try {
          fileContent = await readFileContent(file, resumeFile.file_name);
        } catch (e) {
          console.error('Failed to read file content:', e);
          console.log('Exiting: failed to read file content');
          throw new Error('Failed to read resume file content');
        }
        if (!fileContent) {
          console.error('File content is empty after reading');
          console.log('Exiting: file content is empty after reading');
          throw new Error('Resume file content is empty');
        }
        console.log('Read file content:', fileContent?.slice(0, 100));

        // Process resume through /upload endpoint
        let uploadResponse;
        try {
          const conversationId = `resume-${selectedResumeId}`;
          console.log('About to call uploadFiles', {
            conversationId,
            fileMeta: {
              name: resumeFile.file_name,
              type: resumeFile.file_type,
              size: resumeFile.file_size
            },
            fileContentPreview: fileContent?.slice(0, 100)
          });
          uploadResponse = await uploadFiles(conversationId, [{
            name: resumeFile.file_name,
            type: resumeFile.file_type,
            size: resumeFile.file_size,
            content: fileContent,
            isPdf: resumeFile.file_type === 'application/pdf' || resumeFile.file_name.endsWith('.pdf'),
            useClaude: true,
          }]);
          console.log('uploadFiles response:', uploadResponse);
        } catch (e) {
          console.error('Failed to process resume through /upload endpoint:', e);
          console.log('Exiting: failed to process resume through /upload endpoint');
          throw new Error('Resume processing failed');
        }
        const processedContent = uploadResponse?.files?.[0]?.content || '';
        if (!processedContent) {
          console.error('Processed resume content is empty:', uploadResponse);
          console.log('Exiting: processed resume content is empty');
          throw new Error('Processed resume content is empty');
        }
        console.log('Processed resume content from /upload:', processedContent?.slice(0, 100));

        // Process job description through /analyze-job-description endpoint
        setAnalysisStage('Analyzing job description...');
        let jobAnalysis;
        try {
          const jobAnalysisResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/spec/analyze-job-description`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: jobDescription,
              analysisType: 'full_analysis'
            }),
          });
          if (!jobAnalysisResponse.ok) {
            console.log('Exiting: job description analysis response not ok');
            throw new Error('Failed to analyze job description');
          }
          jobAnalysis = await jobAnalysisResponse.json();
        } catch (e) {
          console.error('Job description analysis failed:', e);
          console.log('Exiting: job description analysis failed');
          throw new Error('Job description analysis failed');
        }
        console.log('Job description analysis:', jobAnalysis);

        // Save to job_applications table
        let jobApplication;
        try {
          const { data, error: jobError } = await supabase
            .from('job_applications')
            .insert([
              {
                user_id: user.id,
                job_title: jobTitle,
                company_name: companyName,
                job_url: jobUrl,
                job_description: jobDescription,
                status: 'draft',
                resume_file_id: selectedResumeId,
                required_skills: jobAnalysis.results?.required_skills || [],
                preferred_qualifications: jobAnalysis.results?.preferred_qualifications || [],
                experience_level: jobAnalysis.results?.experience_level || '',
                key_responsibilities: jobAnalysis.results?.key_responsibilities || [],
                company_info: jobAnalysis.results?.company_info || {},
                keywords: jobAnalysis.results?.keywords || [],
                resume_emphasis: jobAnalysis.results?.resume_emphasis || null
              }
            ])
            .select()
            .single();
          if (jobError || !data) {
            console.error('Job application insert error:', jobError);
            console.log('Exiting: job application insert error');
            throw jobError || new Error('Failed to create job application');
          }
          jobApplication = data;
        } catch (e) {
          console.error('Failed to insert job application:', e);
          console.log('Exiting: failed to insert job application');
          throw new Error('Failed to create job application');
        }
        if (!jobApplication?.id) {
          console.error('No job application ID returned after insert:', jobApplication);
          console.log('Exiting: no job application ID returned');
          throw new Error('No job application ID returned');
        }
        console.log('Job application created:', jobApplication);

        // Save processed resume content to resume_versions table
        try {
          const { error: resumeError, data: resumeVersionData } = await supabase
            .from('resume_versions')
            .insert([
              {
                job_application_id: jobApplication.id,
                content: processedContent,
                version_number: 1
              }
            ])
            .select()
            .single();
          if (resumeError || !resumeVersionData) {
            console.error('Resume version insert error:', resumeError);
            console.log('Exiting: resume version insert error');
            throw resumeError || new Error('Failed to save resume version');
          }
          console.log('Resume version created:', resumeVersionData);
        } catch (e) {
          console.error('Failed to insert resume version:', e);
          console.log('Exiting: failed to insert resume version');
          throw new Error('Failed to save resume version');
        }

        toast({
          title: 'Success',
          description: 'Job application created successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: 'top-right'
        });

        // Navigate to the application details page
        navigate(`/applications/${jobApplication.id}`);
        console.log('handleSaveJobDescription: completed successfully');
      } catch (error) {
        console.error('Error in handleSaveJobDescription:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to create job application',
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top-right'
        });
        console.log('Exiting: caught error in main try/catch');
      } finally {
        setIsSavingJobDescription(false);
        setIsAnalyzing(false);
        setProgressValue(0);
        setAnalysisStage('');
        console.log('handleSaveJobDescription: finally block');
      }
    } else {
      console.warn('Job description is empty');
      console.log('Exiting: job description is empty');
    }
  };

  const handleScrapeJob = async () => {
    if (!jobUrl.trim()) return;
    try {
      setIsScraping(true);
      setError('');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/spec/scrape-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jobUrl }),
      });
      if (!response.ok) throw new Error('Failed to scrape job description');
      const data = await response.json();
      if (data.jobDescription) {
        setJobDescription(data.jobDescription);
        if (data.jobTitle) setJobTitle(data.jobTitle);
        if (data.companyName) setCompanyName(data.companyName);
        toast({
          title: 'Job Details Scraped',
          description: 'Successfully retrieved job information',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top-right'
        });
      }
    } catch (error) {
      setError(error.message);
      toast({
        title: 'Scraping Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top-right'
      });
    } finally {
      setIsScraping(false);
    }
  };

  return (
    <Box minH="100vh" bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" py={{ base: 6, md: 10 }} px={{ base: 2, md: 0 }}>
      <Container maxW="720px" px={0}>
        {/* Header */}
        <HStack spacing={4} align="center" mb={8} className="header">
          <IconButton
            icon={<ChevronLeftIcon />}
            variant="ghost"
            aria-label="Back to home"
            onClick={() => navigate('/')}
            className="back-button"
            minW="40px"
            minH="40px"
            borderRadius="12px"
            bg="rgba(255,255,255,0.9)"
            border="0.5px solid rgba(255,255,255,0.2)"
            color="#1a1a1a"
            fontSize="18px"
            boxShadow="0 2px 12px rgba(0,0,0,0.08)"
            _hover={{ bg: 'rgba(255,255,255,0.95)', transform: 'translateY(-1px)', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
          />
          <Heading className="page-title" fontSize={{ base: '28px', md: '32px' }} fontWeight={700} color="white" letterSpacing="-0.03em" textShadow="0 2px 8px rgba(0,0,0,0.1)">
            New Job Application
          </Heading>
        </HStack>

        {/* Glassmorphism Card */}
        <Box
          className="form-container"
          bg="rgba(255,255,255,0.95)"
          borderRadius="20px"
          border="0.5px solid rgba(255,255,255,0.2)"
          boxShadow="0 8px 32px rgba(0,0,0,0.12), 0 1px 3px rgba(0,0,0,0.05)"
          p={{ base: 6, md: 10 }}
          backdropFilter="blur(40px) saturate(180%)"
          animation="slideUp 0.6s cubic-bezier(0.4,0,0.2,1)"
        >
          {/* Section Header */}
          <Box mb={8} className="section-header">
            <Text className="section-title" fontSize="20px" fontWeight={600} color="#1a1a1a" letterSpacing="-0.02em" mb={1}>
              Select Resume
            </Text>
            <Text className="section-subtitle" fontSize="14px" color="#8b949e" fontWeight={400}>
              Choose which resume to use for this application
            </Text>
          </Box>

          {/* Resume Selector */}
          <Box
            className="resume-selector"
            bg="rgba(139,92,246,0.06)"
            border="1px solid rgba(139,92,246,0.15)"
            borderRadius="12px"
            p={5}
            mb={8}
            transition="all 0.2s ease"
          >
            <ResumeManager
              mode="select"
              onResumeSelect={setSelectedResumeId}
              selectedResumeId={selectedResumeId}
            />
          </Box>

          {/* Form */}
          <form onSubmit={e => { e.preventDefault(); handleSaveJobDescription(); }}>
            {/* Job Title */}
            <Box mb={6} className="form-group">
              <FormLabel className="form-label" htmlFor="jobTitle" fontSize="14px" fontWeight={600} color="#1a1a1a" mb={2} letterSpacing="-0.01em">
                Job Title<span className="required" style={{ color: '#ef4444', marginLeft: 2 }}>*</span>
              </FormLabel>
              <Input
                id="jobTitle"
                className="form-input"
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder="Enter job title"
                required
                fontSize="16px"
                borderRadius="12px"
                bg="rgba(248,250,252,0.8)"
                border="1px solid rgba(0,0,0,0.1)"
                py={4}
                px={5}
                color="#1a1a1a"
                _placeholder={{ color: '#9ca3af', fontWeight: 400 }}
                _focus={{ borderColor: '#8B5CF6', bg: 'rgba(255,255,255,0.95)', boxShadow: '0 0 0 3px rgba(139,92,246,0.1)' }}
              />
            </Box>

            {/* Company Name */}
            <Box mb={6} className="form-group">
              <FormLabel className="form-label" htmlFor="companyName" fontSize="14px" fontWeight={600} color="#1a1a1a" mb={2} letterSpacing="-0.01em">
                Company Name<span className="required" style={{ color: '#ef4444', marginLeft: 2 }}>*</span>
              </FormLabel>
              <Input
                id="companyName"
                className="form-input"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="Enter company name"
                required
                fontSize="16px"
                borderRadius="12px"
                bg="rgba(248,250,252,0.8)"
                border="1px solid rgba(0,0,0,0.1)"
                py={4}
                px={5}
                color="#1a1a1a"
                _placeholder={{ color: '#9ca3af', fontWeight: 400 }}
                _focus={{ borderColor: '#8B5CF6', bg: 'rgba(255,255,255,0.95)', boxShadow: '0 0 0 3px rgba(139,92,246,0.1)' }}
              />
            </Box>

            {/* Job URL */}
            <Box mb={6} className="form-group">
              <FormLabel className="form-label" htmlFor="jobUrl" fontSize="14px" fontWeight={600} color="#1a1a1a" mb={2} letterSpacing="-0.01em">
                Job URL (Optional)
              </FormLabel>
              <HStack className="url-group" align="flex-end" spacing={3}>
                <Box className="url-input-container" flex={1}>
                  <Input
                    id="jobUrl"
                    className="form-input"
                    value={jobUrl}
                    onChange={e => setJobUrl(e.target.value)}
                    placeholder="Enter job posting URL"
                    fontSize="16px"
                    borderRadius="12px"
                    bg="rgba(248,250,252,0.8)"
                    border="1px solid rgba(0,0,0,0.1)"
                    py={4}
                    px={5}
                    color="#1a1a1a"
                    _placeholder={{ color: '#9ca3af', fontWeight: 400 }}
                    _focus={{ borderColor: '#8B5CF6', bg: 'rgba(255,255,255,0.95)', boxShadow: '0 0 0 3px rgba(139,92,246,0.1)' }}
                  />
                </Box>
                <Button
                  type="button"
                  className="scrape-button"
                  bg="rgba(139,92,246,0.1)"
                  border="1px solid rgba(139,92,246,0.2)"
                  color="#8B5CF6"
                  px={6}
                  py={4}
                  fontSize="14px"
                  fontWeight={600}
                  borderRadius="12px"
                  _hover={{ bg: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.3)', transform: 'translateY(-1px)' }}
                  _active={{ transform: 'translateY(0)' }}
                  onClick={handleScrapeJob}
                  isLoading={isScraping}
                  loadingText="Scraping..."
                  isDisabled={!jobUrl.trim() || isScraping}
                >
                  Scrape
                </Button>
              </HStack>
              <Text className="url-helper" fontSize="12px" color="#8b949e" mt={2} fontWeight={400}>
                If provided, we'll try to scrape the job description automatically
              </Text>
            </Box>

            {/* Job Description */}
            <Box mb={6} className="form-group">
              <FormLabel className="form-label" htmlFor="jobDescription" fontSize="14px" fontWeight={600} color="#1a1a1a" mb={2} letterSpacing="-0.01em">
                Job Description<span className="required" style={{ color: '#ef4444', marginLeft: 2 }}>*</span>
              </FormLabel>
              <Textarea
                id="jobDescription"
                className="form-textarea"
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                minH="150px"
                fontSize="16px"
                borderRadius="12px"
                bg="rgba(248,250,252,0.8)"
                border="1px solid rgba(0,0,0,0.1)"
                py={5}
                px={5}
                color="#1a1a1a"
                _placeholder={{ color: '#9ca3af', fontWeight: 400 }}
                _focus={{ borderColor: '#8B5CF6', bg: 'rgba(255,255,255,0.95)', boxShadow: '0 0 0 3px rgba(139,92,246,0.1)' }}
                required
              />
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              className="submit-button"
              w="100%"
              bgGradient="linear(135deg, #8B5CF6 0%, #A855F7 100%)"
              color="white"
              borderRadius="14px"
              fontSize="16px"
              fontWeight={600}
              py={5}
              px={6}
              mt={4}
              boxShadow="0 4px 16px rgba(139,92,246,0.25)"
              _hover={{ transform: 'translateY(-2px)', boxShadow: '0 8px 32px rgba(139,92,246,0.35)' }}
              _active={{ transform: 'translateY(0)' }}
              isLoading={isSavingJobDescription}
              loadingText="Creating application..."
              isDisabled={!jobDescription.trim() || !jobTitle.trim() || !companyName.trim() || !selectedResumeId}
            >
              Create Application
            </Button>
          </form>
        </Box>
      </Container>
    </Box>
  );
};

export default JobDescriptionPage; 