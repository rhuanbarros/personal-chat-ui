'use client';

import React, { useState } from 'react';
import { X, Plus, Copy, Clock } from 'lucide-react';
import { SavedPromptSummary } from '@/services/savedPromptService';
import { useSavedPrompt } from '@/hooks/useSavedPrompts';

interface PromptVersionsModalProps {
  prompt: SavedPromptSummary;
  onClose: () => void;
}

const PromptVersionsModal: React.FC<PromptVersionsModalProps> = ({
  prompt,
  onClose
}) => {
  const { savedPrompt, loading, error, addVersion } = useSavedPrompt(prompt._id);
  const [isAddingVersion, setIsAddingVersion] = useState(false);
  const [newVersionText, setNewVersionText] = useState('');
  const [addVersionError, setAddVersionError] = useState('');

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const handleAddVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newVersionText.trim()) {
      setAddVersionError('Version text is required');
      return;
    }
    
    if (newVersionText.trim().length < 10) {
      setAddVersionError('Version text must be at least 10 characters');
      return;
    }
    
    try {
      await addVersion(newVersionText.trim());
      setNewVersionText('');
      setIsAddingVersion(false);
      setAddVersionError('');
    } catch (error) {
      setAddVersionError('Failed to add version');
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !savedPrompt) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{prompt.name}</h2>
            <p className="text-gray-500 text-sm">
              {savedPrompt?.versions.length || prompt.versionsCount} version{(savedPrompt?.versions.length || prompt.versionsCount) !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddingVersion(!isAddingVersion)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
              disabled={loading}
            >
              <Plus size={16} />
              Add Version
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-4 rounded-lg">
              {error}
            </div>
          )}

          {/* Add New Version Form */}
          {isAddingVersion && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Add New Version</h3>
              <form onSubmit={handleAddVersion}>
                <textarea
                  value={newVersionText}
                  onChange={(e) => setNewVersionText(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                  placeholder="Enter the new version text..."
                  disabled={loading}
                />
                {addVersionError && (
                  <p className="text-red-500 text-sm mt-1">{addVersionError}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <p className="text-gray-500 text-sm">
                    {newVersionText.length} characters
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingVersion(false);
                        setNewVersionText('');
                        setAddVersionError('');
                      }}
                      className="px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      disabled={loading || !newVersionText.trim()}
                    >
                      {loading ? 'Adding...' : 'Add Version'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Versions List */}
          <div className="space-y-4">
            {savedPrompt?.versions.map((version, index) => (
              <div
                key={version._id}
                className="bg-gray-50 rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                      Version {savedPrompt.versions.length - index}
                    </span>
                    {index === 0 && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Latest
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-gray-500 text-sm">
                      <Clock size={14} />
                      {formatDate(version.dateCreated)}
                    </div>
                    <button
                      onClick={() => handleCopyToClipboard(version.text)}
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                  {version.text}
                </p>
              </div>
            ))}
          </div>

          {savedPrompt?.versions.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <p>No versions found for this prompt.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptVersionsModal; 