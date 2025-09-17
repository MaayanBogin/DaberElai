// src/routes/api/checkout/+server.ts
import { Checkout } from "@polar-sh/sveltekit";
import { env } from '$env/dynamic/private';

export const GET = Checkout({
  accessToken: env.POLAR_ACCESS_TOKEN,
  successUrl: `${env.APP_URL}/lab`,
  server: "sandbox", // Change to "production" when going live
  theme: "dark", // Will adapt to user's system preference
});