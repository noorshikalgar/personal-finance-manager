'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function markWelcomeComplete() {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { 
      onboardingCompleted: true,
      onboardingSkipped: false,
    },
  })

  revalidatePath('/dashboard')
}
