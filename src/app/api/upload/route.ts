import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Read the file content
    const content = await file.text();
    
    // Validate JSON
    try {
      JSON.parse(content);
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON file' },
        { status: 400 }
      );
    }

    // In a real application, you would save the translations to a database
    // For now, we'll just return success
    return NextResponse.json({ 
      languages: ['en', 'de', 'it', 'fr', 'es'],
      message: 'File validated successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 