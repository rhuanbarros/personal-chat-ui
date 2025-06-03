import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SavedPromptSummary } from '@/services/savedPromptService';

interface SystemPromptContextValue {
  selectedPrompt: SavedPromptSummary | null;
  selectPrompt: (prompt: SavedPromptSummary | null) => void;
}

const SystemPromptContext = createContext<SystemPromptContextValue | undefined>(undefined);

export const SystemPromptProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedPrompt, setSelectedPrompt] = useState<SavedPromptSummary | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedPromptData = localStorage.getItem('selectedSystemPrompt');
    if (savedPromptData) {
      try {
        const prompt = JSON.parse(savedPromptData) as SavedPromptSummary;
        setSelectedPrompt(prompt);
      } catch {
        localStorage.removeItem('selectedSystemPrompt');
      }
    }
  }, []);

  const isSamePrompt = (a: SavedPromptSummary | null, b: SavedPromptSummary | null): boolean => {
    if (a === b) return true;
    if (!a || !b) return false;
    return a._id === b._id && a.latestVersion?.text === b.latestVersion?.text;
  };

  const selectPrompt = useCallback((prompt: SavedPromptSummary | null) => {
    // Avoid unnecessary updates
    setSelectedPrompt(prev => {
      if (isSamePrompt(prev, prompt)) {
        return prev;
      }
      if (prompt) {
        localStorage.setItem('selectedSystemPrompt', JSON.stringify(prompt));
      } else {
        localStorage.removeItem('selectedSystemPrompt');
      }
      return prompt;
    });
  }, []);

  return (
    <SystemPromptContext.Provider value={{ selectedPrompt, selectPrompt }}>
      {children}
    </SystemPromptContext.Provider>
  );
};

export const useSystemPromptContext = (): SystemPromptContextValue => {
  const context = useContext(SystemPromptContext);
  if (!context) {
    throw new Error('useSystemPromptContext must be used within a SystemPromptProvider');
  }
  return context;
}; 