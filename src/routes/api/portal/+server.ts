// src/routes/api/portal/+server.ts

import { redirect, isRedirect } from '@sveltejs/kit'; // Import the 'isRedirect' utility
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { Polar } from '@polar-sh/sdk';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const polar = new Polar({
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: 'sandbox',
});

export const GET: RequestHandler = async ({ locals }) => {
  const session = await locals.auth();
  if (!session?.user?.id) {
    throw redirect(303, '/auth/signin');
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { polarCustomerId: true },
    });

    if (!user?.polarCustomerId) {
      // This is a valid, expected case, so we throw a redirect.
      // SvelteKit will handle this correctly.
      throw redirect(303, '/billing?error=no_subscription');
    }

    const customerSession = await polar.customerSessions.create({
      customerId: user.polarCustomerId,
    });

    if (!customerSession.customerPortalUrl) {
      // This is a real, unexpected error from the API
      throw new Error('Polar API did not return a customer portal URL.');
    }

    // This is the successful case. We throw the redirect.
    // SvelteKit will handle this correctly.
    throw redirect(303, customerSession.customerPortalUrl);

  } catch (error) {
    // THIS IS THE CRITICAL FIX:
    // We check if the caught item is a SvelteKit redirect.
    // If it is, we must re-throw it so SvelteKit's server can process it.
    if (isRedirect(error)) {
      throw error;
    }

    // If it's NOT a redirect, it's a real error.
    // We log it and send the user to an error page.
    console.error('Failed to create customer portal session:', error);
    throw redirect(303, '/billing?error=portal_failed');
  }
};