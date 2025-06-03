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
    editingMessage,
    sendMessageOptimistic,
    editMessage
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

  const autoSyncRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (!activeConversation) return;

    // Run sync only once per conversation load
    if (autoSyncRef.current === activeConversation._id) return;

    autoSyncRef.current = activeConversation._id as string;

    if (hasSystemPrompt(activeConversation)) {
      if (!selectedPrompt) {
        const extracted = extractSystemPromptFromConversation(activeConversation);
        if (extracted) {
          selectPrompt(extracted);
        }
      }
    } else {
      if (selectedPrompt && selectedPrompt._id === 'current-system') {
        selectPrompt(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation]);

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

  const handleEditMessage = async (messageIndex: number, newContent: string) => {
    if (!activeConversation) {
      return;
    }

    // Prepare options object similar to handleSendMessage
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

    // Update local state optimistically before editing
    if (workingConversation !== activeConversation) {
      updateActiveConversation(workingConversation);
    }

    // Ensure we pass systemPrompt even if it's an empty string (for removal)
    const optionsToSend = {
      modelConfig: configuration,
      ...(messageOptions.hasOwnProperty('systemPrompt') ? { systemPrompt: messageOptions.systemPrompt } : {})
    };

    // Edit the message
    const updatedConversation = await editMessage(
      workingConversation._id!,
      messageIndex,
      newContent,
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
      onEditMessage={handleEditMessage}
      onUpdateTitle={updateConversationTitle}
      loading={conversationsLoading}
      aiThinking={aiThinking}
      editingMessage={editingMessage}
      configuration={configuration}
    />
  );
} 