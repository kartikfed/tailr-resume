import { useState, useEffect } from 'react';
import { hasCompletedProfile, saveUserProfile } from '../services/userService';

/**
 * Custom hook for managing user onboarding state and operations
 * @returns {Object} Onboarding state and functions
 */
export const useOnboarding = () => {
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkFirstTimeUser();
  }, []);

  const checkFirstTimeUser = async () => {
    try {
      setIsLoading(true);
      const hasProfile = await hasCompletedProfile();
      setIsFirstTime(!hasProfile);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async (formData) => {
    try {
      setIsLoading(true);
      await saveUserProfile(formData);
      setIsFirstTime(false);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isFirstTime,
    isLoading,
    error,
    saveProfile
  };
}; 