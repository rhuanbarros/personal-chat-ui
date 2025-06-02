/**
 * useConversations Hook
 * Custom hook for managing conversation state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { Conversation } from '@/types';
import { conversationService, PaginationMetadata } from '@/services/conversationService';
import { toast } from 'react-toastify';

interface UseConversationsReturn {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  fetchConversations: () => Promise<void>;
  loadMoreConversations: () => Promise<void>;
  createNewConversation: (title?: string) => Promise<Conversation | null>;
  selectConversation: (conversationId: string) => Promise<void>;
  updateConversationTitle: (conversationId: string, newTitle: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  refreshActiveConversation: () => Promise<void>;
  updateActiveConversation: (updatedConversation: Conversation) => void;
  clearError: () => void;
}

export const useConversations = (): UseConversationsReturn => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);

  const hasMore = pagination?.hasMore ?? false;

  /**
   * Fetch initial conversations (first page)
   */
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await conversationService.fetchConversationsPaginated(1, 20);
      
      setConversations(result.conversations);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch conversations';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load more conversations (next page)
   */
  const loadMoreConversations = useCallback(async () => {
    if (!pagination?.hasMore || loadingMore) return;

    try {
      setLoadingMore(true);
      setError(null);
      
      const nextPage = (pagination?.currentPage || 0) + 1;
      const result = await conversationService.fetchConversationsPaginated(nextPage, 20);
      
      // Append new conversations to existing ones
      setConversations(prev => [...prev, ...result.conversations]);
      setPagination(result.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more conversations';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoadingMore(false);
    }
  }, [pagination, loadingMore]);

  /**
   * Create a new conversation
   */
  const createNewConversation = useCallback(async (title?: string): Promise<Conversation | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const newConversation = await conversationService.createConversation(title);
      
      setConversations(prev => [newConversation, ...prev]);
      setActiveConversation(newConversation);
      
      toast.success('New conversation created');
      return newConversation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Select and load a specific conversation
   */
  const selectConversation = useCallback(async (conversationId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const conversation = await conversationService.fetchConversation(conversationId);
      setActiveConversation(conversation);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversation';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update conversation title
   */
  const updateConversationTitle = useCallback(async (conversationId: string, newTitle: string) => {
    try {
      setError(null);
      
      const updatedConversation = await conversationService.updateConversationTitle(conversationId, newTitle);
      
      // Update conversations list
      setConversations(prev => 
        prev.map(conv => 
          conv._id === conversationId 
            ? { ...conv, title: newTitle }
            : conv
        )
      );
      
      // Update active conversation if it's the one being updated
      if (activeConversation?._id === conversationId) {
        setActiveConversation(prev => prev ? { ...prev, title: newTitle } : null);
      }
      
      toast.success('Conversation title updated');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update conversation title';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [activeConversation]);

  /**
   * Delete a conversation
   */
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      setError(null);
      
      await conversationService.deleteConversation(conversationId);
      
      // Remove from conversations list
      setConversations(prev => prev.filter(conv => conv._id !== conversationId));
      
      // Clear active conversation if it was deleted
      if (activeConversation?._id === conversationId) {
        setActiveConversation(null);
      }
      
      toast.success('Conversation deleted');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete conversation';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [activeConversation]);

  /**
   * Refresh the currently active conversation
   */
  const refreshActiveConversation = useCallback(async () => {
    if (!activeConversation?._id) return;
    
    try {
      setError(null);
      const updatedConversation = await conversationService.fetchConversation(activeConversation._id);
      setActiveConversation(updatedConversation);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh conversation';
      setError(errorMessage);
    }
  }, [activeConversation]);

  /**
   * Update the active conversation with new data
   */
  const updateActiveConversation = useCallback((updatedConversation: Conversation) => {
    setActiveConversation(updatedConversation);
    
    // Also update the conversation in the conversations list
    setConversations(prev => {
      const updated = prev.map(conv => 
        conv._id === updatedConversation._id 
          ? { ...updatedConversation }
          : conv
      );
      return conversationService.sortConversationsByDate(updated);
    });
  }, []);

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Update conversation in list when active conversation changes
   */
  const updateConversationInList = useCallback((updatedConversation: Conversation) => {
    setConversations(prev => {
      const updated = prev.map(conv => 
        conv._id === updatedConversation._id 
          ? { ...conv, updatedAt: updatedConversation.updatedAt }
          : conv
      );
      return conversationService.sortConversationsByDate(updated);
    });
  }, []);

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Update conversations list when active conversation is updated
  useEffect(() => {
    if (activeConversation) {
      updateConversationInList(activeConversation);
    }
  }, [activeConversation, updateConversationInList]);

  return {
    conversations,
    activeConversation,
    loading,
    loadingMore,
    hasMore,
    error,
    fetchConversations,
    loadMoreConversations,
    createNewConversation,
    selectConversation,
    updateConversationTitle,
    deleteConversation,
    refreshActiveConversation,
    updateActiveConversation,
    clearError
  };
}; 