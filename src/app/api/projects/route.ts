import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const projects = await prisma.translationProject.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json({ projects });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, baseJson } = await request.json();
    if (!name || !baseJson) {
      return NextResponse.json({ error: 'Name and baseJson are required' }, { status: 400 });
    }
    const project = await prisma.translationProject.create({
      data: {
        name,
        baseJson,
      },
    });
    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
} 