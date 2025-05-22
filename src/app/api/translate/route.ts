import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Ініціалізуємо Gemini AI
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(request: Request) {
  try {
    const { text, targetLanguage } = await request.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: "Text and target language are required" },
        { status: 400 }
      );
    }

    const languages = [
      { code: "en", name: "English" },
      { code: "de", name: "German" },
      { code: "it", name: "Italian" },
      { code: "fr", name: "French" },
      { code: "es", name: "Spanish" },
      { code: "pl", name: "Polish" },
      { code: "sk", name: "Slovak" },
    ];

    const language = languages.find((lang) => lang.code === targetLanguage)?.name;

    // Формуємо промпт для перекладу
    const prompt = `Translate the following text to ${language} language. Keep the same meaning and tone. Only return the translation, without any additional text or explanations:\n\n${text}`;

    console.log("[AI TRANSLATE] Prompt:", prompt);

    // Отримуємо відповідь від AI
    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const translation = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return NextResponse.json({ translation });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { error: "Failed to translate text" },
      { status: 500 }
    );
  }
}
