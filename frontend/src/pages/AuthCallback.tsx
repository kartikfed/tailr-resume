import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Box, Spinner, Text } from '@chakra-ui/react';

/**
 * Handles Supabase OAuth/magic link callback. If hash fragment with tokens is present, sets session.
 * If no hash (e.g., email/password login), just navigates to dashboard.
 */
export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash fragment from the URL
        const hash = window.location.hash;
        if (hash) {
          // Parse the hash fragment
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          if (accessToken && refreshToken) {
            // Set the session using the tokens
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            if (error) throw error;
            // Get the current session to verify
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) throw sessionError;
            if (session) {
              navigate('/');
            } else {
              throw new Error('No session established');
            }
          } else {
            throw new Error('Missing tokens in hash fragment');
          }
        } else {
          // No hash fragment: likely email/password login, just go to dashboard
          navigate('/');
          return;
        }
      } catch (error) {
        navigate('/login');
      }
    };
    handleAuthCallback();
  }, [navigate]);

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bgGradient="linear(to-br, #a78bfa, #60a5fa)">
      <Box textAlign="center">
        <Spinner size="xl" color="white" mb={4} />
        <Text color="white" fontSize="lg">Completing sign in...</Text>
      </Box>
    </Box>
  );
}; 