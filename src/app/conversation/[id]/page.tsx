'use client';

import { useParams } from 'next/navigation';
import React, { useEffect } from 'react';
import ChatView from '@/components/ChatView';
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { useModelConfiguration } from '@/hooks/useModelConfiguration';
import { useSystemPrompt } from '@/hooks/useSystemPrompt';

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.id as string;
  
  const {
    conversations,
    activeConversation,
    loading: conversationsLoading,
    selectConversation,
    updateConversationTitle,
    updateActiveConversation
  } = useConversations();

  const {
    aiThinking,
    sendMessageOptimistic
  } = useMessages();

  const { configuration } = useModelConfiguration();
  const { 
    selectedPrompt, 
    selectPrompt, 
    applySystemPromptToConversation, 
    extractSystemPromptFromConversation,
    hasSystemPrompt,
    removeSystemPromptFromConversation
  } = useSystemPrompt();

  useEffect(() => {
    if (conversationId) {
      selectConversation(conversationId);
    }
  }, [conversationId, selectConversation]);

  // When activeConversation changes, check if it has a system prompt and update selection
  useEffect(() => {
    if (activeConversation && activeConversation.messages.length > 0) {
      if (hasSystemPrompt(activeConversation)) {
        // Extract system prompt from conversation and update selection
        const extractedPrompt = extractSystemPromptFromConversation(activeConversation);
        if (extractedPrompt && (!selectedPrompt || selectedPrompt._id === 'current-system')) {
          // Only auto-select if no prompt is selected or if showing current system prompt
          selectPrompt(extractedPrompt);
        }
      }
    }
  }, [activeConversation, hasSystemPrompt, extractSystemPromptFromConversation, selectedPrompt, selectPrompt]);

  const handleSendMessage = async (content: string) => {
    if (!activeConversation) {
      return;
    }

    // Prepare options object
    const messageOptions: any = {};
    if (configuration) {
      messageOptions.modelConfig = configuration;
    }

    let workingConversation = activeConversation;

    // Determine system prompt handling based on selected prompt
    if (selectedPrompt?.latestVersion?.text) {
      // Add or replace system prompt
      workingConversation = applySystemPromptToConversation(activeConversation);
      messageOptions.systemPrompt = selectedPrompt.latestVersion.text;
    } else if (!selectedPrompt && hasSystemPrompt(activeConversation)) {
      // Remove existing system prompt
      workingConversation = removeSystemPromptFromConversation(activeConversation);
      messageOptions.systemPrompt = '';
    }

    // Update local state optimistically before sending
    if (workingConversation !== activeConversation) {
      updateActiveConversation(workingConversation);
    }

    // Ensure we pass systemPrompt even if it's an empty string (for removal)
    const optionsToSend = {
      modelConfig: configuration,
      ...(messageOptions.hasOwnProperty('systemPrompt') ? { systemPrompt: messageOptions.systemPrompt } : {})
    };

    // Use optimistic update for the message send
    const updatedConversation = await sendMessageOptimistic(
      workingConversation,
      content,
      updateActiveConversation,
      optionsToSend
    );

    if (updatedConversation) {
      updateActiveConversation(updatedConversation);
    }
  };

  return (
    <ChatView
      conversation={activeConversation}
      onSendMessage={handleSendMessage}
      onUpdateTitle={updateConversationTitle}
      loading={conversationsLoading}
      aiThinking={aiThinking}
      configuration={configuration}
    />
  );
} 