import React from 'react';
import { ProfileEditModal } from '../Profile/ProfileEditModal';

/**
 * Modal component for collecting user profile information during onboarding
 */
export const OnboardingModal = () => {
  return (
    <ProfileEditModal
      isOpen={true}
      onClose={() => {}}
      isOnboarding={true}
    />
  );
}; 