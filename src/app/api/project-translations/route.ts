import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const language = searchParams.get('language');
  if (!id || !language) return NextResponse.json({ error: 'No id or language' }, { status: 400 });
  const translation = await prisma.translation.findUnique({
    where: { projectId_language: { projectId: id, language } },
  });
  if (!translation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ translation });
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'No id' }, { status: 400 });
  const { language, json } = await request.json();
  if (!language || !json) return NextResponse.json({ error: 'No language or json' }, { status: 400 });
  const translation = await prisma.translation.upsert({
    where: { projectId_language: { projectId: id, language } },
    update: { json },
    create: { projectId: id, language, json },
  });
  return NextResponse.json({ translation });
} 