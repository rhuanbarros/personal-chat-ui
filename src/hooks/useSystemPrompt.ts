import { useCallback } from 'react';
import { Conversation, Message } from '@/types';
import { SavedPromptSummary } from '@/services/savedPromptService';
import { useSystemPromptContext } from '@/contexts/SystemPromptContext';

interface UseSystemPromptReturn {
  selectedPrompt: SavedPromptSummary | null;
  selectPrompt: (prompt: SavedPromptSummary | null) => void;
  applySystemPromptToConversation: (conversation: Conversation) => Conversation;
  removeSystemPromptFromConversation: (conversation: Conversation) => Conversation;
  extractSystemPromptFromConversation: (conversation: Conversation) => SavedPromptSummary | null;
  hasSystemPrompt: (conversation: Conversation) => boolean;
}

export const useSystemPrompt = (): UseSystemPromptReturn => {
  const { selectedPrompt, selectPrompt } = useSystemPromptContext();

  const hasSystemPrompt = useCallback((conversation: Conversation): boolean => {
    return conversation.messages.length > 0 && 
           conversation.messages[0].role === 'system';
  }, []);

  const applySystemPromptToConversation = useCallback((conversation: Conversation): Conversation => {
    console.log('🔍 useSystemPrompt: applySystemPromptToConversation called');
    console.log('🔍 useSystemPrompt: selectedPrompt:', selectedPrompt);
    console.log('🔍 useSystemPrompt: conversation messages before:', conversation.messages.length);
    
    if (!selectedPrompt?.latestVersion?.text) {
      console.log('🔍 useSystemPrompt: No selected prompt or text, returning original conversation');
      return conversation;
    }

    const systemMessage: Message = {
      sender: 'ai', // Using 'ai' for system messages to maintain compatibility
      content: selectedPrompt.latestVersion.text,
      timestamp: new Date(),
      role: 'system'
    };
    
    console.log('🔍 useSystemPrompt: Created system message:', systemMessage);

    // If there's already a system prompt at position 0, replace it
    const messages = [...conversation.messages];
    if (hasSystemPrompt(conversation)) {
      console.log('🔍 useSystemPrompt: Replacing existing system prompt');
      messages[0] = systemMessage;
    } else {
      console.log('🔍 useSystemPrompt: Adding new system prompt at position 0');
      // Insert at the beginning
      messages.unshift(systemMessage);
    }

    const updatedConversation = {
      ...conversation,
      messages
    };
    
    console.log('🔍 useSystemPrompt: Updated conversation messages:', updatedConversation.messages.length);
    console.log('🔍 useSystemPrompt: System messages in result:', updatedConversation.messages.filter(m => m.role === 'system').length);
    
    return updatedConversation;
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

  const removeSystemPromptFromConversation = useCallback((conversation: Conversation): Conversation => {
    if (!hasSystemPrompt(conversation)) {
      return conversation;
    }

    const messages = conversation.messages.slice(1); // remove first message (system)

    return {
      ...conversation,
      messages
    };
  }, [hasSystemPrompt]);

  return {
    selectedPrompt,
    selectPrompt,
    applySystemPromptToConversation,
    removeSystemPromptFromConversation,
    extractSystemPromptFromConversation,
    hasSystemPrompt
  };
}; 