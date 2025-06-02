import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import { Message } from '@/types';
import { aiService, AIServiceConfig } from '@/services/aiService';
import { createApiResponse, validateRequiredFields } from '@/lib/apiUtils';

// POST add message to conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    const body = await request.json();
    const { content, sender, modelConfig } = body;

    const missingFields = validateRequiredFields(body, ['content', 'sender']);
    if (missingFields.length > 0) {
      return NextResponse.json(
        createApiResponse(false, undefined, `Missing required fields: ${missingFields.join(', ')}`),
        { status: 400 }
      );
    }

    const conversation = await Conversation.findById(id);
    
    if (!conversation) {
      return NextResponse.json(
        createApiResponse(false, undefined, 'Conversation not found'),
        { status: 404 }
      );
    }

    // Add user message
    const userMessage = {
      sender,
      content,
      timestamp: new Date(),
      role: sender === 'user' ? 'user' : (sender === 'ai' ? 'assistant' : undefined)
    };

    conversation.messages.push(userMessage);
    conversation.updatedAt = new Date();

    // If it's a user message, generate AI response
    if (sender === 'user') {
      try {
        // Get conversation context for better AI responses
        const conversationContext = conversation.messages
          .slice(-10) // Get last 10 messages for context (increased to include more context)
          .map((msg: Message) => {
            // Handle system messages properly
            if (msg.role === 'system') {
              return `system: ${msg.content}`;
            }
            return `${msg.sender}: ${msg.content}`;
          });
        
        // Prepare AI service configuration override if provided
        let aiConfigOverride: Partial<AIServiceConfig> | undefined;
        if (modelConfig) {
          aiConfigOverride = {
            provider: modelConfig.provider,
            model: modelConfig.modelName,
            temperature: modelConfig.temperature,
            topP: modelConfig.topP,
          };
          console.log('🤖 Using model configuration:', aiConfigOverride);
        }
        
        const aiResponse = await aiService.getAIResponse(content, conversationContext, aiConfigOverride);
        const aiMessage = {
          sender: 'ai' as const,
          content: aiResponse,
          timestamp: new Date(),
          role: 'assistant' as const
        };
        conversation.messages.push(aiMessage);
      } catch (aiError) {
        console.error('❌ AI Service Error:', aiError);
        
        // Add an error message from the AI
        const errorMessage = {
          sender: 'ai' as const,
          content: `❌ **AI Error**: ${aiError instanceof Error ? aiError.message : 'Unknown AI service error'}`,
          timestamp: new Date(),
          role: 'assistant' as const
        };
        conversation.messages.push(errorMessage);
      }
    }

    await conversation.save();

    return NextResponse.json(createApiResponse(true, conversation));
  } catch (error) {
    console.error('❌ Error adding message:', error);
    return NextResponse.json(
      createApiResponse(false, undefined, `Failed to add message: ${error instanceof Error ? error.message : 'Unknown error'}`),
      { status: 500 }
    );
  }
} 