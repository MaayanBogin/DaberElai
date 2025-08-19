import { SvelteKitAuth } from '@auth/sveltekit';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GitHub from '@auth/sveltekit/providers/github';
import { prisma } from '$lib/prisma';
import { AUTH_SECRET, AUTH_GITHUB_ID, AUTH_GITHUB_SECRET } from '$env/static/private';

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
});
