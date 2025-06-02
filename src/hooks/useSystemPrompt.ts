import { useState, useCallback, useEffect } from 'react';
import { Conversation, Message } from '@/types';
import { SavedPromptSummary } from '@/services/savedPromptService';

interface UseSystemPromptReturn {
  selectedPrompt: SavedPromptSummary | null;
  selectPrompt: (prompt: SavedPromptSummary | null) => void;
  applySystemPromptToConversation: (conversation: Conversation) => Conversation;
  extractSystemPromptFromConversation: (conversation: Conversation) => SavedPromptSummary | null;
  hasSystemPrompt: (conversation: Conversation) => boolean;
}

export const useSystemPrompt = (): UseSystemPromptReturn => {
  const [selectedPrompt, setSelectedPrompt] = useState<SavedPromptSummary | null>(null);

  // Load selected prompt from localStorage on mount
  useEffect(() => {
    const savedPromptId = localStorage.getItem('selectedSystemPromptId');
    if (savedPromptId) {
      // We'll need to fetch the prompt details when the component mounts
      // For now, we just store the ID
      const savedPromptData = localStorage.getItem('selectedSystemPrompt');
      if (savedPromptData) {
        try {
          const prompt = JSON.parse(savedPromptData);
          setSelectedPrompt(prompt);
        } catch (error) {
          console.error('Failed to parse saved system prompt:', error);
          localStorage.removeItem('selectedSystemPrompt');
          localStorage.removeItem('selectedSystemPromptId');
        }
      }
    }
  }, []);

  const selectPrompt = useCallback((prompt: SavedPromptSummary | null) => {
    setSelectedPrompt(prompt);
    
    // Save to localStorage
    if (prompt) {
      localStorage.setItem('selectedSystemPromptId', prompt._id);
      localStorage.setItem('selectedSystemPrompt', JSON.stringify(prompt));
    } else {
      localStorage.removeItem('selectedSystemPromptId');
      localStorage.removeItem('selectedSystemPrompt');
    }
  }, []);

  const hasSystemPrompt = useCallback((conversation: Conversation): boolean => {
    return conversation.messages.length > 0 && 
           conversation.messages[0].role === 'system';
  }, []);

  const applySystemPromptToConversation = useCallback((conversation: Conversation): Conversation => {
    if (!selectedPrompt?.latestVersion?.text) {
      return conversation;
    }

    const systemMessage: Message = {
      sender: 'ai', // Using 'ai' for system messages to maintain compatibility
      content: selectedPrompt.latestVersion.text,
      timestamp: new Date(),
      role: 'system'
    };

    // If there's already a system prompt at position 0, replace it
    const messages = [...conversation.messages];
    if (hasSystemPrompt(conversation)) {
      messages[0] = systemMessage;
    } else {
      // Insert at the beginning
      messages.unshift(systemMessage);
    }

    return {
      ...conversation,
      messages
    };
  }, [selectedPrompt, hasSystemPrompt]);

  const extractSystemPromptFromConversation = useCallback((conversation: Conversation): SavedPromptSummary | null => {
    if (!hasSystemPrompt(conversation)) {
      return null;
    }

    const systemMessage = conversation.messages[0];
    // Return a simplified prompt summary for display
    return {
      _id: 'current-system',
      name: 'Current System Prompt',
      latestVersion: {
        _id: 'current',
        text: systemMessage.content,
        dateCreated: systemMessage.timestamp
      },
      versionsCount: 1,
      createdAt: systemMessage.timestamp,
      updatedAt: systemMessage.timestamp
    };
  }, [hasSystemPrompt]);

  return {
    selectedPrompt,
    selectPrompt,
    applySystemPromptToConversation,
    extractSystemPromptFromConversation,
    hasSystemPrompt
  };
}; 