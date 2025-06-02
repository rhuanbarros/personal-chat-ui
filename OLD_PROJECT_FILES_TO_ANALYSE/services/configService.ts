export interface ConfigModel {
  provider: string;
  name: string;
  reasoning: boolean;
}

export interface AppConfig {
  models: ConfigModel[];
}

export class ConfigService {
  private static instance: ConfigService;
  private config: AppConfig | null = null;

  private constructor() {}

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  public async loadConfig(): Promise<AppConfig> {
    if (this.config) {
      return this.config;
    }

    try {
      const response = await fetch('/config.json');
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.statusText}`);
      }
      
      this.config = await response.json();
      console.log('📋 ConfigService: Loaded configuration:', this.config);
      return this.config!;
    } catch (error) {
      console.error('❌ ConfigService: Failed to load configuration:', error);
      // Return default configuration as fallback
      this.config = {
        models: [
          {
            provider: 'google',
            name: 'gemini-2.0-flash-lite',
            reasoning: false
          }
        ]
      };
      return this.config;
    }
  }

  public async getProviders(): Promise<string[]> {
    const config = await this.loadConfig();
    const providerSet = new Set(config.models.map(model => model.provider));
    const providers = Array.from(providerSet);
    console.log('🏢 ConfigService: Available providers:', providers);
    return providers;
  }

  public async getModels(): Promise<ConfigModel[]> {
    const config = await this.loadConfig();
    console.log('🤖 ConfigService: Available models:', config.models);
    return config.models;
  }

  public async getModelsByProvider(provider: string): Promise<ConfigModel[]> {
    const config = await this.loadConfig();
    const models = config.models.filter(model => 
      model.provider.toLowerCase() === provider.toLowerCase()
    );
    console.log(`🤖 ConfigService: Models for provider ${provider}:`, models);
    return models;
  }

  public async getModelByName(modelName: string): Promise<ConfigModel | undefined> {
    const config = await this.loadConfig();
    const model = config.models.find(model => model.name === modelName);
    console.log(`🔍 ConfigService: Model ${modelName}:`, model);
    return model;
  }
} 