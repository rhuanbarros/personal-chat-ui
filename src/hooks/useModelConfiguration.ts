import { useState, useEffect } from 'react';
import { ModelConfiguration, ConfigurationTabType, TabConfiguration } from '@/types';
import { ConfigService, ConfigModel } from '@/services/configService';

const DEFAULT_CONFIG: ModelConfiguration = {
  provider: 'google',
  modelName: 'gemini-2.0-flash-lite',
  temperature: 0.7,
  topP: 0.9,
  renderMarkdown: true
};

const DEFAULT_TAB_CONFIG: TabConfiguration = {
  activeTab: 'simple-models',
  modelConfig: DEFAULT_CONFIG,
  agentConfig: undefined
};

// Global singleton state - shared across all hook instances
let globalConfiguration: ModelConfiguration = DEFAULT_CONFIG;
let globalTabConfiguration: TabConfiguration = DEFAULT_TAB_CONFIG;
let globalListeners: Array<(config: ModelConfiguration) => void> = [];
let globalTabListeners: Array<(config: TabConfiguration) => void> = [];
let globalAvailableModels: ConfigModel[] = [];
let globalAvailableProviders: string[] = [];
let configLoaded = false;

const notifyListeners = (config: ModelConfiguration) => {
  globalListeners.forEach(listener => listener(config));
  
  // Update the tab configuration's model config
  globalTabConfiguration = {
    ...globalTabConfiguration,
    modelConfig: config
  };
  
  // Save to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('modelConfiguration', JSON.stringify(config));
    localStorage.setItem('tabConfiguration', JSON.stringify(globalTabConfiguration));
  }
};

const notifyTabListeners = (config: TabConfiguration) => {
  globalTabListeners.forEach(listener => listener(config));
  
  // Save to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('tabConfiguration', JSON.stringify(config));
  }
};

const loadConfigFromLocalStorage = () => {
  if (typeof window !== 'undefined') {
    // Load model configuration
    const savedConfig = localStorage.getItem('modelConfiguration');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        globalConfiguration = { ...DEFAULT_CONFIG, ...parsed };
      } catch (error) {
        console.error('Failed to parse saved model configuration:', error);
      }
    }
    
    // Load tab configuration
    const savedTabConfig = localStorage.getItem('tabConfiguration');
    if (savedTabConfig) {
      try {
        const parsed = JSON.parse(savedTabConfig);
        globalTabConfiguration = { 
          ...DEFAULT_TAB_CONFIG, 
          ...parsed,
          modelConfig: globalConfiguration // Ensure model config is up to date
        };
      } catch (error) {
        console.error('Failed to parse saved tab configuration:', error);
      }
    } else {
      globalTabConfiguration = {
        ...DEFAULT_TAB_CONFIG,
        modelConfig: globalConfiguration
      };
    }
  }
};

export const useModelConfiguration = () => {
  const [configuration, setConfiguration] = useState<ModelConfiguration>(globalConfiguration);
  const [tabConfiguration, setTabConfiguration] = useState<TabConfiguration>(globalTabConfiguration);
  const [availableModels, setAvailableModels] = useState<ConfigModel[]>(globalAvailableModels);
  const [availableProviders, setAvailableProviders] = useState<string[]>(globalAvailableProviders);
  const [loading, setLoading] = useState(!configLoaded);

  useEffect(() => {
    // Load from localStorage on client-side only
    if (!configLoaded) {
      loadConfigFromLocalStorage();
      setConfiguration(globalConfiguration);
      setTabConfiguration(globalTabConfiguration);
    }

    // Add this component as a listener for model config
    const listener = (newConfig: ModelConfiguration) => {
      setConfiguration(newConfig);
    };
    
    // Add this component as a listener for tab config
    const tabListener = (newTabConfig: TabConfiguration) => {
      setTabConfiguration(newTabConfig);
    };
    
    globalListeners.push(listener);
    globalTabListeners.push(tabListener);
    
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
    
    // Cleanup listeners on unmount
    return () => {
      globalListeners = globalListeners.filter(l => l !== listener);
      globalTabListeners = globalTabListeners.filter(l => l !== tabListener);
    };
  }, []);

  const updateConfiguration = (newConfig: ModelConfiguration) => {
    console.log('🔄 Model Configuration updated:', newConfig.provider, newConfig.modelName);
    globalConfiguration = newConfig;
    notifyListeners(newConfig);
  };

  const updateTabConfiguration = (newTabConfig: TabConfiguration) => {
    console.log('🔄 Tab Configuration updated:', newTabConfig.activeTab);
    globalTabConfiguration = newTabConfig;
    notifyTabListeners(newTabConfig);
  };

  const getModelsByProvider = (provider: string): ConfigModel[] => {
    return availableModels.filter(model => 
      model.provider.toLowerCase() === provider.toLowerCase()
    );
  };

  return {
    configuration,
    tabConfiguration,
    updateConfiguration,
    updateTabConfiguration,
    availableModels,
    availableProviders,
    getModelsByProvider,
    loading
  };
}; 