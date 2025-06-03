/**
 * useMessages Hook
 * Custom hook for managing message operations and AI responses
 */

import { useState, useCallback } from 'react';
import { Conversation, Message, ModelConfiguration } from '@/types';
import { conversationService, SendMessageOptions } from '@/services/conversationService';
import { toast } from 'react-toastify';

interface UseMessagesReturn {
  sendingMessage: boolean;
  aiThinking: boolean;
  editingMessage: boolean;
  sendMessage: (conversationId: string, content: string, options?: SendMessageOptions) => Promise<Conversation | null>;
  sendMessageOptimistic: (
    conversation: Conversation, 
    content: string, 
    onOptimisticUpdate: (updatedConversation: Conversation) => void,
    options?: SendMessageOptions
  ) => Promise<Conversation | null>;
  editMessage: (
    conversationId: string,
    messageIndex: number,
    newContent: string,
    options?: SendMessageOptions
  ) => Promise<Conversation | null>;
  error: string | null;
  clearError: () => void;
}

export const useMessages = (): UseMessagesReturn => {
  const [sendingMessage, setSendingMessage] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [editingMessage, setEditingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Send a message to a conversation (original method for compatibility)
   * This will automatically trigger an AI response
   */
  const sendMessage = useCallback(async (
    conversationId: string, 
    content: string, 
    options?: SendMessageOptions
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
        options
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
   * Send a message with optimistic updates
   * This immediately shows the user message and a loading state for AI response
   */
  const sendMessageOptimistic = useCallback(async (
    conversation: Conversation,
    content: string,
    onOptimisticUpdate: (updatedConversation: Conversation) => void,
    options?: SendMessageOptions
  ): Promise<Conversation | null> => {
    if (!conversation._id || !content.trim()) {
      toast.error('Conversation and message content are required');
      return null;
    }

    console.log('🔍 useMessages: sendMessageOptimistic called');
    console.log('🔍 useMessages: conversation messages before sending:', conversation.messages.length);
    console.log('🔍 useMessages: system messages in conversation:', conversation.messages.filter(m => m.role === 'system').length);

    try {
      setError(null);
      
      // 1. Immediately add user message optimistically
      const userMessage: Message = {
        sender: 'user',
        content: content.trim(),
        timestamp: new Date(),
        role: 'user'
      };

      // 2. Show AI thinking state
      setAiThinking(true);
      
      // Add thinking indicator message
      const thinkingMessage: Message = {
        sender: 'ai',
        content: '...',
        timestamp: new Date(),
        role: 'assistant'
      };

      const optimisticConversation: Conversation = {
        ...conversation,
        messages: [...conversation.messages, userMessage, thinkingMessage],
        updatedAt: new Date()
      };

      // Update UI immediately with user message
      onOptimisticUpdate(optimisticConversation);

      // 3. Send to server and get AI response
      const updatedConversation = await conversationService.sendMessage(
        conversation._id, 
        content, 
        'user',
        options
      );
      
      console.log('🔍 useMessages: Received response from server');
      return updatedConversation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // On error, add error message to conversation
      const errorMessage_ai: Message = {
        sender: 'ai',
        content: `❌ **Error**: ${errorMessage}`,
        timestamp: new Date(),
        role: 'assistant'
      };

      const errorConversation: Conversation = {
        ...conversation,
        messages: [...conversation.messages, 
          {
            sender: 'user',
            content: content.trim(),
            timestamp: new Date(),
            role: 'user'
          },
          errorMessage_ai
        ],
        updatedAt: new Date()
      };

      onOptimisticUpdate(errorConversation);
      return null;
    } finally {
      setAiThinking(false);
    }
  }, []);

  /**
   * Edit a message in a conversation
   * This will replace the message and remove all subsequent messages, then generate a new AI response
   */
  const editMessage = useCallback(async (
    conversationId: string,
    messageIndex: number,
    newContent: string,
    options?: SendMessageOptions
  ): Promise<Conversation | null> => {
    if (!conversationId || !newContent.trim()) {
      toast.error('Conversation ID and message content are required');
      return null;
    }

    try {
      setEditingMessage(true);
      setError(null);
      
      // Edit the message through the conversation service
      // The API will handle updating the message, removing subsequent messages, and generating AI response
      const updatedConversation = await conversationService.editMessage(
        conversationId,
        messageIndex,
        newContent.trim(),
        options
      );
      
      toast.success('Message updated successfully');
      return updatedConversation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to edit message';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setEditingMessage(false);
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
    aiThinking,
    editingMessage,
    sendMessage,
    sendMessageOptimistic,
    editMessage,
    error,
    clearError
  };
}; 