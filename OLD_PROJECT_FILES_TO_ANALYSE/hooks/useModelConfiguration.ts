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

// Initialize from localStorage once and load models
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
  
  // Load available models and providers
  const configService = ConfigService.getInstance();
  configService.loadConfig().then(() => {
    configService.getModels().then(models => {
      globalAvailableModels = models;
    });
    configService.getProviders().then(providers => {
      globalAvailableProviders = providers;
    });
  }).catch(error => {
    console.error('Failed to load configuration:', error);
  });
}

const notifyListeners = (config: ModelConfiguration) => {
  globalListeners.forEach(listener => listener(config));
  
  // Save to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('modelConfiguration', JSON.stringify(config));
  }
};

export const useModelConfiguration = () => {
  const [configuration, setConfiguration] = useState<ModelConfiguration>(globalConfiguration);
  const [availableModels, setAvailableModels] = useState<ConfigModel[]>(globalAvailableModels);
  const [availableProviders, setAvailableProviders] = useState<string[]>(globalAvailableProviders);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Add this component as a listener
    const listener = (newConfig: ModelConfiguration) => {
      setConfiguration(newConfig);
    };
    
    globalListeners.push(listener);
    
    // Load configuration if not already loaded
    const loadConfig = async () => {
      if (globalAvailableModels.length === 0 || globalAvailableProviders.length === 0) {
        setLoading(true);
        try {
          const configService = ConfigService.getInstance();
          const [models, providers] = await Promise.all([
            configService.getModels(),
            configService.getProviders()
          ]);
          
          globalAvailableModels = models;
          globalAvailableProviders = providers;
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