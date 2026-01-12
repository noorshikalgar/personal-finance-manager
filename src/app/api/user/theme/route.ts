import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { theme, accentColor } = await request.json()

    // Validate theme
    const validThemes = ['light', 'dark', 'violet', 'rose', 'blue', 'green', 'orange']
    if (theme && !validThemes.includes(theme)) {
      return NextResponse.json({ error: 'Invalid theme' }, { status: 400 })
    }

    // Validate accent color (hex color)
    if (accentColor && !/^#[0-9A-Fa-f]{6}$/.test(accentColor)) {
      return NextResponse.json({ error: 'Invalid accent color format' }, { status: 400 })
    }

    // Build update data
    const updateData: any = {}
    if (theme) updateData.theme = theme
    if (accentColor) updateData.accentColor = accentColor

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        theme: true,
        accentColor: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Theme update error:', error)
    return NextResponse.json(
      { error: 'Failed to update theme' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        theme: true,
        accentColor: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Theme fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch theme' },
      { status: 500 }
    )
  }
}
