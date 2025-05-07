import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { apiProjectId: string } }
) {
  try {
    const project = await prisma.translationProject.findUnique({
      where: { id: params.apiProjectId },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { apiProjectId: string } }
) {
  try {
    await prisma.translation.deleteMany({ where: { projectId: params.apiProjectId } });
    await prisma.translationProject.delete({ where: { id: params.apiProjectId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
} 