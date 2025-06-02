import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SavedPrompt from '@/models/SavedPrompt';
import { createApiResponse, validateRequiredFields } from '@/lib/apiUtils';
import mongoose from 'mongoose';

// GET single saved prompt with all versions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        createApiResponse(false, undefined, 'Invalid prompt ID'),
        { status: 400 }
      );
    }

    const savedPrompt = await SavedPrompt.findById(id);
    
    if (!savedPrompt) {
      return NextResponse.json(
        createApiResponse(false, undefined, 'Prompt not found'),
        { status: 404 }
      );
    }

    // Sort versions by date (newest first)
    const sortedVersions = [...savedPrompt.versions].sort((a, b) => 
      new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
    );

    const response = {
      _id: savedPrompt._id,
      name: savedPrompt.name,
      versions: sortedVersions,
      createdAt: savedPrompt.createdAt,
      updatedAt: savedPrompt.updatedAt
    };

    return NextResponse.json(createApiResponse(true, response));
  } catch (error) {
    console.error('Error fetching saved prompt:', error);
    return NextResponse.json(
      createApiResponse(false, undefined, 'Failed to fetch saved prompt'),
      { status: 500 }
    );
  }
}

// PUT update prompt (either update name or add new version)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        createApiResponse(false, undefined, 'Invalid prompt ID'),
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, text, addVersion } = body;

    const savedPrompt = await SavedPrompt.findById(id);
    
    if (!savedPrompt) {
      return NextResponse.json(
        createApiResponse(false, undefined, 'Prompt not found'),
        { status: 404 }
      );
    }

    // If addVersion is true, add a new version
    if (addVersion && text) {
      savedPrompt.versions.push({
        text: text.trim(),
        dateCreated: new Date()
      });
    }

    // Update name if provided
    if (name) {
      savedPrompt.name = name.trim();
    }

    await savedPrompt.save();

    return NextResponse.json(createApiResponse(true, savedPrompt));
  } catch (error) {
    console.error('Error updating saved prompt:', error);
    return NextResponse.json(
      createApiResponse(false, undefined, 'Failed to update saved prompt'),
      { status: 500 }
    );
  }
}

// DELETE saved prompt
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        createApiResponse(false, undefined, 'Invalid prompt ID'),
        { status: 400 }
      );
    }

    const savedPrompt = await SavedPrompt.findByIdAndDelete(id);
    
    if (!savedPrompt) {
      return NextResponse.json(
        createApiResponse(false, undefined, 'Prompt not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      createApiResponse(true, { message: 'Prompt deleted successfully' })
    );
  } catch (error) {
    console.error('Error deleting saved prompt:', error);
    return NextResponse.json(
      createApiResponse(false, undefined, 'Failed to delete saved prompt'),
      { status: 500 }
    );
  }
} 