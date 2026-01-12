import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET all categories for the authenticated user
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categories = await prisma.category.findMany({
      where: { userId: session.user.id },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST create a new category
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, monthlyBudget, color, goalId } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    }

    // Normalize the name:
    // 1. Trim whitespace
    // 2. Replace special characters (except alphanumeric, space, hyphen, underscore) with space
    // 3. Collapse multiple spaces/hyphens/underscores into single space
    // 4. Trim again
    const normalizedName = name
      .trim()
      .replace(/[^a-zA-Z0-9\s\-_]/g, ' ')  // Replace special chars with space
      .replace(/[\s\-_]+/g, ' ')            // Collapse multiple spaces/hyphens/underscores
      .trim()

    // Check if category with this name already exists for this user (case-insensitive)
    const existing = await prisma.category.findFirst({
      where: {
        userId: session.user.id,
        name: {
          equals: normalizedName,
          mode: 'insensitive',
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 400 }
      )
    }

    // Properly handle empty string as null for goalId
    const validGoalId = goalId && goalId.trim() !== '' ? goalId : null

    const category = await prisma.category.create({
      data: {
        userId: session.user.id,
        name: normalizedName,
        monthlyBudget: monthlyBudget ? parseFloat(monthlyBudget) : null,
        color: color || '#3B82F6', // Default blue
        goalId: validGoalId,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
