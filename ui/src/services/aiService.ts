/**
 * AI Service
 * Handles AI response generation and related functionality
 */

import { GoogleGenAI } from '@google/genai';
import OpenAI from "openai";

export interface AIServiceConfig {
  responseDelay?: number;
  provider?: 'openai' | 'google';
  model?: string;
  apiKey?: string;
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
  store?: boolean;
}

class AIService {
  private config: AIServiceConfig;
  private genAI: GoogleGenAI | null = null;
  private openAI: OpenAI | null = null;

  constructor(config: AIServiceConfig = {}) {
    this.config = {
      responseDelay: 0,
      provider: 'google',
      model: 'gemini-2.0-flash-lite',
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 2048,
      store: true,
      ...config
    };
    
    this.initializeClients();
  }

  /**
   * Initialize AI clients based on provider
   * @private
   */
  private initializeClients(): void {
    if (this.config.provider === 'google') {
      this.initializeGenAI();
    } else if (this.config.provider === 'openai') {
      this.initializeOpenAI();
    }
  }

  /**
   * Initialize Google GenAI client
   * @private
   */
  private initializeGenAI(): void {
    const apiKey = this.config.apiKey || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY not found. AI service requires a valid API key to function.');
      return;
    }

    try {
      this.genAI = new GoogleGenAI({
        apiKey: apiKey,
      });
      console.log('✅ Gemini client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google GenAI:', error);
      this.genAI = null;
    }
  }

  /**
   * Initialize OpenAI client
   * @private
   */
  private initializeOpenAI(): void {
    const apiKey = this.config.apiKey || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('❌ OPENAI_API_KEY not found. AI service requires a valid API key to function.');
      return;
    }

    try {
      this.openAI = new OpenAI({
        apiKey: apiKey,
      });
      console.log('✅ OpenAI client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OpenAI:', error);
      this.openAI = null;
    }
  }

  /**
   * Generate AI response based on user message
   * @param userMessage - The user's input message
   * @param conversationContext - Optional conversation context for better responses
   * @param overrideConfig - Optional configuration overrides for this specific request
   * @returns Promise with AI generated response
   * @throws Error if no valid AI provider is available or configured
   */
  async getAIResponse(
    userMessage: string, 
    conversationContext?: string[], 
    overrideConfig?: Partial<AIServiceConfig>
  ): Promise<string> {
    const effectiveConfig = { ...this.config, ...overrideConfig };
    
    switch (effectiveConfig.provider) {
      case 'google':
        if (this.genAI) {
          return this.generateGeminiResponse(userMessage, conversationContext, overrideConfig);
        } else {
          const error = new Error('Gemini AI client is not available. Please check your GEMINI_API_KEY environment variable.');
          console.error('❌ AI Service Error:', error.message);
          throw error;
        }
      case 'openai':
        if (this.openAI) {
          return this.generateOpenAIResponse(userMessage, conversationContext, overrideConfig);
        } else {
          const error = new Error('OpenAI client is not available. Please check your OPENAI_API_KEY environment variable.');
          console.error('❌ AI Service Error:', error.message);
          throw error;
        }
      default:
        const error = new Error(`Unknown AI provider: ${effectiveConfig.provider}. Please use 'google' or 'openai'.`);
        console.error('❌ AI Service Error:', error.message);
        throw error;
    }
  }

  /**
   * Generate response using OpenAI
   * @param userMessage - The user's message
   * @param conversationContext - Previous messages for context
   * @param overrideConfig - Optional configuration overrides
   * @returns Promise with AI response
   * @throws Error if OpenAI API fails
   */
  private async generateOpenAIResponse(
    userMessage: string, 
    conversationContext?: string[], 
    overrideConfig?: Partial<AIServiceConfig>
  ): Promise<string> {
    try {
      if (!this.openAI) {
        throw new Error('OpenAI client not initialized');
      }

      // Merge current config with any overrides
      const effectiveConfig = { ...this.config, ...overrideConfig };

      // Build conversation messages for OpenAI format
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
      
      // Add conversation context if available
      if (conversationContext && conversationContext.length > 0) {
        conversationContext.forEach(contextMessage => {
          const [sender, content] = contextMessage.split(': ', 2);
          if (sender && content) {
            messages.push({
              role: sender === 'user' ? 'user' : 'assistant',
              content: content
            });
          }
        });
      }
      
      // Add current user message
      messages.push({
        role: 'user',
        content: userMessage
      });

      // Check if the model supports reasoning (o3, o1, etc.)
      const modelName = effectiveConfig.model || 'gpt-4.1';
      const isReasoningModel = modelName.includes('o1') || modelName.includes('o3');

      let response;

      if (isReasoningModel) {
        // Use reasoning endpoint for reasoning models
        response = await this.openAI.chat.completions.create({
          model: modelName,
          messages: messages,
          temperature: effectiveConfig.temperature || 1,
          max_completion_tokens: effectiveConfig.maxOutputTokens || 2048,
          top_p: effectiveConfig.topP || 1,
          store: effectiveConfig.store || true
        });
      } else {
        // Use standard chat completions for regular models
        response = await this.openAI.chat.completions.create({
          model: modelName,
          messages: messages,
          temperature: effectiveConfig.temperature || 0.7,
          max_tokens: effectiveConfig.maxOutputTokens || 2048,
          top_p: effectiveConfig.topP || 1,
        });
      }

      const content = response.choices[0]?.message?.content;
      if (!content?.trim()) {
        throw new Error('OpenAI returned an empty response');
      }
      return content.trim();
    } catch (error) {
      console.error('❌ Error generating OpenAI response:', error);
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate response using Gemini LLM
   * @param userMessage - The user's message
   * @param conversationContext - Previous messages for context
   * @param overrideConfig - Optional configuration overrides
   * @returns Promise with AI response
   * @throws Error if Gemini API fails
   */
  private async generateGeminiResponse(
    userMessage: string, 
    conversationContext?: string[], 
    overrideConfig?: Partial<AIServiceConfig>
  ): Promise<string> {
    try {
      if (!this.genAI) {
        throw new Error('Gemini client not initialized');
      }

      // Merge current config with any overrides
      const effectiveConfig = { ...this.config, ...overrideConfig };

      const config = {
        responseMimeType: 'text/plain',
        temperature: effectiveConfig.temperature || 0.7,
        topP: effectiveConfig.topP || 0.9,
      };

      // Build conversation context for better responses
      let contextPrompt = '';
      if (conversationContext && conversationContext.length > 0) {
        contextPrompt = 'Previous conversation context:\n' + conversationContext.join('\n') + '\n\n';
      }

      const fullPrompt = contextPrompt + 'User: ' + userMessage;

      const contents = [
        {
          role: 'user' as const,
          parts: [
            {
              text: fullPrompt,
            },
          ],
        },
      ];

      const response = await this.genAI.models.generateContentStream({
        model: effectiveConfig.model || 'gemini-2.0-flash-lite',
        config,
        contents,
      });

      // Accumulate the streaming response
      let fullResponse = '';
      for await (const chunk of response) {
        if (chunk.text) {
          fullResponse += chunk.text;
        }
      }

      if (!fullResponse.trim()) {
        throw new Error('Gemini returned an empty response');
      }
      return fullResponse.trim();
    } catch (error) {
      console.error('❌ Error generating Gemini response:', error);
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update AI service configuration
   * @param newConfig - New configuration options
   */
  updateConfig(newConfig: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize clients if API key or provider changed
    if (newConfig.apiKey || newConfig.provider) {
      this.initializeClients();
    }
  }

  /**
   * Get current configuration
   * @returns Current AI service configuration
   */
  getConfig(): AIServiceConfig {
    return { ...this.config };
  }

  /**
   * Check if Gemini is properly configured and available
   * @returns True if Gemini is available, false otherwise
   */
  isGeminiAvailable(): boolean {
    return this.genAI !== null && this.config.provider === 'google';
  }

  /**
   * Check if OpenAI is properly configured and available
   * @returns True if OpenAI is available, false otherwise
   */
  isOpenAIAvailable(): boolean {
    return this.openAI !== null && this.config.provider === 'openai';
  }

  /**
   * Check if the current provider is properly configured and available
   * @returns True if the current provider is available, false otherwise
   */
  isProviderAvailable(): boolean {
    switch (this.config.provider) {
      case 'google':
        return this.isGeminiAvailable();
      case 'openai':
        return this.isOpenAIAvailable();
      default:
        return false;
    }
  }
}

// Create and export a singleton instance
export const aiService = new AIService();

// Export the class for testing or custom instances
export default AIService; 