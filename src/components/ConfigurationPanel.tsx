import React, { useState, useEffect, useCallback } from 'react';
import { ModelConfiguration } from '@/types';
import { useModelConfiguration } from '@/hooks/useModelConfiguration';

interface ConfigurationPanelProps {
  configuration: ModelConfiguration;
  onConfigurationChange: (config: ModelConfiguration) => void;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  configuration,
  onConfigurationChange
}) => {
  const { availableProviders, getModelsByProvider, loading } = useModelConfiguration();
  const [selectedProvider, setSelectedProvider] = useState(configuration.provider);
  const [availableModelsForProvider, setAvailableModelsForProvider] = useState(
    getModelsByProvider(configuration.provider)
  );
  const [isClient, setIsClient] = useState(false);

  // Track if we're on the client to avoid hydration mismatches
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleChange = useCallback((field: keyof ModelConfiguration, value: string | number | boolean) => {
    console.log(`🔧 ConfigurationPanel: Changing ${field} to`, value);
    
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

  // Show loading state until providers are loaded and we're on the client
  if (loading || !isClient) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-6 flex flex-col">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">CONFIGURATION</h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading configuration...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-6 flex flex-col">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">CONFIGURATION</h2>
      
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
    </div>
  );
};

export default ConfigurationPanel; 