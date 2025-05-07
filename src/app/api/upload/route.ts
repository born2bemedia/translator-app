import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const TRANSLATIONS_DIR = path.join(process.cwd(), 'translations');

// Ensure translations directory exists
async function ensureTranslationsDir() {
  try {
    await fs.access(TRANSLATIONS_DIR);
  } catch {
    await fs.mkdir(TRANSLATIONS_DIR, { recursive: true });
  }
}

export async function POST(request: Request) {
  try {
    await ensureTranslationsDir();
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

    // Save as en.json
    const filePath = path.join(TRANSLATIONS_DIR, 'en.json');
    await fs.writeFile(filePath, content, 'utf-8');
    
    // Get list of available languages
    const files = await fs.readdir(TRANSLATIONS_DIR);
    const languageFiles = files.filter(file => file.endsWith('.json'));
    const languages = languageFiles.map(file => file.replace('.json', ''));
    
    return NextResponse.json({ languages });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 