import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { projectId: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language');
    if (!language) {
      return NextResponse.json({ error: 'Language is required' }, { status: 400 });
    }
    const translation = await prisma.translation.findUnique({
      where: {
        projectId_language: {
          projectId: params.projectId,
          language,
        },
      },
    });
    if (!translation) {
      return NextResponse.json({ error: 'Translation not found' }, { status: 404 });
    }
    return NextResponse.json({ translation });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch translation' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { projectId: string } }) {
  try {
    const { language, json } = await request.json();
    if (!language || !json) {
      return NextResponse.json({ error: 'Language and json are required' }, { status: 400 });
    }
    const translation = await prisma.translation.upsert({
      where: {
        projectId_language: {
          projectId: params.projectId,
          language,
        },
      },
      update: { json },
      create: {
        projectId: params.projectId,
        language,
        json,
      },
    });
    return NextResponse.json({ translation });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update translation' }, { status: 500 });
  }
} 