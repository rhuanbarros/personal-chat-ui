import React, { useState, useEffect, useCallback } from 'react';
import { ModelConfiguration, ConfigurationTabType, TabConfiguration } from '@/types';
import { useModelConfiguration } from '@/hooks/useModelConfiguration';
import { useSavedPrompts } from '@/hooks/useSavedPrompts';
import { SavedPromptSummary } from '@/services/savedPromptService';
import { Plus, Edit, Copy } from 'lucide-react';
import CreatePromptModal from './CreatePromptModal';
import EditPromptModal from './EditPromptModal';

interface TabbedConfigurationPanelProps {
  configuration: ModelConfiguration;
  onConfigurationChange: (config: ModelConfiguration) => void;
}

const TabbedConfigurationPanel: React.FC<TabbedConfigurationPanelProps> = ({
  configuration,
  onConfigurationChange
}) => {
  const { availableProviders, getModelsByProvider, loading } = useModelConfiguration();
  const { 
    savedPrompts, 
    loading: promptsLoading, 
    createSavedPrompt, 
    updateSavedPrompt,
    fetchSavedPrompts 
  } = useSavedPrompts();
  
  const [selectedProvider, setSelectedProvider] = useState(configuration.provider);
  const [availableModelsForProvider, setAvailableModelsForProvider] = useState(
    getModelsByProvider(configuration.provider)
  );
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState<ConfigurationTabType>('simple-models');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<SavedPromptSummary | null>(null);
  const [hoveredPrompt, setHoveredPrompt] = useState<string | null>(null);

  // Track if we're on the client to avoid hydration mismatches
  useEffect(() => {
    setIsClient(true);
    // Load saved tab preference from localStorage
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('activeConfigTab') as ConfigurationTabType;
      if (savedTab && (savedTab === 'simple-models' || savedTab === 'agents')) {
        setActiveTab(savedTab);
      }
    }
  }, []);

  // Save tab selection to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeConfigTab', activeTab);
    }
  }, [activeTab]);

  const handleChange = useCallback((field: keyof ModelConfiguration, value: string | number | boolean) => {
    console.log(`🔧 TabbedConfigurationPanel: Changing ${field} to`, value);
    
    let newConfig = { ...configuration, [field]: value };
    
    // If provider changed, update the selected provider state and reset model if necessary
    if (field === 'provider') {
      setSelectedProvider(value as string);
      // We'll handle model selection in the useEffect when selectedProvider changes
    }
    
    console.log('🔧 Full new config will be:', newConfig);
    onConfigurationChange(newConfig);
  }, [configuration, onConfigurationChange]);

  // Update available models when provider changes
  useEffect(() => {
    const models = getModelsByProvider(selectedProvider);
    setAvailableModelsForProvider(models);
    
    // If current model is not available for the new provider, select the first available model
    if (selectedProvider !== configuration.provider && models.length > 0) {
      // Auto-select first model when provider changes
      const newConfig = { ...configuration, provider: selectedProvider, modelName: models[0].name };
      console.log('🔧 Auto-selecting first model for new provider:', newConfig);
      onConfigurationChange(newConfig);
    }
  }, [selectedProvider, configuration, onConfigurationChange]);

  const handleCreatePrompt = async (name: string, text: string) => {
    try {
      await createSavedPrompt({ name, text });
      setIsCreateModalOpen(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleUpdatePrompt = async (id: string, name: string, text?: string) => {
    try {
      await updateSavedPrompt(id, { name });
      if (text) {
        // Refresh to get the latest data
        await fetchSavedPrompts(1);
      }
      setEditingPrompt(null);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderSavedPromptsSection = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Saved prompts</h3>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="text-blue-600 hover:text-blue-700 transition-colors"
          title="Create new prompt"
        >
          <Plus size={16} />
        </button>
      </div>
      
      <div className="border border-gray-200 rounded-lg bg-gray-50 max-h-48 overflow-y-auto">
        {promptsLoading ? (
          <div className="p-4 text-center text-gray-500 text-sm">Loading prompts...</div>
        ) : savedPrompts.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">No saved prompts yet</div>
        ) : (
          <div className="p-2">
            {savedPrompts.map((prompt) => (
              <div
                key={prompt._id}
                className="relative group"
                onMouseEnter={() => setHoveredPrompt(prompt._id)}
                onMouseLeave={() => setHoveredPrompt(null)}
              >
                <div className="flex items-center justify-between p-2 hover:bg-white rounded transition-colors">
                  <span 
                    className="text-sm text-gray-800 truncate flex-1 cursor-pointer"
                    title="Click to view prompt content"
                  >
                    {prompt.name}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {prompt.latestVersion && (
                      <button
                        onClick={() => handleCopyPrompt(prompt.latestVersion!.text)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Copy prompt"
                      >
                        <Copy size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => setEditingPrompt(prompt)}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit prompt"
                    >
                      <Edit size={14} />
                    </button>
                  </div>
                </div>
                
                {/* Tooltip with prompt content */}
                {hoveredPrompt === prompt._id && prompt.latestVersion && (
                  <div className="absolute right-full top-0 mr-2 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 max-w-xs w-64">
                    <div className="text-xs font-medium text-gray-700 mb-1">{prompt.name}</div>
                    <div className="text-xs text-gray-600 line-clamp-6 whitespace-pre-wrap">
                      {prompt.latestVersion.text}
                    </div>
                    {prompt.latestVersion.text.length > 200 && (
                      <div className="text-xs text-gray-400 mt-1">...</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSimpleModelsTab = () => (
    <div className="space-y-6">
      {/* Model Provider */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Model provider
        </label>
        <select
          value={configuration.provider}
          onChange={(e) => handleChange('provider', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
        >
          {availableProviders.length === 0 ? (
            <option value={configuration.provider}>{configuration.provider.charAt(0).toUpperCase() + configuration.provider.slice(1)}</option>
          ) : (
            availableProviders.map(provider => (
              <option key={provider} value={provider}>
                {provider.charAt(0).toUpperCase() + provider.slice(1)}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Model Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Model name
        </label>
        <select
          value={configuration.modelName}
          onChange={(e) => handleChange('modelName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
          disabled={availableModelsForProvider.length === 0}
        >
          {availableModelsForProvider.length === 0 ? (
            <option value={configuration.modelName}>{configuration.modelName}</option>
          ) : (
            availableModelsForProvider.map(model => (
              <option key={model.name} value={model.name}>
                {model.name}
                {model.reasoning && ' (Reasoning)'}
              </option>
            ))
          )}
        </select>
        {availableModelsForProvider.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            {availableModelsForProvider.length} model{availableModelsForProvider.length !== 1 ? 's' : ''} available
          </p>
        )}
      </div>

      {/* Temperature */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Temperature
        </label>
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={configuration.temperature}
            onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span className="font-medium text-gray-700">{configuration.temperature}</span>
            <span>2</span>
          </div>
        </div>
      </div>

      {/* Top P */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Top p
        </label>
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={configuration.topP}
            onChange={(e) => handleChange('topP', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span className="font-medium text-gray-700">{configuration.topP}</span>
            <span>1</span>
          </div>
        </div>
      </div>

      {/* Render Markdown */}
      <div>
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={configuration.renderMarkdown}
            onChange={(e) => handleChange('renderMarkdown', e.target.checked)}
            className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
          <span className="text-sm font-medium text-gray-700">
            Render markdown
          </span>
        </label>
        <p className="text-xs text-gray-500 mt-2 ml-8">
          Enable to render AI responses with markdown formatting (bold, italic, code blocks, etc.)
        </p>
      </div>
    </div>
  );

  const renderAgentsTab = () => (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="text-gray-400 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">Agents Configuration</h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          Agent configuration will be available soon. This will allow you to access different AI backend endpoints and specialized agent configurations.
        </p>
      </div>
    </div>
  );

  // Show loading state until providers are loaded and we're on the client
  if (loading || !isClient) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-6 flex flex-col h-full">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">CONFIGURATION</h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading configuration...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      <div className="p-6 flex flex-col h-full">
        <h2 className="text-lg font-semibold text-gray-800 mb-6 flex-shrink-0">CONFIGURATION</h2>
        
        {/* Saved Prompts Section */}
        <div className="flex-shrink-0 mb-6">
          {renderSavedPromptsSection()}
        </div>
        
        {/* Tab Navigation */}
        <div className="flex mb-6 border-b border-gray-200 flex-shrink-0">
          <button
            onClick={() => setActiveTab('simple-models')}
            className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'simple-models'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Simple models
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'agents'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Agents
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {activeTab === 'simple-models' ? renderSimpleModelsTab() : renderAgentsTab()}
        </div>
      </div>

      {/* Modals */}
      {isCreateModalOpen && (
        <CreatePromptModal
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreatePrompt}
          loading={promptsLoading}
        />
      )}

      {editingPrompt && (
        <EditPromptModal
          prompt={editingPrompt}
          onClose={() => setEditingPrompt(null)}
          onSubmit={handleUpdatePrompt}
          loading={promptsLoading}
        />
      )}
    </div>
  );
};

export default TabbedConfigurationPanel; 