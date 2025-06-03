/**
 * Chat Service
 * High-level service for AI chat interactions with proper separation of concerns
 * Handles message validation, context preparation, and AI service coordination
 */

import { 
  Message, 
  AIMessage, 
  ChatRequest, 
  ChatResponse, 
  ServiceResult, 
  AIServiceConfig 
} from '@/types';
import { MessageMapper } from '@/lib/messageMapper';
import { logger } from '@/lib/logger';

// AI Provider interface for future extensibility
interface AIProvider {
  generateResponse(messages: AIMessage[], config: AIServiceConfig): Promise<string>;
  isAvailable(): Promise<boolean>;
  getBackendUrl(): string;
}

// Backend request/response interfaces
interface InvokeRequest {
  messages: AIMessage[];
  temperature?: number;
  top_p?: number;
  model_name?: string;
  model_provider?: string;
}

interface InvokeResponse {
  response: string;
}

class PythonBackendProvider implements AIProvider {
  private backendUrl: string;

  constructor(backendUrl?: string) {
    this.backendUrl = backendUrl || process.env.AI_BACKEND || 'http://localhost:8000';
    logger.aiService.info('Python backend provider initialized', { backendUrl: this.backendUrl });
  }

  async generateResponse(messages: AIMessage[], config: AIServiceConfig): Promise<string> {
    const requestPayload: InvokeRequest = {
      messages,
      temperature: config.temperature,
      top_p: config.topP,
      model_name: config.model,
      model_provider: config.provider
    };

    logger.aiService.debug('Calling Python backend', {
      url: `${this.backendUrl}/invoke_agent`,
      messageCount: messages.length,
      model: config.model,
      provider: config.provider
    });

    // Add artificial delay if configured (for testing/demo purposes)
    if (config.responseDelay && config.responseDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, config.responseDelay));
    }

    const response = await fetch(`${this.backendUrl}/invoke_agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend API error (${response.status}): ${errorText}`);
    }

    const data: InvokeResponse = await response.json();
    
    if (!data.response?.trim()) {
      throw new Error('Backend returned an empty response');
    }

    logger.aiService.info('Received response from Python backend', {
      responseLength: data.response.length
    });

    return data.response.trim();
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Use AbortController for timeout instead of fetch timeout property
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.backendUrl}/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  getBackendUrl(): string {
    return this.backendUrl;
  }
}

export class ChatService {
  private provider: AIProvider;
  private defaultConfig: AIServiceConfig;

  constructor(config: AIServiceConfig = {}) {
    this.defaultConfig = {
      responseDelay: 0,
      provider: 'google',
      model: 'gemini-2.0-flash',
      temperature: 0.7,
      topP: 1.0,
      maxOutputTokens: 2048,
      ...config
    };

    this.provider = new PythonBackendProvider(config.backendUrl);
    
    logger.chatService.info('Chat service initialized', {
      model: this.defaultConfig.model,
      provider: this.defaultConfig.provider
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
      logger.chatService.error('Failed to generate AI response', error, {
        messageCount: request.messages?.length,
        config: request.config
      });

      // Provide user-friendly error messages
      let errorMessage = 'Unknown AI service error';
      let errorCode = 'AI_SERVICE_ERROR';

      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = `Failed to connect to AI backend at ${this.provider.getBackendUrl()}. Please check if the backend is running.`;
        errorCode = 'BACKEND_CONNECTION_ERROR';
      } else if (error instanceof Error) {
        errorMessage = error.message;
        if (error.message.includes('Backend API error')) {
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
   * @returns Promise resolving to backend availability status
   */
  async isBackendAvailable(): Promise<boolean> {
    return this.provider.isAvailable();
  }

  /**
   * Get current configuration
   * @returns Current service configuration
   */
  getConfig(): AIServiceConfig {
    return { ...this.defaultConfig };
  }

  /**
   * Update service configuration
   * @param newConfig Partial configuration to merge
   */
  updateConfig(newConfig: Partial<AIServiceConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...newConfig };
    
    // Recreate provider if backend URL changed
    if (newConfig.backendUrl) {
      this.provider = new PythonBackendProvider(newConfig.backendUrl);
      logger.chatService.info('Backend URL updated', { backendUrl: newConfig.backendUrl });
    }
  }
}

// Export singleton instance
export const chatService = new ChatService(); 