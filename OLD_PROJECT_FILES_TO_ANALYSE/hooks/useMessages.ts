/**
 * useMessages Hook
 * Custom hook for managing message operations and AI responses
 */

import { useState, useCallback } from 'react';
import { Conversation, ModelConfiguration } from '@/types';
import { conversationService } from '@/services/conversationService';
import { toast } from 'react-toastify';

interface UseMessagesReturn {
  sendingMessage: boolean;
  sendMessage: (conversationId: string, content: string, modelConfig?: ModelConfiguration) => Promise<Conversation | null>;
  error: string | null;
  clearError: () => void;
}

export const useMessages = (): UseMessagesReturn => {
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Send a message to a conversation
   * This will automatically trigger an AI response
   */
  const sendMessage = useCallback(async (
    conversationId: string, 
    content: string, 
    modelConfig?: ModelConfiguration
  ): Promise<Conversation | null> => {
    if (!conversationId || !content.trim()) {
      toast.error('Conversation ID and message content are required');
      return null;
    }

    try {
      setSendingMessage(true);
      setError(null);
      
      // Send the message through the conversation service
      // The API will handle adding both user message and AI response
      const updatedConversation = await conversationService.sendMessage(
        conversationId, 
        content, 
        'user',
        modelConfig ? { modelConfig } : undefined
      );
      
      return updatedConversation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setSendingMessage(false);
    }
  }, []);

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    sendingMessage,
    sendMessage,
    error,
    clearError
  };
}; 