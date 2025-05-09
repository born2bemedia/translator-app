import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Ініціалізуємо Gemini AI
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(request: Request) {
  try {
    const { text, targetLanguage } = await request.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Text and target language are required' },
        { status: 400 }
      );
    }

    // Формуємо промпт для перекладу
    const prompt = `Translate the following text to ${targetLanguage}. Keep the same meaning and tone. Only return the translation, without any additional text or explanations:\n\n${text}`;

    // Отримуємо відповідь від AI
    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    const translation = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return NextResponse.json({ translation });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Failed to translate text' },
      { status: 500 }
    );
  }
} 