import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Text,
  IconButton,
  Box,
  Divider,
  Avatar,
} from '@chakra-ui/react';
import { TagInput } from './TagInput';
import { getUserProfile, saveUserProfile } from '../../services/userService';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  linkedinUrl: string;
  roleTags: string[];
  companyTags: string[];
}

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOnboarding?: boolean;
}

/**
 * Modal component for editing user profile information
 */
export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ 
  isOpen, 
  onClose, 
  isOnboarding = false 
}) => {
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    linkedinUrl: '',
    roleTags: [],
    companyTags: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen && !isOnboarding) {
      loadProfile();
    }
  }, [isOpen, isOnboarding]);

  const loadProfile = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const profile = await getUserProfile();
      if (profile) {
        setFormData({
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          linkedinUrl: profile.linkedin_url || '',
          roleTags: profile.role_tags || [],
          companyTags: profile.company_tags || []
        });
      }
    } catch (err) {
      toast({
        title: 'Error loading profile',
        description: (err as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await saveUserProfile(formData);
      toast({
        title: 'Profile saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      if (!isOnboarding) {
        onClose();
      }
    } catch (err) {
      toast({
        title: 'Error saving profile',
        description: (err as Error).message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof ProfileFormData, value: string | string[]): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Avatar initials
  const initials = `${formData.firstName?.[0] || ''}${formData.lastName?.[0] || ''}`.toUpperCase();

  // Colors
  const headerBg = 'linear-gradient(90deg, #a18aff 0%, #7f56d9 100%)';
  const sectionTitleColor = '#a18aff';
  const sectionTitleFont = {
    fontSize: '13px',
    fontWeight: 700,
    color: sectionTitleColor,
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    mb: 2,
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered>
      <ModalOverlay />
      <ModalContent
        maxW="740px"
        borderRadius="22px"
        boxShadow="0 8px 32px rgba(127,86,217,0.10)"
        overflow="hidden"
      >
        {/* Header with avatar and title */}
        <Box
          bgGradient={headerBg}
          px={6}
          py={4}
          display="flex"
          alignItems="center"
          position="relative"
        >
          <Avatar
            name={`${formData.firstName} ${formData.lastName}`}
            bg="#a18aff"
            color="white"
            size="lg"
            mr={5}
            fontWeight="bold"
            fontSize="2xl"
            borderRadius="16px"
          />
          <Box>
            <Text fontSize="2xl" fontWeight="bold" color="white" mb={1}>
              {isOnboarding ? 'Welcome to Tailr!' : 'Edit Profile'}
            </Text>
            <Text fontSize="md" color="whiteAlpha.800">
              {isOnboarding
                ? "Let's get to know you better to personalize your experience"
                : 'Update your profile information to represent yourself professionally'}
            </Text>
          </Box>
          {!isOnboarding && (
            <IconButton
              icon={<Text fontSize="2xl">×</Text>}
              variant="ghost"
              onClick={onClose}
              aria-label="Close"
              position="absolute"
              top={4}
              right={4}
              color="white"
              fontSize="2xl"
              _hover={{ bg: 'whiteAlpha.200' }}
            />
          )}
        </Box>

        <form onSubmit={handleSubmit}>
          <ModalBody px={10} py={8} bg="white">
            {/* Personal Information Section */}
            <Text {...sectionTitleFont} mt={0}>
              Personal Information
            </Text>
            <Divider borderColor={sectionTitleColor} opacity={0.2} mb={5} />
            <VStack spacing={6} align="stretch">
              <FormControl isRequired>
                <FormLabel fontWeight={600} fontSize="sm" color="#1a1a1a">
                  First Name <Text as="span" color="#a18aff">*</Text>
                </FormLabel>
                <Input
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="Enter your first name"
                  borderRadius="12px"
                  size="lg"
                  bg="#fafaff"
                  borderColor="#e5e7eb"
                  color="#1a1a1a"
                  fontSize="md"
                  fontWeight={500}
                  _placeholder={{ color: 'gray.400', fontWeight: 400 }}
                  _focus={{ borderColor: sectionTitleColor, boxShadow: '0 0 0 1.5px #a18aff' }}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontWeight={600} fontSize="sm" color="#1a1a1a">
                  Last Name <Text as="span" color="#a18aff">*</Text>
                </FormLabel>
                <Input
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="Enter your last name"
                  borderRadius="12px"
                  size="lg"
                  bg="#fafaff"
                  borderColor="#e5e7eb"
                  color="#1a1a1a"
                  fontSize="md"
                  fontWeight={500}
                  _placeholder={{ color: 'gray.400', fontWeight: 400 }}
                  _focus={{ borderColor: sectionTitleColor, boxShadow: '0 0 0 1.5px #a18aff' }}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontWeight={600} fontSize="sm" color="#1a1a1a">
                  LinkedIn Profile
                </FormLabel>
                <Input
                  value={formData.linkedinUrl}
                  onChange={(e) => handleChange('linkedinUrl', e.target.value)}
                  placeholder="https://linkedin.com/in/your-profile"
                  borderRadius="12px"
                  size="lg"
                  bg="#fafaff"
                  borderColor="#e5e7eb"
                  color="#1a1a1a"
                  fontSize="md"
                  fontWeight={500}
                  _placeholder={{ color: 'gray.400', fontWeight: 400 }}
                  _focus={{ borderColor: sectionTitleColor, boxShadow: '0 0 0 1.5px #a18aff' }}
                />
              </FormControl>
            </VStack>

            {/* Roles of Interest Section */}
            <Text {...sectionTitleFont} mt={10}>
              Roles of Interest
            </Text>
            <Divider borderColor={sectionTitleColor} opacity={0.2} mb={5} />
            <TagInput
              tags={formData.roleTags}
              onChange={(tags) => handleChange('roleTags', tags)}
              placeholder="Add roles (e.g., Software Engineer, Product Manager)"
            />

            {/* Companies of Interest Section */}
            <Text {...sectionTitleFont} mt={10}>
              Companies of Interest
            </Text>
            <Divider borderColor={sectionTitleColor} opacity={0.2} mb={5} />
            <TagInput
              tags={formData.companyTags}
              onChange={(tags) => handleChange('companyTags', tags)}
              placeholder="Add companies (e.g., Google, Microsoft)"
            />
          </ModalBody>

          <ModalFooter
            bg="white"
            px={10}
            py={6}
            borderTop="1px solid #f3f3f6"
            display="flex"
            justifyContent="flex-end"
            gap={4}
          >
            <Button
              variant="ghost"
              onClick={onClose}
              size="lg"
              borderRadius="10px"
              color="#7f56d9"
              fontWeight={600}
              _hover={{ bg: '#f3f3f6' }}
              isDisabled={isOnboarding}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              colorScheme="purple"
              bgGradient="linear(to-r, #a18aff, #7f56d9)"
              color="white"
              isLoading={isLoading}
              loadingText="Saving..."
              size="lg"
              borderRadius="10px"
              px={8}
              fontWeight={700}
              boxShadow="0 2px 8px rgba(127,86,217,0.10)"
            >
              {isOnboarding ? 'Complete Profile' : 'Save Changes'}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}; 