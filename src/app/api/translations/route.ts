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

export async function GET(request: Request) {
  try {
    await ensureTranslationsDir();
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'en';
    
    const filePath = path.join(TRANSLATIONS_DIR, `${language}.json`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const translations = JSON.parse(fileContent);
    
    return NextResponse.json(translations);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to read translations' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await ensureTranslationsDir();
    const { path: translationPath, value, language } = await request.json();
    
    const filePath = path.join(TRANSLATIONS_DIR, `${language}.json`);
    
    // Read current translations
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const translations = JSON.parse(fileContent);
    
    // Update the translation at the specified path
    let current = translations;
    for (let i = 0; i < translationPath.length - 1; i++) {
      current = current[translationPath[i]];
    }
    current[translationPath[translationPath.length - 1]] = value;
    
    // Write back to file
    await fs.writeFile(
      filePath,
      JSON.stringify(translations, null, 2),
      'utf-8'
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update translation' },
      { status: 500 }
    );
  }
} 