'use client';

import React, { useState } from 'react';
import { BookOpen, Plus, Search, Edit, Trash2, History, Copy, Clock } from 'lucide-react';
import { useSavedPrompts } from '@/hooks/useSavedPrompts';
import { SavedPromptSummary } from '@/services/savedPromptService';
import CreatePromptModal from './CreatePromptModal';
import EditPromptModal from './EditPromptModal';
import PromptVersionsModal from './PromptVersionsModal';

const SavedPromptsView: React.FC = () => {
  const { 
    savedPrompts, 
    loading, 
    error, 
    pagination, 
    fetchSavedPrompts, 
    createSavedPrompt, 
    deleteSavedPrompt,
    updateSavedPrompt,
    clearError 
  } = useSavedPrompts();

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<SavedPromptSummary | null>(null);
  const [viewingVersions, setViewingVersions] = useState<SavedPromptSummary | null>(null);

  const filteredPrompts = savedPrompts.filter(prompt =>
    prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (prompt.latestVersion?.text.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const handleCreatePrompt = async (name: string, text: string) => {
    try {
      await createSavedPrompt({ name, text });
      setIsCreateModalOpen(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this prompt? This action cannot be undone.')) {
      try {
        await deleteSavedPrompt(id);
      } catch (error) {
        // Error is handled by the hook
      }
    }
  };

  const handleUpdatePrompt = async (id: string, name: string) => {
    try {
      await updateSavedPrompt(id, { name });
      // Refresh the list to show updated data including latest versions
      await fetchSavedPrompts(pagination.currentPage);
      setEditingPrompt(null);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
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

  if (loading && savedPrompts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center text-gray-500">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading saved prompts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BookOpen size={28} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Saved Prompts</h1>
            <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
              {pagination.totalCount}
            </span>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            New Prompt
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search prompts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mx-6 mt-4 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {filteredPrompts.length === 0 ? (
          <div className="text-center text-gray-500 max-w-2xl mx-auto mt-12">
            <BookOpen size={64} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold mb-2">
              {savedPrompts.length === 0 ? 'No saved prompts yet' : 'No prompts found'}
            </h2>
            <p className="mb-4">
              {savedPrompts.length === 0 
                ? 'Create your first prompt to get started organizing your AI conversations.'
                : 'Try adjusting your search terms to find what you\'re looking for.'
              }
            </p>
            {savedPrompts.length === 0 && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Create Your First Prompt
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPrompts.map((prompt) => (
              <div
                key={prompt._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 truncate flex-1">
                      {prompt.name}
                    </h3>
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={() => setViewingVersions(prompt)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title={`View versions (${prompt.versionsCount})`}
                      >
                        <History size={16} />
                      </button>
                      <button
                        onClick={() => setEditingPrompt(prompt)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit prompt"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeletePrompt(prompt._id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete prompt"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {prompt.latestVersion && (
                    <div className="mb-3">
                      <p className="text-gray-700 text-sm line-clamp-3">
                        {prompt.latestVersion.text}
                      </p>
                      <button
                        onClick={() => handleCopyToClipboard(prompt.latestVersion!.text)}
                        className="mt-2 text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                      >
                        <Copy size={14} />
                        Copy
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(prompt.updatedAt)}
                    </div>
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {prompt.versionsCount} version{prompt.versionsCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => fetchSavedPrompts(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1 || loading}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchSavedPrompts(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages || loading}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <CreatePromptModal
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreatePrompt}
          loading={loading}
        />
      )}

      {editingPrompt && (
        <EditPromptModal
          prompt={editingPrompt}
          onClose={() => setEditingPrompt(null)}
          onSubmit={handleUpdatePrompt}
          loading={loading}
        />
      )}

      {viewingVersions && (
        <PromptVersionsModal
          prompt={viewingVersions}
          onClose={() => setViewingVersions(null)}
        />
      )}
    </div>
  );
};

export default SavedPromptsView; 