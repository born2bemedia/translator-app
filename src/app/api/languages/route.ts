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

export async function GET() {
  try {
    await ensureTranslationsDir();
    const files = await fs.readdir(TRANSLATIONS_DIR);
    const languageFiles = files.filter(file => file.endsWith('.json'));
    const languages = languageFiles.map(file => file.replace('.json', ''));
    
    return NextResponse.json({ languages });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to read languages' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureTranslationsDir();
    const { language } = await request.json();
    
    // Check if language file already exists
    const filePath = path.join(TRANSLATIONS_DIR, `${language}.json`);
    try {
      await fs.access(filePath);
      return NextResponse.json(
        { error: 'Language file already exists' },
        { status: 400 }
      );
    } catch {
      // File doesn't exist, proceed with creation
    }
    
    // Read the English file as a template
    const enFilePath = path.join(TRANSLATIONS_DIR, 'en.json');
    const enContent = await fs.readFile(enFilePath, 'utf-8');
    
    // Create new language file
    await fs.writeFile(filePath, enContent, 'utf-8');
    
    // Get updated list of languages
    const files = await fs.readdir(TRANSLATIONS_DIR);
    const languageFiles = files.filter(file => file.endsWith('.json'));
    const languages = languageFiles.map(file => file.replace('.json', ''));
    
    return NextResponse.json({ languages });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add language' },
      { status: 500 }
    );
  }
} 