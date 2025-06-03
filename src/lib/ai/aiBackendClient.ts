/**
 * AI Backend Client
 * Dedicated client for AI backend API interactions
 * Handles AI-specific endpoints and data transformation
 */

import { HttpClient, HttpError } from '../http/httpClient';
import { AIMessage, AIServiceConfig } from '@/types';
import { logger } from '@/lib/logger';

export interface AIBackendConfig {
  baseUrl: string;
  timeout?: number;
}

export interface AIGenerateRequest {
  messages: AIMessage[];
  temperature?: number;
  top_p?: number;
  model_name?: string;
  model_provider?: string;
}

export interface AIGenerateResponse {
  response: string;
}

export class AIBackendClient {
  private httpClient: HttpClient;

  constructor(config: AIBackendConfig) {
    this.httpClient = new HttpClient({
      baseUrl: config.baseUrl,
      timeout: config.timeout || 30000,
      defaultHeaders: {
        'Content-Type': 'application/json'
      }
    });

    logger.aiService.info('AI Backend Client initialized', { 
      baseUrl: config.baseUrl 
    });
  }

  /**
   * Generate AI response using the basic model endpoint
   */
  async generateResponse(messages: AIMessage[], config: AIServiceConfig): Promise<string> {
    const requestPayload: AIGenerateRequest = {
      messages,
      temperature: config.temperature,
      top_p: config.topP,
      model_name: config.model,
      model_provider: config.provider
    };

    logger.aiService.debug('Calling AI backend', {
      endpoint: '/invoke_basic_model',
      messageCount: messages.length,
      model: config.model,
      provider: config.provider
    });

    try {
      const response = await this.httpClient.post<AIGenerateResponse>(
        '/invoke_basic_model',
        requestPayload
      );

      if (!response.data.response?.trim()) {
        throw new Error('Backend returned an empty response');
      }

      logger.aiService.info('Received response from AI backend', {
        responseLength: response.data.response.length
      });

      return response.data.response.trim();

    } catch (error) {
      logger.aiService.error('AI backend request failed', error);
      
      if (error instanceof HttpError) {
        throw new Error(`AI Backend API error (${error.status}): ${error.body || error.statusText}`);
      }
      
      throw error;
    }
  }

  /**
   * Check if the AI backend is available
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.httpClient.get('/health', { timeout: 5000 });
      return true;
    } catch (error) {
      logger.aiService.warn('AI backend health check failed', error as Error);
      return false;
    }
  }

  /**
   * Test the backend connection with a simple request
   */
  async testConnection(): Promise<boolean> {
    try {
      const testMessages: AIMessage[] = [{
        role: 'user',
        content: 'Hello'
      }];
      
      const testConfig: AIServiceConfig = {
        provider: 'google',
        model: 'gemini-2.0-flash',
        temperature: 0.7,
        topP: 1.0
      };

      await this.generateResponse(testMessages, testConfig);
      return true;
    } catch (error) {
      logger.aiService.error('AI backend connection test failed', error);
      return false;
    }
  }

  /**
   * Get the backend base URL
   */
  getBaseUrl(): string {
    return this.httpClient.getConfig().baseUrl;
  }

  /**
   * Update the backend configuration
   */
  updateConfig(config: Partial<AIBackendConfig>): void {
    if (config.baseUrl || config.timeout) {
      this.httpClient.updateConfig({
        baseUrl: config.baseUrl,
        timeout: config.timeout
      });
    }
  }
} 