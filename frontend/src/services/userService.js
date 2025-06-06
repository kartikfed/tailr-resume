import { supabase } from './supabase';

/**
 * Fetches the user's profile from the database
 * @returns {Promise<Object>} The user's profile data
 */
export const getUserProfile = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Creates or updates a user's profile
 * @param {Object} profileData - The profile data to save
 * @returns {Promise<Object>} The saved profile data
 */
export const saveUserProfile = async (profileData) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    // First check if a profile already exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    // If profile exists, update it; otherwise create new
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        linkedin_url: profileData.linkedinUrl,
        role_tags: profileData.roleTags,
        company_tags: profileData.companyTags,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id', // Explicitly specify the conflict column
        ignoreDuplicates: false // We want to update if exists
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('A profile already exists for this user');
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
};

/**
 * Checks if a user has completed their profile
 * @returns {Promise<boolean>} Whether the user has completed their profile
 */
export const hasCompletedProfile = async () => {
  try {
    const profile = await getUserProfile();
    return !!profile;
  } catch (error) {
    if (error.code === 'PGRST116') {
      // No profile found
      return false;
    }
    throw error;
  }
}; 