import { SvelteKitAuth } from '@auth/sveltekit';
import GitHub from '@auth/sveltekit/providers/github';
import { AUTH_SECRET, AUTH_GITHUB_ID, AUTH_GITHUB_SECRET } from '$env/static/private';

export const { handle, signIn, signOut } = SvelteKitAuth({
  providers: [
    GitHub({
      clientId: AUTH_GITHUB_ID,
      clientSecret: AUTH_GITHUB_SECRET,
    }),
  ],
  secret: AUTH_SECRET,
  trustHost: true,
  // Remove any custom configurations that might interfere
});