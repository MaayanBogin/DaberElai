// src/routes/api/webhook/polar/+server.ts
import { Webhooks } from '@polar-sh/sveltekit';
import { env } from '$env/dynamic/private';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const POST = Webhooks({
	webhookSecret: env.POLAR_WEBHOOK_SECRET,

	// This handler is called when a subscription becomes active
	onSubscriptionActive: async (payload) => {
		console.log('Subscription is active:', payload.data.id);

		// Extract our custom metadata
		const metadata = payload.data.metadata;
		const userId = metadata?.userId as string | undefined;
        const polarCustomerId = payload.data.customerId;

		if (!userId) {
			console.error('Webhook received but no userId found in metadata!', payload);
			return; // Or throw an error to signal failure to Polar
		}

		try {
			// Find the user and update their plan and tokens
			await prisma.user.update({
				where: { id: userId },
				data: {
					plan: 'Pro', // Or dynamically set based on product
					tokens: {
						// Set a high number or increment based on your logic
						increment: 1000
					},
                    polarCustomerId: polarCustomerId
				}
			});
			console.log(`Successfully upgraded user ${userId} to the Pro plan.`);
		} catch (error) {
			console.error(`Failed to update user ${userId} from webhook:`, error);
			// Throwing an error here will cause Polar to retry the webhook
			throw error;
		}
	},

	// You can add other handlers too, e.g., for cancellations
	onSubscriptionCanceled: async (payload) => {
		const metadata = payload.data.metadata;
		const userId = metadata?.userId as string | undefined;

		if (!userId) {
			console.error('Cancellation webhook missing userId in metadata');
			return;
		}
		
		// Note: The subscription is still active until the period ends.
		// You might want to listen to `subscription.revoked` to downgrade the plan.
		console.log(`User ${userId} cancelled their subscription. It will be revoked at period end.`);
	},

    onSubscriptionRevoked: async (payload) => {
		const polarCustomerId = payload.data.customerId;
		if (!polarCustomerId) {
			console.error('Subscription revoked webhook missing customer_id');
			return;
		}

		try {
			// Downgrade the user's plan
			await prisma.user.update({
				where: { polarCustomerId: polarCustomerId },
				data: {
					plan: 'Free'
					// You might want to reset their tokens here as well
					// tokens: 0
				}
			});
			console.log(`User with Polar Customer ID ${polarCustomerId} has been downgraded to Free plan.`);
		} catch (error) {
			console.error(`Failed to downgrade user with Polar Customer ID ${polarCustomerId}:`, error);
			// Don't throw here, as retrying might not solve a "user not found" issue.
			// Log it for manual review.
		}
	}
});