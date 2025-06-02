import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import { createApiResponse, validateRequiredFields } from '@/lib/apiUtils';

// GET specific conversation by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const conversation = await Conversation.findById(params.id).lean();
    
    if (!conversation) {
      return NextResponse.json(
        createApiResponse(false, undefined, 'Conversation not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(createApiResponse(true, conversation));
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      createApiResponse(false, undefined, 'Failed to fetch conversation'),
      { status: 500 }
    );
  }
}

// PUT update conversation
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { title } = body;

    const missingFields = validateRequiredFields(body, ['title']);
    if (missingFields.length > 0) {
      return NextResponse.json(
        createApiResponse(false, undefined, `Missing required fields: ${missingFields.join(', ')}`),
        { status: 400 }
      );
    }

    const conversation = await Conversation.findByIdAndUpdate(
      params.id,
      { 
        title,
        updatedAt: new Date()
      },
      { new: true }
    ).lean();

    if (!conversation) {
      return NextResponse.json(
        createApiResponse(false, undefined, 'Conversation not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(createApiResponse(true, conversation));
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json(
      createApiResponse(false, undefined, 'Failed to update conversation'),
      { status: 500 }
    );
  }
}

// DELETE conversation (optional for now)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const conversation = await Conversation.findByIdAndDelete(params.id);

    if (!conversation) {
      return NextResponse.json(
        createApiResponse(false, undefined, 'Conversation not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(createApiResponse(true, { message: 'Conversation deleted successfully' }));
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      createApiResponse(false, undefined, 'Failed to delete conversation'),
      { status: 500 }
    );
  }
} 