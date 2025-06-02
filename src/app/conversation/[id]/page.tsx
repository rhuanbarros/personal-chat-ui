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
    sendingMessage,
    sendMessage
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

    const updatedConversation = await sendMessage(activeConversation._id!, content, configuration);
    
    // Update the active conversation state immediately with the new message
    if (updatedConversation) {
      updateActiveConversation(updatedConversation);
    }
  };

  return (
    <ChatView
      conversation={activeConversation}
      onSendMessage={handleSendMessage}
      onUpdateTitle={updateConversationTitle}
      loading={conversationsLoading || sendingMessage}
      configuration={configuration}
    />
  );
} 