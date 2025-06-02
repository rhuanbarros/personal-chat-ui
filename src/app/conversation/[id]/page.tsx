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
    hasSystemPrompt 
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

    console.log('🔍 ConversationPage: handleSendMessage called');
    console.log('🔍 ConversationPage: selectedPrompt:', selectedPrompt);
    console.log('🔍 ConversationPage: activeConversation messages before:', activeConversation.messages.length);

    // Prepare options with system prompt if selected
    const messageOptions: any = {};
    if (configuration) {
      messageOptions.modelConfig = configuration;
    }
    
    if (selectedPrompt?.latestVersion?.text && !hasSystemPrompt(activeConversation)) {
      console.log('🔍 ConversationPage: Adding system prompt to message options');
      messageOptions.systemPrompt = selectedPrompt.latestVersion.text;
      
      // Apply system prompt to local conversation for immediate UI update
      const conversationWithPrompt = applySystemPromptToConversation(activeConversation);
      updateActiveConversation(conversationWithPrompt);
    }

    // Use optimistic updates for better UX
    const updatedConversation = await sendMessageOptimistic(
      activeConversation, 
      content, 
      updateActiveConversation,
      messageOptions.systemPrompt ? messageOptions : { modelConfig: configuration }
    );
    
    // Update the active conversation state with the final result
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