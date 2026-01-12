import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// UPDATE category budget
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { monthlyBudget, color, name, goalId } = body

    // Verify ownership
    const category = await prisma.category.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Normalize name if provided
    let normalizedName = category.name // Keep existing name if not provided
    if (name && name.trim()) {
      normalizedName = name
        .trim()
        .replace(/[^a-zA-Z0-9\s\-_]/g, ' ')
        .replace(/[\s\-_]+/g, ' ')
        .trim()

      // Check if another category with this name exists (case-insensitive)
      const duplicate = await prisma.category.findFirst({
        where: {
          userId: session.user.id,
          name: {
            equals: normalizedName,
            mode: 'insensitive',
          },
          id: {
            not: id, // Exclude current category
          },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'Category with this name already exists' },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: normalizedName,
        monthlyBudget: monthlyBudget !== undefined ? (monthlyBudget ? parseFloat(monthlyBudget) : null) : undefined,
        color: color || undefined,
        goalId: goalId !== undefined ? (goalId && goalId.trim() !== '' ? goalId : null) : undefined,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE category
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const category = await prisma.category.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    await prisma.category.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
