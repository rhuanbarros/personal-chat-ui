/**
 * AI Provider Interface and Factory
 * Abstraction layer for different AI providers with proper separation of concerns
 */

import { AIMessage, AIServiceConfig } from '@/types';
import { AIBackendClient, AIBackendConfig } from './aiBackendClient';

export interface AIProvider {
  generateResponse(messages: AIMessage[], config: AIServiceConfig): Promise<string>;
  isAvailable(): Promise<boolean>;
  getProviderInfo(): AIProviderInfo;
}

export interface AIProviderInfo {
  name: string;
  type: 'backend' | 'direct';
  baseUrl?: string;
  supportedModels?: string[];
}

/**
 * Python Backend AI Provider
 * Uses the Python backend service for AI generation
 */
export class PythonBackendProvider implements AIProvider {
  private client: AIBackendClient;
  private providerInfo: AIProviderInfo;

  constructor(config: AIBackendConfig) {
    this.client = new AIBackendClient(config);
    this.providerInfo = {
      name: 'Python Backend',
      type: 'backend',
      baseUrl: config.baseUrl,
      supportedModels: ['gemini-2.0-flash', 'gpt-4', 'gpt-3.5-turbo']
    };
  }

  async generateResponse(messages: AIMessage[], config: AIServiceConfig): Promise<string> {
    return this.client.generateResponse(messages, config);
  }

  async isAvailable(): Promise<boolean> {
    return this.client.isHealthy();
  }

  getProviderInfo(): AIProviderInfo {
    return { ...this.providerInfo };
  }

  getBackendUrl(): string {
    return this.client.getBaseUrl();
  }

  updateConfig(config: Partial<AIBackendConfig>): void {
    this.client.updateConfig(config);
    if (config.baseUrl) {
      this.providerInfo.baseUrl = config.baseUrl;
    }
  }
}

/**
 * AI Provider Factory
 * Factory for creating AI providers based on configuration
 */
export class AIProviderFactory {
  static createProvider(type: 'python-backend', config: AIBackendConfig): PythonBackendProvider;
  static createProvider(type: string, config: any): AIProvider {
    switch (type) {
      case 'python-backend':
        return new PythonBackendProvider(config);
      default:
        throw new Error(`Unknown AI provider type: ${type}`);
    }
  }

  static getAvailableProviders(): string[] {
    return ['python-backend'];
  }
} 