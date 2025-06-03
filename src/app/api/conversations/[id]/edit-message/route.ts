import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import { Message, ChatRequest, AIServiceConfig } from '@/types';
import { chatService } from '@/services/chatService';
import { MessageMapper } from '@/lib/messageMapper';
import { createApiResponse, validateRequiredFields } from '@/lib/apiUtils';
import { logger } from '@/lib/logger';

// PUT edit message in conversation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let conversationId: string | undefined;
  
  try {
    await dbConnect();
    
    const { id } = await params;
    conversationId = id;
    const body = await request.json();
    const { messageIndex, newContent, modelConfig, systemPrompt } = body;

    const missingFields = validateRequiredFields(body, ['messageIndex', 'newContent']);
    if (missingFields.length > 0) {
      return NextResponse.json(
        createApiResponse(false, undefined, `Missing required fields: ${missingFields.join(', ')}`),
        { status: 400 }
      );
    }

    const conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      return NextResponse.json(
        createApiResponse(false, undefined, 'Conversation not found'),
        { status: 404 }
      );
    }

    // Filter out system messages to get user-visible messages
    const visibleMessages = conversation.messages.filter((m: Message) => m.role !== 'system');
    
    if (messageIndex < 0 || messageIndex >= visibleMessages.length) {
      return NextResponse.json(
        createApiResponse(false, undefined, 'Invalid message index'),
        { status: 400 }
      );
    }

    // Check if the message to edit is a user message
    const messageToEdit = visibleMessages[messageIndex];
    if (messageToEdit.sender !== 'user') {
      return NextResponse.json(
        createApiResponse(false, undefined, 'Can only edit user messages'),
        { status: 400 }
      );
    }

    logger.api.info('Processing message edit request', {
      conversationId,
      messageIndex,
      originalContent: messageToEdit.content,
      newContentLength: newContent.length,
      hasSystemPrompt: !!systemPrompt,
      hasModelConfig: !!modelConfig
    });

    // Handle system prompt logic (add, replace, or remove)
    if (typeof systemPrompt === 'string') {
      const existingSystemIndex = conversation.messages.findIndex((m: Message) => m.role === 'system');

      if (systemPrompt.trim() === '') {
        // Remove existing system prompt if present
        if (existingSystemIndex !== -1) {
          logger.api.debug('Removing existing system prompt from conversation');
          conversation.messages.splice(existingSystemIndex, 1);
        }
      } else {
        const newSystemMessage = MessageMapper.createSystemMessage(systemPrompt);

        if (existingSystemIndex !== -1) {
          // Replace the existing system prompt
          logger.api.debug('Replacing existing system prompt');
          conversation.messages[existingSystemIndex] = newSystemMessage;
        } else {
          // Insert new system prompt at the beginning
          logger.api.debug('Adding new system prompt to conversation');
          conversation.messages.unshift(newSystemMessage);
        }
      }
    }

    // Find the actual index of the message to edit in the full messages array
    const allMessages = conversation.messages;
    let actualMessageIndex = -1;
    let visibleCount = 0;
    
    for (let i = 0; i < allMessages.length; i++) {
      if (allMessages[i].role !== 'system') {
        if (visibleCount === messageIndex) {
          actualMessageIndex = i;
          break;
        }
        visibleCount++;
      }
    }

    if (actualMessageIndex === -1) {
      return NextResponse.json(
        createApiResponse(false, undefined, 'Message not found'),
        { status: 404 }
      );
    }

    // Update the message content
    conversation.messages[actualMessageIndex].content = newContent.trim();
    conversation.messages[actualMessageIndex].timestamp = new Date();

    // Remove all messages after the edited message
    conversation.messages = conversation.messages.slice(0, actualMessageIndex + 1);
    conversation.updatedAt = new Date();

    // Generate new AI response
    try {
      // Prepare chat request with the conversation history up to the edited message
      const chatRequest: ChatRequest = {
        messages: conversation.messages,
        maxContextMessages: 10,
        config: modelConfig ? mapModelConfigToAI(modelConfig) : undefined
      };

      logger.api.debug('Generating AI response for edited message', {
        totalMessages: conversation.messages.length,
        contextMessages: Math.min(10, conversation.messages.length),
        model: chatRequest.config?.model,
        provider: chatRequest.config?.provider
      });

      // Generate AI response using the ChatService
      const result = await chatService.generateResponse(chatRequest);

      if (result.success && result.data) {
        // Create and add AI assistant message
        const aiMessage = MessageMapper.createAssistantMessage(result.data.content);
        conversation.messages.push(aiMessage);

        logger.api.info('AI response generated successfully for edited message', {
          responseLength: result.data.content.length,
          model: result.data.model,
          provider: result.data.provider
        });
      } else {
        // Handle AI service error
        const errorMessage = result.error?.message || 'Unknown AI service error';
        logger.api.error('AI service failed to generate response for edited message', result.error);
        
        const errorResponse = MessageMapper.createAssistantMessage(
          `❌ **AI Error**: ${errorMessage}`
        );
        conversation.messages.push(errorResponse);
      }

    } catch (error) {
      logger.api.error('Unexpected error during AI response generation for edited message', error);
      
      const errorResponse = MessageMapper.createAssistantMessage(
        `❌ **Unexpected Error**: Failed to generate AI response. Please try again.`
      );
      conversation.messages.push(errorResponse);
    }

    // Save the updated conversation
    await conversation.save();

    logger.api.info('Message edit processing completed', {
      conversationId,
      totalMessages: conversation.messages.length
    });

    return NextResponse.json(createApiResponse(true, conversation));

  } catch (error) {
    // Handle logging with conditional context
    if (conversationId) {
      logger.api.error('Failed to process message edit request', error, { conversationId });
    } else {
      logger.api.error('Failed to process message edit request', error);
    }
    
    return NextResponse.json(
      createApiResponse(false, undefined, `Failed to edit message: ${error instanceof Error ? error.message : 'Unknown error'}`),
      { status: 500 }
    );
  }
}

/**
 * Convert ModelConfiguration to AIServiceConfig
 * @param modelConfig Frontend model configuration
 * @returns AI service configuration
 */
function mapModelConfigToAI(modelConfig: any): Partial<AIServiceConfig> {
  return {
    provider: modelConfig.provider,
    model: modelConfig.modelName,
    temperature: modelConfig.temperature,
    topP: modelConfig.topP,
  };
} 