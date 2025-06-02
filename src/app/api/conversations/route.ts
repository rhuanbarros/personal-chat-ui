import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import { createApiResponse, validateRequiredFields } from '@/lib/apiUtils';

// GET all conversations with pagination support
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Get total count for pagination metadata
    const totalCount = await Conversation.countDocuments({});
    
    // Fetch conversations with pagination
    const conversations = await Conversation.find({})
      .sort({ updatedAt: -1 })
      .select('title createdAt updatedAt')
      .skip(skip)
      .limit(limit)
      .lean();

    const hasMore = skip + conversations.length < totalCount;
    const totalPages = Math.ceil(totalCount / limit);

    const paginationData = {
      conversations,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasMore,
        limit
      }
    };

    return NextResponse.json(createApiResponse(true, paginationData));
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      createApiResponse(false, undefined, 'Failed to fetch conversations'),
      { status: 500 }
    );
  }
}

// POST create new conversation
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { title } = body;

    const conversation = new Conversation({
      title: title || `New Conversation - ${new Date().toLocaleDateString()}`
    });

    await conversation.save();

    return NextResponse.json(
      createApiResponse(true, conversation),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      createApiResponse(false, undefined, 'Failed to create conversation'),
      { status: 500 }
    );
  }
} 