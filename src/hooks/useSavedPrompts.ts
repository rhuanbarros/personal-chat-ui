import { useState, useEffect, useCallback } from 'react';
import savedPromptService, { 
  SavedPromptSummary, 
  PaginatedSavedPrompts, 
  CreateSavedPromptRequest,
  UpdateSavedPromptRequest 
} from '@/services/savedPromptService';
import { ISavedPrompt } from '@/models/SavedPrompt';

export const useSavedPrompts = () => {
  const [savedPrompts, setSavedPrompts] = useState<SavedPromptSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasMore: false,
    limit: 20
  });

  const fetchSavedPrompts = useCallback(async (page: number = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const response: PaginatedSavedPrompts = await savedPromptService.getAllSavedPrompts(page);
      setSavedPrompts(response.savedPrompts);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch saved prompts');
    } finally {
      setLoading(false);
    }
  }, []);

  const createSavedPrompt = useCallback(async (prompt: CreateSavedPromptRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const newPrompt = await savedPromptService.createSavedPrompt(prompt);
      // Refresh the list to include the new prompt
      await fetchSavedPrompts(pagination.currentPage);
      return newPrompt;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create saved prompt');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchSavedPrompts, pagination.currentPage]);

  const deleteSavedPrompt = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await savedPromptService.deleteSavedPrompt(id);
      // Remove from local state
      setSavedPrompts(prev => prev.filter(prompt => prompt._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete saved prompt');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSavedPrompt = useCallback(async (id: string, updates: UpdateSavedPromptRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedPrompt = await savedPromptService.updateSavedPrompt(id, updates);
      // Refresh the list to reflect changes
      await fetchSavedPrompts(pagination.currentPage);
      return updatedPrompt;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update saved prompt');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchSavedPrompts, pagination.currentPage]);

  useEffect(() => {
    fetchSavedPrompts(1);
  }, [fetchSavedPrompts]);

  return {
    savedPrompts,
    loading,
    error,
    pagination,
    fetchSavedPrompts,
    createSavedPrompt,
    deleteSavedPrompt,
    updateSavedPrompt,
    clearError: () => setError(null)
  };
};

export const useSavedPrompt = (id: string | null) => {
  const [savedPrompt, setSavedPrompt] = useState<ISavedPrompt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSavedPrompt = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await savedPromptService.getSavedPromptById(id);
      setSavedPrompt(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch saved prompt');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const addVersion = useCallback(async (text: string) => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const updatedPrompt = await savedPromptService.addVersionToPrompt(id, text);
      setSavedPrompt(updatedPrompt);
      return updatedPrompt;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add version');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSavedPrompt();
  }, [fetchSavedPrompt]);

  return {
    savedPrompt,
    loading,
    error,
    fetchSavedPrompt,
    addVersion,
    clearError: () => setError(null)
  };
}; 