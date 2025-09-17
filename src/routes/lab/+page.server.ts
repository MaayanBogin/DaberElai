// src/routes/lab/+page.server.ts
import { PrismaClient } from '@prisma/client';
import type { PageServerLoad } from './$types';

const prisma = new PrismaClient();

export const load: PageServerLoad = async (event) => {
  // Get the session from the server-side event
  const session = await event.locals.auth();

  // If there's no user, we don't need to fetch anything
  if (!session?.user?.id) {
    return { user: null };
  }

  // Fetch the user's plan and token info from the database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      plan: true,
      tokens: true,
    },
  });

  return {
    // Pass the user data to the +page.svelte component
    user,
  };
};