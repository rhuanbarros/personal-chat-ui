'use client';

import React, { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Settings } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import TabbedConfigurationPanel from '@/components/TabbedConfigurationPanel';
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { useModelConfiguration } from '@/hooks/useModelConfiguration';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showConfigPanel, setShowConfigPanel] = useState(true);
  
  const {
    conversations,
    activeConversation,
    loading: conversationsLoading,
    loadingMore,
    hasMore,
    createNewConversation,
    selectConversation,
    loadMoreConversations
  } = useConversations();

  const { configuration, updateConfiguration } = useModelConfiguration();

  const handleNewChat = useCallback(async () => {
    const newConversation = await createNewConversation();
    if (newConversation?._id) {
      router.push(`/conversation/${newConversation._id}`);
    }
  }, [createNewConversation, router]);

  const handleSelectConversation = useCallback(async (conversationId: string) => {
    router.push(`/conversation/${conversationId}`);
  }, [router]);

  const handleViewChange = useCallback((view: string) => {
    console.log('🔄 ClientLayout: handleViewChange called with view:', view);
    switch (view) {
      case 'saved-prompts':
        router.push('/saved-prompts');
        break;
      case 'configuration':
        router.push('/configuration');
        break;
      case 'chat':
        router.push('/');
        break;
    }
  }, [router]);

  const handleConfigPanelToggle = useCallback(() => {
    console.log('⚙️ ClientLayout: Toggling config panel');
    setShowConfigPanel(prev => {
      console.log('⚙️ Previous state:', prev, '-> New state:', !prev);
      return !prev;
    });
  }, []);

  // Determine current view based on pathname
  const getCurrentView = () => {
    if (pathname === '/configuration') return 'configuration';
    if (pathname === '/saved-prompts') return 'saved-prompts';
    if (pathname.startsWith('/conversation/')) return 'chat';
    return 'home';
  };

  // Show configuration panel only in conversation views (not home page)
  const isInConversation = pathname.startsWith('/conversation/');
  const shouldShowConfigPanel = isInConversation && showConfigPanel;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar
        conversations={conversations}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onViewChange={handleViewChange}
        currentView={getCurrentView()}
        activeConversationId={pathname.startsWith('/conversation/') ? pathname.split('/')[2] : undefined}
        loading={conversationsLoading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onLoadMore={loadMoreConversations}
      />
      <main className="flex-1 flex flex-col relative min-h-0 overflow-hidden">
        {/* Configuration Toggle Button - only show in conversations */}
        {isInConversation && (
          <button
            onClick={handleConfigPanelToggle}
            className="absolute top-4 right-4 z-10 p-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
            title={showConfigPanel ? "Hide Configuration" : "Show Configuration"}
          >
            <Settings size={20} className="text-gray-600" />
          </button>
        )}
        <div className="flex-1 min-h-0 overflow-hidden">
          {children}
        </div>
      </main>
      {shouldShowConfigPanel && (
        <div className="flex-shrink-0">
          <TabbedConfigurationPanel
            configuration={configuration}
            onConfigurationChange={updateConfiguration}
          />
        </div>
      )}
    </div>
  );
} 