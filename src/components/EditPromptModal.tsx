'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { SavedPromptSummary } from '@/services/savedPromptService';
import savedPromptService from '@/services/savedPromptService';

interface EditPromptModalProps {
  prompt: SavedPromptSummary;
  onClose: () => void;
  onSubmit: (id: string, name: string) => Promise<void>;
  loading: boolean;
}

const EditPromptModal: React.FC<EditPromptModalProps> = ({
  prompt,
  onClose,
  onSubmit,
  loading
}) => {
  const [name, setName] = useState(prompt.name);
  const [text, setText] = useState(prompt.latestVersion?.text || '');
  const [originalText, setOriginalText] = useState(prompt.latestVersion?.text || '');
  const [errors, setErrors] = useState<{ name?: string; text?: string }>({});
  const [isUpdatingText, setIsUpdatingText] = useState(false);

  useEffect(() => {
    setName(prompt.name);
    setText(prompt.latestVersion?.text || '');
    setOriginalText(prompt.latestVersion?.text || '');
  }, [prompt.name, prompt.latestVersion?.text]);

  const validateForm = () => {
    const newErrors: { name?: string; text?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }

    if (!text.trim()) {
      newErrors.text = 'Prompt text is required';
    } else if (text.trim().length < 10) {
      newErrors.text = 'Prompt text must be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const nameChanged = name.trim() !== prompt.name;
    const textChanged = text.trim() !== originalText;
    
    // If nothing changed, just close
    if (!nameChanged && !textChanged) {
      onClose();
      return;
    }
    
    try {
      // Update name if changed
      if (nameChanged) {
        await onSubmit(prompt._id, name.trim());
      }
      
      // Add new version if text changed
      if (textChanged) {
        setIsUpdatingText(true);
        await savedPromptService.addVersionToPrompt(prompt._id, text.trim());
      }
      
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsUpdatingText(false);
    }
  };

  const isLoading = loading || isUpdatingText;
  const hasChanges = name.trim() !== prompt.name || text.trim() !== originalText;

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Edit Prompt</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Prompt Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter prompt name"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>
          
          <div className="mb-6">
            <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
              Current Prompt Text *
            </label>
            <textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical text-black ${
                errors.text ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter prompt text here..."
              disabled={isLoading}
            />
            {errors.text && (
              <p className="text-red-500 text-sm mt-1">{errors.text}</p>
            )}
            <p className="text-gray-500 text-sm mt-1">
              {text.length} characters
              {text.trim() !== originalText && (
                <span className="text-blue-600 ml-2">• Text modified - will create new version</span>
              )}
            </p>
          </div>
          
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !hasChanges}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPromptModal; 