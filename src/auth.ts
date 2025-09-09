import { SvelteKitAuth } from '@auth/sveltekit';
import GitHub from '@auth/sveltekit/providers/github';
import { AUTH_SECRET, AUTH_GITHUB_ID, AUTH_GITHUB_SECRET } from '$env/static/private';

import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const { handle, signIn, signOut } = SvelteKitAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: AUTH_GITHUB_ID,
      clientSecret: AUTH_GITHUB_SECRET,
    }),
  ],
  secret: AUTH_SECRET,
  trustHost: true,
  callbacks: {
    session: async ({ session, user }) => {
      if (session.user) {
        session.user.id = user.id; // Include user ID in session
      }
      return session;
    }
  }
  // Remove any custom configurations that might interfere
});