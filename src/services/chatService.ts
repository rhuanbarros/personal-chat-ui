/**
 * Chat Service
 * High-level service for AI chat interactions with proper separation of concerns
 * Handles message validation, context preparation, and AI service coordination
 */

import { 
  Message, 
  ChatRequest, 
  ChatResponse, 
  ServiceResult, 
  AIServiceConfig 
} from '@/types';
import { MessageMapper } from '@/lib/messageMapper';
import { logger } from '@/lib/logger';
import { AIProvider, AIProviderFactory, PythonBackendProvider } from '@/lib/ai/aiProvider';
import { AIBackendConfig } from '@/lib/ai/aiBackendClient';

export interface ChatServiceConfig extends AIServiceConfig {
  backendUrl?: string;
  providerType?: 'python-backend';
}

export class ChatService {
  private provider: AIProvider;
  private defaultConfig: AIServiceConfig;

  constructor(config: ChatServiceConfig = {}) {
    this.defaultConfig = {
      responseDelay: 0,
      provider: 'google',
      model: 'gemini-2.0-flash',
      temperature: 0.7,
      topP: 1.0,
      maxOutputTokens: 2048,
      ...config
    };

    // Create AI provider using factory
    const providerType = config.providerType || 'python-backend';
    const backendConfig: AIBackendConfig = {
      baseUrl: config.backendUrl || process.env.AI_BACKEND || 'http://localhost:8000',
      timeout: 30000
    };

    this.provider = AIProviderFactory.createProvider(providerType, backendConfig);
    
    logger.chatService.info('Chat service initialized', {
      model: this.defaultConfig.model,
      provider: this.defaultConfig.provider,
      providerInfo: this.provider.getProviderInfo()
    });
  }

  /**
   * Generate AI response from conversation messages
   * @param request Chat request with messages and optional configuration
   * @returns Service result with AI response or error details
   */
  async generateResponse(request: ChatRequest): Promise<ServiceResult<ChatResponse>> {
    try {
      // Validate input messages
      const validation = MessageMapper.validateMessages(request.messages);
      if (!validation.valid) {
        return {
          success: false,
          error: {
            code: 'INVALID_MESSAGES',
            message: 'Message validation failed',
            details: validation.issues
          }
        };
      }

      // Merge configuration
      const effectiveConfig = { ...this.defaultConfig, ...request.config };

      // Add artificial delay if configured (for testing/demo purposes)
      if (effectiveConfig.responseDelay && effectiveConfig.responseDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, effectiveConfig.responseDelay));
      }

      // Prepare AI context from messages
      const maxContext = request.maxContextMessages || 10;
      const aiMessages = MessageMapper.prepareAIContext(request.messages, maxContext);

      if (aiMessages.length === 0) {
        return {
          success: false,
          error: {
            code: 'NO_MESSAGES',
            message: 'No valid messages found for AI processing'
          }
        };
      }

      logger.chatService.info('Generating AI response', {
        messageCount: aiMessages.length,
        model: effectiveConfig.model,
        provider: effectiveConfig.provider,
        temperature: effectiveConfig.temperature
      });

      // Generate response using provider
      const responseContent = await this.provider.generateResponse(aiMessages, effectiveConfig);

      return {
        success: true,
        data: {
          content: responseContent,
          model: effectiveConfig.model,
          provider: effectiveConfig.provider
        }
      };

    } catch (error) {
      logger.chatService.error('Failed to generate AI response', error as Error, {
        messageCount: request.messages?.length,
        config: request.config
      });

      // Provide user-friendly error messages
      let errorMessage = 'Unknown AI service error';
      let errorCode = 'AI_SERVICE_ERROR';

      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.message.includes('Failed to connect')) {
          errorCode = 'BACKEND_CONNECTION_ERROR';
        } else if (error.message.includes('Backend API error')) {
          errorCode = 'BACKEND_API_ERROR';
        }
      }

      return {
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
          details: error instanceof Error ? error.stack : error
        }
      };
    }
  }

  /**
   * Check if the AI backend is available
   */
  async isBackendAvailable(): Promise<boolean> {
    try {
      return await this.provider.isAvailable();
    } catch (error) {
      logger.chatService.warn('Backend availability check failed', error as Error);
      return false;
    }
  }

  /**
   * Get current service configuration
   */
  getConfig(): AIServiceConfig {
    return { ...this.defaultConfig };
  }

  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<ChatServiceConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...newConfig };
    
    // Update provider configuration if backend URL changed
    if (newConfig.backendUrl && this.provider instanceof PythonBackendProvider) {
      this.provider.updateConfig({ baseUrl: newConfig.backendUrl });
    }
    
    logger.chatService.info('Chat service configuration updated', newConfig);
  }

  /**
   * Get provider information
   */
  getProviderInfo() {
    return this.provider.getProviderInfo();
  }

  /**
   * Test the backend connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const testRequest: ChatRequest = {
        messages: [{
          _id: 'test',
          content: 'Hello',
          sender: 'user',
          timestamp: new Date()
        }]
      };

      const result = await this.generateResponse(testRequest);
      return result.success;
    } catch (error) {
      logger.chatService.error('Connection test failed', error as Error);
      return false;
    }
  }
}

// Create and export a singleton instance
export const chatService = new ChatService(); 