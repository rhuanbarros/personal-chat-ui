/**
 * Conversation Service
 * Handles all conversation-related API operations and business logic
 */

import { Conversation, Message, ApiResponse } from '@/types';
import { apiFetch, ApiError } from '@/lib/apiUtils';
import { ModelConfiguration } from '@/types';

export interface SendMessageOptions {
  modelConfig?: ModelConfiguration;
}

export interface PaginationMetadata {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasMore: boolean;
  limit: number;
}

export interface PaginatedConversations {
  conversations: Conversation[];
  pagination: PaginationMetadata;
}

class ConversationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/conversations';
  }

  /**
   * Fetch all conversations (without pagination - for backward compatibility)
   * @returns Promise with array of conversations
   */
  async fetchConversations(): Promise<Conversation[]> {
    try {
      const response = await apiFetch<PaginatedConversations>(this.baseUrl);
      return response.data?.conversations || [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  /**
   * Fetch conversations with pagination
   * @param page - Page number (1-based)
   * @param limit - Number of conversations per page
   * @returns Promise with paginated conversations and metadata
   */
  async fetchConversationsPaginated(page: number = 1, limit: number = 20): Promise<PaginatedConversations> {
    try {
      const url = `${this.baseUrl}?page=${page}&limit=${limit}`;
      const response = await apiFetch<PaginatedConversations>(url);
      
      if (!response.data) {
        throw new ApiError('No conversation data returned');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching paginated conversations:', error);
      throw error;
    }
  }

  /**
   * Create a new conversation
   * @param title - Optional title for the conversation
   * @returns Promise with the created conversation
   */
  async createConversation(title?: string): Promise<Conversation> {
    try {
      const response = await apiFetch<Conversation>(this.baseUrl, {
        method: 'POST',
        body: JSON.stringify({
          title: title || `New Conversation - ${new Date().toLocaleDateString()}`
        }),
      });

      if (!response.data) {
        throw new ApiError('No conversation data returned');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Fetch a specific conversation by ID
   * @param conversationId - The conversation ID
   * @returns Promise with the conversation data
   */
  async fetchConversation(conversationId: string): Promise<Conversation> {
    try {
      const response = await apiFetch<Conversation>(`${this.baseUrl}/${conversationId}`);
      
      if (!response.data) {
        throw new ApiError('No conversation data returned');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  }

  /**
   * Update a conversation's title
   * @param conversationId - The conversation ID
   * @param newTitle - The new title
   * @returns Promise with the updated conversation
   */
  async updateConversationTitle(conversationId: string, newTitle: string): Promise<Conversation> {
    try {
      const response = await apiFetch<Conversation>(`${this.baseUrl}/${conversationId}`, {
        method: 'PUT',
        body: JSON.stringify({ title: newTitle }),
      });

      if (!response.data) {
        throw new ApiError('No conversation data returned');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error updating conversation title:', error);
      throw error;
    }
  }

  /**
   * Send a message to a conversation
   * @param conversationId - The conversation ID
   * @param content - The message content
   * @param sender - The message sender ('user' or 'ai')
   * @param options - Additional options including model configuration
   * @returns Promise with the updated conversation including the new message
   */
  async sendMessage(
    conversationId: string, 
    content: string, 
    sender: 'user' | 'ai' = 'user',
    options?: SendMessageOptions
  ): Promise<Conversation> {
    try {
      const requestBody: any = {
        content,
        sender
      };

      // Include model configuration if provided
      if (options?.modelConfig) {
        requestBody.modelConfig = options.modelConfig;
      }

      const response = await apiFetch<Conversation>(`${this.baseUrl}/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      if (!response.data) {
        throw new ApiError('No conversation data returned');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Delete a conversation
   * @param conversationId - The conversation ID
   * @returns Promise indicating success
   */
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      await apiFetch(`${this.baseUrl}/${conversationId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  /**
   * Sort conversations by update time (most recent first)
   * @param conversations - Array of conversations to sort
   * @returns Sorted array of conversations
   */
  sortConversationsByDate(conversations: Conversation[]): Conversation[] {
    return [...conversations].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  /**
   * Get conversation preview (title and last message)
   * @param conversation - The conversation object
   * @returns Object with title and preview text
   */
  getConversationPreview(conversation: Conversation): { title: string; preview: string; lastUpdated: Date } {
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const preview = lastMessage 
      ? `${lastMessage.sender === 'user' ? 'You' : 'AI'}: ${lastMessage.content.substring(0, 50)}${lastMessage.content.length > 50 ? '...' : ''}`
      : 'No messages yet';

    return {
      title: conversation.title,
      preview,
      lastUpdated: conversation.updatedAt
    };
  }
}

// Create and export a singleton instance
export const conversationService = new ConversationService();

// Export the class for testing or custom instances
export default ConversationService; 