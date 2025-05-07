import { NextResponse } from 'next/server';
import defaultTranslations from '../../data/default-translations.json';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'en';
    
    // In a real application, you would fetch translations from a database
    // For now, we'll just return the default translations
    return NextResponse.json(defaultTranslations);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to read translations' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { path: translationPath, value, language } = await request.json();
    
    // In a real application, you would update translations in a database
    // For now, we'll just return success
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update translation' },
      { status: 500 }
    );
  }
} 