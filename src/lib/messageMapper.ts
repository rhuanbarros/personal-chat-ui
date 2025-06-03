/**
 * Message Mapper Utility
 * Centralized conversion between different message formats
 * Eliminates fragile string parsing and role mapping scattered across the codebase
 */

import { Message, AIMessage } from '@/types';
import { logger } from './logger';

export class MessageMapper {
  /**
   * Convert internal Message objects to AI backend format
   * @param messages Array of internal Message objects
   * @returns Array of AIMessage objects for backend consumption
   */
  static toAIMessages(messages: Message[]): AIMessage[] {
    return messages.map(message => {
      // Determine role based on multiple fields for robustness
      let role: 'system' | 'user' | 'assistant';
      
      if (message.role) {
        // Prefer explicit role if set
        role = message.role;
      } else if (message.sender === 'ai') {
        role = 'assistant';
      } else if (message.sender === 'user') {
        role = 'user';
      } else {
        // Default fallback - should rarely happen
        logger.warn('Message with unknown sender/role, defaulting to user', {
          sender: message.sender,
          role: message.role,
          messageId: message._id
        });
        role = 'user';
      }

      return {
        role,
        content: message.content.trim()
      };
    });
  }

  /**
   * Filter and prepare messages for AI context
   * @param messages All conversation messages
   * @param maxContextMessages Maximum number of messages to include (default: 10)
   * @returns Filtered messages ready for AI consumption
   */
  static prepareAIContext(messages: Message[], maxContextMessages: number = 10): AIMessage[] {
    // Take the last N messages for context, preserving chronological order
    const contextMessages = messages.slice(-maxContextMessages);
    
    // Convert to AI format
    const aiMessages = this.toAIMessages(contextMessages);
    
    logger.chatService.debug('Prepared AI context', {
      totalMessages: messages.length,
      contextMessages: contextMessages.length,
      hasSystemMessages: aiMessages.some(m => m.role === 'system')
    });

    return aiMessages;
  }

  /**
   * Create a system message in the correct format
   * @param content System prompt content
   * @returns Message object with system role
   */
  static createSystemMessage(content: string): Message {
    return {
      sender: 'ai', // Use 'ai' sender but 'system' role for compatibility
      content: content.trim(),
      timestamp: new Date(),
      role: 'system'
    };
  }

  /**
   * Create a user message in the correct format
   * @param content User message content
   * @returns Message object with user role
   */
  static createUserMessage(content: string): Message {
    return {
      sender: 'user',
      content: content.trim(),
      timestamp: new Date(),
      role: 'user'
    };
  }

  /**
   * Create an AI assistant message in the correct format
   * @param content AI response content
   * @returns Message object with assistant role
   */
  static createAssistantMessage(content: string): Message {
    return {
      sender: 'ai',
      content: content.trim(),
      timestamp: new Date(),
      role: 'assistant'
    };
  }

  /**
   * Validate message array for common issues
   * @param messages Array to validate
   * @returns Validation result with any issues found
   */
  static validateMessages(messages: Message[]): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!Array.isArray(messages)) {
      issues.push('Messages must be an array');
      return { valid: false, issues };
    }

    messages.forEach((message, index) => {
      if (!message.content?.trim()) {
        issues.push(`Message at index ${index} has empty content`);
      }
      
      if (!message.sender && !message.role) {
        issues.push(`Message at index ${index} has no sender or role`);
      }

      if (!message.timestamp) {
        issues.push(`Message at index ${index} has no timestamp`);
      }
    });

    return { valid: issues.length === 0, issues };
  }
} 