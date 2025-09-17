// src/routes/api/checkout/embed/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { Polar } from '@polar-sh/sdk'; // <-- Import the core SDK

// Initialize the core Polar SDK client
const polar = new Polar({
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: 'sandbox', // Use 'production' when you go live
});

// Your Product ID from the Polar Dashboard
const proPlanProductId = '3073e600-9dea-438c-a42c-7bdf7541875d'; // <-- IMPORTANT: Replace this

export const POST: RequestHandler = async ({ locals, url }) => {
  // 1. Authenticate the user
  const session = await locals.auth();
  if (!session?.user?.id) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  const origin = env.APP_URL; // e.g., 'http://localhost:5173'

  try {
    // 2. Create a checkout session using the Polar SDK
    const checkoutSession = await polar.checkouts.create({
      products: [proPlanProductId],
      
      // The user will be redirected here AFTER a successful payment inside the embed
      successUrl: `${origin}/lab`,
      
      // CRITICAL for security: This tells Polar which domain is allowed to embed this checkout
      embedOrigin: origin,
      
      // Securely pass your internal user ID
      metadata: {
        userId: userId,
      },
    });

    // 3. Return the session URL to the client
    if (!checkoutSession.url) {
      throw new Error('Polar API did not return a checkout URL.');
    }

    return json({ checkoutUrl: checkoutSession.url });

  } catch (error) {
    console.error('Failed to create Polar checkout session:', error);
    return json({ error: 'Could not initiate checkout. Please try again later.' }, { status: 500 });
  }
};