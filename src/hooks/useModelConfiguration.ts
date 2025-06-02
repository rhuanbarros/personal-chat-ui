import { useState, useEffect } from 'react';
import { ModelConfiguration } from '@/types';
import { ConfigService, ConfigModel } from '@/services/configService';

const DEFAULT_CONFIG: ModelConfiguration = {
  provider: 'google',
  modelName: 'gemini-2.0-flash-lite',
  temperature: 0.7,
  topP: 0.9,
  renderMarkdown: true
};

// Global singleton state - shared across all hook instances
let globalConfiguration: ModelConfiguration = DEFAULT_CONFIG;
let globalListeners: Array<(config: ModelConfiguration) => void> = [];
let globalAvailableModels: ConfigModel[] = [];
let globalAvailableProviders: string[] = [];
let configLoaded = false;

const notifyListeners = (config: ModelConfiguration) => {
  globalListeners.forEach(listener => listener(config));
  
  // Save to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('modelConfiguration', JSON.stringify(config));
  }
};

const loadConfigFromLocalStorage = () => {
  if (typeof window !== 'undefined') {
    const savedConfig = localStorage.getItem('modelConfiguration');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        globalConfiguration = { ...DEFAULT_CONFIG, ...parsed };
      } catch (error) {
        console.error('Failed to parse saved configuration:', error);
      }
    }
  }
};

export const useModelConfiguration = () => {
  const [configuration, setConfiguration] = useState<ModelConfiguration>(globalConfiguration);
  const [availableModels, setAvailableModels] = useState<ConfigModel[]>(globalAvailableModels);
  const [availableProviders, setAvailableProviders] = useState<string[]>(globalAvailableProviders);
  const [loading, setLoading] = useState(!configLoaded);

  useEffect(() => {
    // Load from localStorage on client-side only
    if (!configLoaded) {
      loadConfigFromLocalStorage();
      setConfiguration(globalConfiguration);
    }

    // Add this component as a listener
    const listener = (newConfig: ModelConfiguration) => {
      setConfiguration(newConfig);
    };
    
    globalListeners.push(listener);
    
    // Load configuration if not already loaded
    const loadConfig = async () => {
      if (!configLoaded) {
        setLoading(true);
        try {
          const configService = ConfigService.getInstance();
          const [models, providers] = await Promise.all([
            configService.getModels(),
            configService.getProviders()
          ]);
          
          globalAvailableModels = models;
          globalAvailableProviders = providers;
          configLoaded = true;
          
          setAvailableModels(models);
          setAvailableProviders(providers);
          
          console.log('📊 Hook: Loaded models and providers:', { providers: providers.length, models: models.length });
        } catch (error) {
          console.error('Failed to load configuration:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setAvailableModels(globalAvailableModels);
        setAvailableProviders(globalAvailableProviders);
        setLoading(false);
      }
    };
    
    loadConfig();
    
    // Cleanup listener on unmount
    return () => {
      globalListeners = globalListeners.filter(l => l !== listener);
    };
  }, []);

  const updateConfiguration = (newConfig: ModelConfiguration) => {
    console.log('🔄 Configuration updated:', newConfig.provider, newConfig.modelName);
    globalConfiguration = newConfig;
    notifyListeners(newConfig);
  };

  const getModelsByProvider = (provider: string): ConfigModel[] => {
    return availableModels.filter(model => 
      model.provider.toLowerCase() === provider.toLowerCase()
    );
  };

  return {
    configuration,
    updateConfiguration,
    availableModels,
    availableProviders,
    getModelsByProvider,
    loading
  };
}; 