import React, { FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  VStack,
  Text,
  Button,
  Icon,
  Spacer,
  Flex,
  Avatar,
  useToast,
  Skeleton,
} from '@chakra-ui/react';
import { FiHome, FiUser } from 'react-icons/fi';
import { supabase } from '../../services/supabase';
import { ProfileEditModal } from '../Profile';

interface SidebarProps {
  className?: string;
}

/**
 * Sidebar component styled to match the new dashboard design
 * Shows Tailr logo, Dashboard nav, and user email with logout
 * @param {SidebarProps} props - Component props
 * @returns {JSX.Element} Sidebar component
 */
export const Sidebar: FC<SidebarProps> = ({ className }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);

  // Glassmorphic background
  const sidebarBg = 'rgba(255,255,255,0.85)';
  const borderColor = 'rgba(139,92,246,0.12)';
  const logoGradient = 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)';
  const activeBg = 'rgba(139,92,246,0.08)';
  const userSectionBg = 'rgba(248,250,252,0.8)';
  const userSectionBorder = 'rgba(0,0,0,0.06)';
  const logoutBg = 'rgba(239,68,68,0.05)';
  const logoutBorder = 'rgba(239,68,68,0.1)';
  const logoutHoverBg = 'rgba(239,68,68,0.08)';
  const logoutHoverBorder = 'rgba(239,68,68,0.15)';

  useEffect(() => {
    /**
     * Fetches the current user's email from Supabase
     */
    const fetchUserEmail = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        setUserEmail(data?.user?.email || null);
      } catch (err: any) {
        setUserEmail(null);
        toast({
          title: 'Error fetching user',
          description: err.message || 'Could not fetch user email.',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchUserEmail();
  }, [toast]);

  /**
   * Handles navigation to a given path
   * @param path - Route path
   */
  const handleNavigation = (path: string) => {
    navigate(path);
  };

  /**
   * Handles user logout
   */
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: 'Logged out successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/login');
    } catch (error: any) {
      toast({
        title: 'Error logging out',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      className={className}
      w={{ base: 'full', md: '240px' }}
      h="100vh"
      bg={sidebarBg}
      borderRightWidth="1.5px"
      borderRightColor={borderColor}
      boxShadow="2px 0 16px rgba(139,92,246,0.06)"
      position="fixed"
      top={0}
      left={0}
      zIndex={20}
      display="flex"
      flexDirection="column"
      overflow="hidden"
      borderRadius="0 16px 16px 0"
    >
      {/* Logo Section */}
      <Box px={6} pt={8} pb={6} borderBottomWidth="0.5px" borderBottomColor="rgba(0,0,0,0.06)">
        <Flex align="center" gap={3}>
          <Box
            w="32px"
            h="32px"
            bg={logoGradient}
            borderRadius="8px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            boxShadow="0 2px 8px rgba(139,92,246,0.25)"
          >
            <img
              src={"/tailr-logo.png"}
              alt="Tailr Logo"
              style={{ width: '20px', height: '20px', objectFit: 'contain' }}
            />
          </Box>
          <Text fontSize="17px" fontWeight={600} color="#1a1a1a" letterSpacing="-0.02em">
            Tailr
          </Text>
        </Flex>
      </Box>

      {/* Navigation */}
      <Box px={4} pt={4}>
        <Text fontSize="11px" fontWeight={600} color="#8b949e" textTransform="uppercase" letterSpacing="0.5px" mb={3} ml={2}>
          Main
        </Text>
        <Button
          leftIcon={<Icon as={FiHome as any} fontSize="16px" />}
          variant="ghost"
          color="#8B5CF6"
          fontWeight={600}
          fontSize="14px"
          justifyContent="flex-start"
          borderRadius="8px"
          px={3}
          py={2.5}
          w="full"
          bg={activeBg}
          _hover={{ bg: 'rgba(0,0,0,0.03)', color: '#1a1a1a' }}
          _active={{ bg: activeBg }}
          aria-label="Dashboard"
          onClick={() => handleNavigation('/')}
          position="relative"
          boxShadow="none"
        >
          Dashboard
        </Button>
        {/* Edit Profile Button */}
        <Button
          leftIcon={<Icon as={FiUser as any} fontSize="16px" />}
          variant="ghost"
          color="#8B5CF6"
          fontWeight={600}
          fontSize="14px"
          justifyContent="flex-start"
          borderRadius="8px"
          px={3}
          py={2.5}
          w="full"
          mt={2}
          _hover={{ bg: 'rgba(0,0,0,0.03)', color: '#1a1a1a' }}
          _active={{ bg: activeBg }}
          aria-label="Edit Profile"
          onClick={() => setProfileModalOpen(true)}
          position="relative"
          boxShadow="none"
        >
          Edit Profile
        </Button>
      </Box>

      <Spacer />

      {/* User Section */}
      <Box
        mt="auto"
        mb="24px"
        mx="16px"
        p={3}
        bg={userSectionBg}
        borderWidth="0.5px"
        borderColor={userSectionBorder}
        borderRadius="12px"
        boxShadow="none"
        backdropFilter="blur(20px)"
        display="flex"
        flexDirection="column"
        alignItems="flex-start"
        gap={3}
      >
        {loading ? (
          <Skeleton height="14px" width="100px" mb={1} />
        ) : (
          <Text fontSize="12px" color="#8b949e" fontWeight={500} noOfLines={1} mb={1}>
            {userEmail || 'No email'}
          </Text>
        )}
        <Button
          w="full"
          py={2}
          fontSize="12px"
          fontWeight={500}
          color="#ef4444"
          bg={logoutBg}
          borderWidth="0.5px"
          borderColor={logoutBorder}
          borderRadius="6px"
          _hover={{ bg: logoutHoverBg, borderColor: logoutHoverBorder }}
          onClick={handleLogout}
          aria-label="Sign Out"
        >
          Sign Out
        </Button>
      </Box>

      {/* Profile Edit Modal */}
      <ProfileEditModal isOpen={isProfileModalOpen} onClose={() => setProfileModalOpen(false)} isOnboarding={false} />
    </Box>
  );
};

export default Sidebar; 