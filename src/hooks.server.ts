// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { handle as authHandle } from './auth'; // Assumes your auth.ts is here
import { sequence } from '@sveltejs/kit/hooks';
import { redirect } from '@sveltejs/kit';

// This handle will protect specific routes
const authorizationHandle: Handle = async ({ event, resolve }) => {
  // Protect any route starting with /lab
  if (event.url.pathname.startsWith('/lab')) {
    const session = await event.locals.auth();
    if (!session) {
      // If not logged in, redirect to the homepage
      throw redirect(303, '/');
    }
  }

  // If the route is not protected or the user is authenticated, proceed
  return resolve(event);
};

// Sequence the SvelteKit Auth handler with our custom authorization handler
export const handle: Handle = sequence(authHandle, authorizationHandle);