import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { MessageSquare, Plus, BookOpen, Settings, Loader2 } from 'lucide-react';
import { Conversation } from '@/types';
import { groupConversationsByTime, formatConversationDate } from '@/lib/dateUtils';

interface SidebarProps {
  conversations: Conversation[];
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onViewChange: (view: string) => void;
  currentView: string;
  activeConversationId?: string;
  loading: boolean;
  loadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  onNewChat,
  onSelectConversation,
  onViewChange,
  currentView,
  activeConversationId,
  loading,
  loadingMore = false,
  hasMore = false,
  onLoadMore
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const truncateTitle = (title: string, maxLength: number = 30) => {
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  };

  // Group conversations by time periods
  const conversationGroups = useMemo(() => {
    return groupConversationsByTime(conversations);
  }, [conversations]);

  // Handle scroll events for infinite loading
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || !onLoadMore || !hasMore || loadingMore) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const scrolledPercentage = (scrollTop + clientHeight) / scrollHeight;

    // Load more when scrolled to 80% of the content
    if (scrolledPercentage > 0.8) {
      onLoadMore();
    }
  }, [onLoadMore, hasMore, loadingMore]);

  // Add scroll event listener
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll]);

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800 mb-4">AI Chat Interface</h1>
        
        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          New Chat
        </button>
      </div>

      {/* Navigation Buttons */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 space-y-2">
        <button
          onClick={() => {
            console.log('🖱️ Sidebar: Saved Prompts button clicked');
            onViewChange('saved-prompts');
          }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            currentView === 'saved-prompts'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <BookOpen size={20} />
          Saved Prompts
        </button>
        
        <button
          onClick={() => {
            console.log('🖱️ Sidebar: Configuration button clicked');
            onViewChange('configuration');
          }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            currentView === 'configuration'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Settings size={20} />
          Configuration
        </button>
      </div>

      {/* Conversations Section */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Section Header */}
        <div className="flex-shrink-0 p-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Conversations
          </h2>
        </div>
        
        {/* Scrollable Conversations List */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto scroll-smooth"
        >
          {conversations.length === 0 && !loading ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <MessageSquare size={48} className="mx-auto mb-3 text-gray-300" />
              <p>No conversations yet</p>
              <p className="text-sm">Start a new chat to begin</p>
            </div>
          ) : (
            <div className="px-2 pb-4">
              {conversationGroups.map((group, groupIndex) => (
                <div key={group.label} className="mb-6">
                  {/* Group Label */}
                  <div className="px-2 py-2 mb-2">
                    <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                      {group.label}
                    </h3>
                  </div>
                  
                  {/* Conversations in Group */}
                  <div className="space-y-1">
                    {group.conversations.map((conversation) => (
                      <button
                        key={conversation._id}
                        onClick={() => onSelectConversation(conversation._id!)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          activeConversationId === conversation._id
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-medium truncate ${
                              activeConversationId === conversation._id
                                ? 'text-blue-700'
                                : 'text-gray-800'
                            }`}>
                              {truncateTitle(conversation.title)}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatConversationDate(conversation.updatedAt.toString())}
                            </p>
                          </div>
                          <MessageSquare 
                            size={16} 
                            className={`mt-1 flex-shrink-0 ${
                              activeConversationId === conversation._id
                                ? 'text-blue-500'
                                : 'text-gray-400'
                            }`} 
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  {/* Separator line (except for last group) */}
                  {groupIndex < conversationGroups.length - 1 && (
                    <div className="mt-4 mx-2 border-b border-gray-100"></div>
                  )}
                </div>
              ))}
              
              {/* Loading More Indicator */}
              {loadingMore && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={20} className="animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Loading more conversations...</span>
                </div>
              )}
              
              {/* No More Conversations Indicator */}
              {!hasMore && conversations.length > 0 && !loading && (
                <div className="text-center py-4">
                  <p className="text-xs text-gray-400">All conversations loaded</p>
                </div>
              )}
            </div>
          )}
          
          {/* Initial Loading Indicator */}
          {loading && conversations.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Loading conversations...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 