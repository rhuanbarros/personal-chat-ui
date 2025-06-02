'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { SavedPromptSummary } from '@/services/savedPromptService';

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
  const [errors, setErrors] = useState<{ name?: string }>({});

  useEffect(() => {
    setName(prompt.name);
  }, [prompt.name]);

  const validateForm = () => {
    const newErrors: { name?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Don't submit if name hasn't changed
    if (name.trim() === prompt.name) {
      onClose();
      return;
    }
    
    try {
      await onSubmit(prompt._id, name.trim());
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Edit Prompt</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
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
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter prompt name"
              disabled={loading}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>
          
          {prompt.latestVersion && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Prompt Text (Read-only)
              </label>
              <div className="bg-gray-50 p-3 rounded-lg border">
                <p className="text-gray-700 text-sm whitespace-pre-wrap">
                  {prompt.latestVersion.text}
                </p>
              </div>
              <p className="text-gray-500 text-xs mt-1">
                To edit the prompt text, create a new version from the main view.
              </p>
            </div>
          )}
          
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !name.trim() || name.trim() === prompt.name}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPromptModal; 