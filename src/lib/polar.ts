// src/lib/server/polar.ts
import { Polar } from "@polar-sh/sdk";
import { env } from '$env/dynamic/private';

// Initialize the Polar SDK.
// Using 'sandbox' is recommended for development and testing.
// Change to 'production' when you go live.
export const polar = new Polar({
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: 'sandbox' // Use 'production' for live payments
});