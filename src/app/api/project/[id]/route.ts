import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  if (!id) return NextResponse.json({ error: 'No id' }, { status: 400 });
  const project = await prisma.translationProject.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ project });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  if (!id) return NextResponse.json({ error: 'No id' }, { status: 400 });
  await prisma.translation.deleteMany({ where: { projectId: id } });
  await prisma.translationProject.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  if (!id) return NextResponse.json({ error: 'No id' }, { status: 400 });
  const { baseJson } = await request.json();
  if (!baseJson) return NextResponse.json({ error: 'No baseJson' }, { status: 400 });
  const project = await prisma.translationProject.update({
    where: { id },
    data: { baseJson },
  });
  return NextResponse.json({ project });
} 