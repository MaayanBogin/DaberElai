<!-- src/lib/components/CancelSubscriptionModal.svelte -->
<script lang="ts">
    export let showCancelModal;
    export let cancelSubscription;
</script>

<div class="modal-overlay" on:click={() => showCancelModal = false}>
    <div class="modal-content" on:click|stopPropagation>
        <h3>Cancel Subscription</h3>
        <p>Are you sure you want to cancel your subscription? You'll continue to have access until the end of your current billing period.</p>
        <div class="modal-actions">
            <button class="cancel-button" on:click={() => showCancelModal = false}>
                Keep Subscription
            </button>
            <button class="danger-button" on:click={cancelSubscription}>
                Cancel Subscription
            </button>
        </div>
    </div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content {
		background: var(--card-bg);
		border-radius: 12px;
		padding: 2rem;
		max-width: 500px;
		width: 90%;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
	}

	.modal-content h3 {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.modal-content p {
		margin: 0 0 2rem 0;
		color: var(--text-secondary);
		line-height: 1.6;
	}

	.modal-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
	}

	.cancel-button {
		background: var(--bg-color);
		color: var(--text-primary);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		padding: 0.75rem 1.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.cancel-button:hover {
		background: var(--border-color);
	}

	.danger-button {
		background: var(--danger-color);
		color: white;
		border: none;
		border-radius: 8px;
		padding: 0.75rem 1.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.danger-button:hover {
		background: var(--danger-hover);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.modal-content {
			margin: 1rem;
		}

		.modal-actions {
			flex-direction: column;
		}
	}
</style>