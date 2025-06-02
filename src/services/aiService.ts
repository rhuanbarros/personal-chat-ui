/**
 * AI Service
 * Handles AI response generation by calling the Python backend API
 */

export interface AIServiceConfig {
  responseDelay?: number;
  provider?: 'openai' | 'google';
  model?: string;
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
  backendUrl?: string;
}

interface InvokeRequest {
  messages: Array<{ [key: string]: any }>;
  temperature?: number;
  top_p?: number;
  model_name?: string;
  model_provider?: string;
}

interface InvokeResponse {
  response: string;
}

class AIService {
  private config: AIServiceConfig;
  private backendUrl: string;

  constructor(config: AIServiceConfig = {}) {
    this.config = {
      responseDelay: 0,
      provider: 'google',
      model: 'gemini-2.0-flash',
      temperature: 0.7,
      topP: 1.0,
      maxOutputTokens: 2048,
      ...config
    };
    
    // Get backend URL from environment variable or config
    this.backendUrl = this.config.backendUrl || process.env.AI_BACKEND || 'http://localhost:8000';
    
    console.log('✅ AI Service initialized with backend URL:', this.backendUrl);
  }

  /**
   * Generate AI response by calling the Python backend API
   * @param userMessage - The user's input message
   * @param conversationContext - Optional conversation context for better responses
   * @param overrideConfig - Optional configuration overrides for this specific request
   * @returns Promise with AI generated response
   * @throws Error if the backend API fails
   */
  async getAIResponse(
    userMessage: string, 
    conversationContext?: string[], 
    overrideConfig?: Partial<AIServiceConfig>
  ): Promise<string> {
    try {
      const effectiveConfig = { ...this.config, ...overrideConfig };
      
      // Convert conversation context to messages format
      const messages = this.buildMessagesArray(userMessage, conversationContext);
      
      // Prepare request payload
      const requestPayload: InvokeRequest = {
        messages,
        temperature: effectiveConfig.temperature,
        top_p: effectiveConfig.topP,
        model_name: effectiveConfig.model,
        model_provider: effectiveConfig.provider
      };

      console.log('🚀 Calling AI backend with:', {
        url: `${this.backendUrl}/invoke_agent`,
        model: requestPayload.model_name,
        provider: requestPayload.model_provider
      });

      // Add artificial delay if configured
      if (effectiveConfig.responseDelay && effectiveConfig.responseDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, effectiveConfig.responseDelay));
      }

      // Make HTTP request to Python backend
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

      console.log('✅ Received response from AI backend');
      return data.response.trim();

    } catch (error) {
      console.error('❌ Error calling AI backend:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Failed to connect to AI backend at ${this.backendUrl}. Please check if the backend is running and the AI_BACKEND environment variable is set correctly.`);
      }
      
      throw new Error(`AI backend error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build messages array from user message and conversation context
   * @param userMessage - Current user message
   * @param conversationContext - Previous conversation messages  
   * @returns Array of message objects
   */
  private buildMessagesArray(userMessage: string, conversationContext?: string[]): Array<{ [key: string]: any }> {
    const messages: Array<{ [key: string]: any }> = [];
    
    // Add conversation context if available
    if (conversationContext && conversationContext.length > 0) {
      conversationContext.forEach(contextMessage => {
        // Enhanced parsing to handle role-based messages
        if (contextMessage.startsWith('system: ')) {
          messages.push({
            role: 'system',
            content: contextMessage.substring(8).trim()
          });
        } else {
          const [sender, content] = contextMessage.split(': ', 2);
          if (sender && content) {
            let role = 'user';
            if (sender === 'ai') {
              role = 'assistant';
            } else if (sender === 'system') {
              role = 'system';
            }
            
            messages.push({
              role: role,
              content: content.trim()
            });
          }
        }
      });
    }
    
    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage
    });

    return messages;
  }

  /**
   * Update AI service configuration
   * @param newConfig - New configuration options
   */
  updateConfig(newConfig: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update backend URL if provided
    if (newConfig.backendUrl) {
      this.backendUrl = newConfig.backendUrl;
      console.log('🔄 Backend URL updated to:', this.backendUrl);
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
   * Get the current backend URL
   * @returns The backend URL being used
   */
  getBackendUrl(): string {
    return this.backendUrl;
  }

  /**
   * Check if the backend is available by making a health check
   * @returns Promise that resolves to true if backend is available
   */
  async isBackendAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.backendUrl}/health`, {
        method: 'GET',
        timeout: 5000
      } as RequestInit);
      return response.ok;
    } catch (error) {
      console.warn('⚠️ Backend health check failed:', error);
      return false;
    }
  }

  /**
   * Test the backend connection with a simple request
   * @returns Promise that resolves to true if connection is successful
   */
  async testConnection(): Promise<boolean> {
    try {
      const testMessage = "Hello";
      await this.getAIResponse(testMessage);
      return true;
    } catch (error) {
      console.error('❌ Backend connection test failed:', error);
      return false;
    }
  }
}

// Create and export a singleton instance
export const aiService = new AIService();

// Export the class for testing or custom instances
export default AIService; 