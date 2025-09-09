// src/routes/api/user/tokens/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const GET: RequestHandler = async ({ locals }) => {
  try {
    const session = await locals.auth();

    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        tokens: true, 
        plan: true,
        name: true,
        email: true
      },
    });

    if (!user) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    return json({ 
      tokens: user.tokens,
      plan: user.plan,
      name: user.name,
      email: user.email
    });
  } catch (error) {
    console.error('Error fetching user tokens:', error);
    return json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
};