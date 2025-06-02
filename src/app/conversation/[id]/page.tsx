'use client';

import { useParams } from 'next/navigation';
import React, { useEffect } from 'react';
import ChatView from '@/components/ChatView';
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { useModelConfiguration } from '@/hooks/useModelConfiguration';

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

  useEffect(() => {
    if (conversationId) {
      selectConversation(conversationId);
    }
  }, [conversationId, selectConversation]);

  const handleSendMessage = async (content: string) => {
    if (!activeConversation) {
      return;
    }

    // Use optimistic updates for better UX
    const updatedConversation = await sendMessageOptimistic(
      activeConversation, 
      content, 
      updateActiveConversation,
      configuration
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