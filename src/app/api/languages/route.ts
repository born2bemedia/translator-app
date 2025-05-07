import { NextResponse } from 'next/server';

const SUPPORTED_LANGUAGES = ['en', 'de', 'it', 'fr', 'es'];

export async function GET() {
  try {
    return NextResponse.json({ languages: SUPPORTED_LANGUAGES });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to read languages' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { language } = await request.json();
    
    if (!SUPPORTED_LANGUAGES.includes(language)) {
      return NextResponse.json(
        { error: 'Unsupported language' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ languages: SUPPORTED_LANGUAGES });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add language' },
      { status: 500 }
    );
  }
} 