import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SavedPrompt, { IPromptVersion } from '@/models/SavedPrompt';
import { createApiResponse, validateRequiredFields } from '@/lib/apiUtils';

// GET all saved prompts with pagination support
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Get total count for pagination metadata
    const totalCount = await SavedPrompt.countDocuments({});
    
    // Fetch saved prompts with pagination
    const savedPrompts = await SavedPrompt.find({})
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Transform data to include only the latest version for display
    const transformedPrompts = savedPrompts.map(prompt => {
      const latestVersion = prompt.versions.length > 0 
        ? prompt.versions.sort((a: IPromptVersion, b: IPromptVersion) => 
            new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
          )[0]
        : null;
      
      return {
        _id: prompt._id,
        name: prompt.name,
        latestVersion,
        versionsCount: prompt.versions.length,
        createdAt: prompt.createdAt,
        updatedAt: prompt.updatedAt
      };
    });

    const hasMore = skip + savedPrompts.length < totalCount;
    const totalPages = Math.ceil(totalCount / limit);

    const paginationData = {
      savedPrompts: transformedPrompts,
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
    console.error('Error fetching saved prompts:', error);
    return NextResponse.json(
      createApiResponse(false, undefined, 'Failed to fetch saved prompts'),
      { status: 500 }
    );
  }
}

// POST create new saved prompt
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { name, text } = body;

    // Validate required fields
    const missingFields = validateRequiredFields(body, ['name', 'text']);
    if (missingFields.length > 0) {
      return NextResponse.json(
        createApiResponse(false, undefined, `Missing required fields: ${missingFields.join(', ')}`),
        { status: 400 }
      );
    }

    const savedPrompt = new SavedPrompt({
      name: name.trim(),
      versions: [{
        text: text.trim(),
        dateCreated: new Date()
      }]
    });

    await savedPrompt.save();

    return NextResponse.json(
      createApiResponse(true, savedPrompt),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating saved prompt:', error);
    return NextResponse.json(
      createApiResponse(false, undefined, 'Failed to create saved prompt'),
      { status: 500 }
    );
  }
} 