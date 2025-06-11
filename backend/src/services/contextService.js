/**
 * Context Service
 * 
 * This service manages conversation context and content storage.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// In-memory cache for contexts
const contextCache = new Map();

/**
 * Gets the context for a conversation
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<Object|null>} - The conversation context or null if not found
 */
export async function getContext(conversationId) {
  try {
    console.log('🔍 Context Service: Getting context for conversation:', conversationId);

    // Check cache first
    if (contextCache.has(conversationId)) {
      console.log('📦 Context Service: Found context in cache');
      return contextCache.get(conversationId);
    }

    // Fetch from database
    const { data, error } = await supabase
      .from('conversation_contexts')
      .select('*')
      .eq('conversation_id', conversationId)
      .single();

    if (error) {
      console.error('❌ Context Service: Error fetching context:', error);
      throw error;
    }

    if (!data) {
      console.log('⚠️ Context Service: No context found for conversation:', conversationId);
      return null;
    }

    // Parse content
    const context = {
      ...data,
      content: JSON.parse(data.content),
      systemPrompt: data.system_prompt
    };

    // Update cache
    contextCache.set(conversationId, context);
    console.log('✅ Context Service: Successfully retrieved context');
    
    return context;
  } catch (error) {
    console.error('❌ Context Service: Error in getContext:', error);
    throw new Error(`Failed to get context: ${error.message}`);
  }
}

/**
 * Updates the context for a conversation
 * @param {string} conversationId - The conversation ID
 * @param {Object} context - The context to update
 * @returns {Promise<Object>} - The updated context
 */
export async function updateContext(conversationId, context) {
  try {
    console.log('📝 Context Service: Updating context for conversation:', conversationId);

    // Prepare data for database
    const data = {
      conversation_id: conversationId,
      content: JSON.stringify(context.content),
      system_prompt: context.systemPrompt,
      updated_at: new Date().toISOString()
    };

    // Update database
    const { data: updatedData, error } = await supabase
      .from('conversation_contexts')
      .upsert(data)
      .select()
      .single();

    if (error) {
      console.error('❌ Context Service: Error updating context:', error);
      throw error;
    }

    // Parse content
    const updatedContext = {
      ...updatedData,
      content: JSON.parse(updatedData.content),
      systemPrompt: updatedData.system_prompt
    };

    // Update cache
    contextCache.set(conversationId, updatedContext);
    console.log('✅ Context Service: Successfully updated context');
    
    return updatedContext;
  } catch (error) {
    console.error('❌ Context Service: Error in updateContext:', error);
    throw new Error(`Failed to update context: ${error.message}`);
  }
}

/**
 * Deletes the context for a conversation
 * @param {string} conversationId - The conversation ID
 * @returns {Promise<void>}
 */
export async function deleteContext(conversationId) {
  try {
    console.log('🗑️ Context Service: Deleting context for conversation:', conversationId);

    // Delete from database
    const { error } = await supabase
      .from('conversation_contexts')
      .delete()
      .eq('conversation_id', conversationId);

    if (error) {
      console.error('❌ Context Service: Error deleting context:', error);
      throw error;
    }

    // Remove from cache
    contextCache.delete(conversationId);
    console.log('✅ Context Service: Successfully deleted context');
  } catch (error) {
    console.error('❌ Context Service: Error in deleteContext:', error);
    throw new Error(`Failed to delete context: ${error.message}`);
  }
}

// Export the service object
export const contextService = {
  getContext,
  updateContext,
  deleteContext
}; 