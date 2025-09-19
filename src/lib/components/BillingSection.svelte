<!-- src/lib/components/BillingSection.svelte -->
<script lang="ts">
    export let portalError;
    export let showSuccessMessage;
    export let userPlan;
    export let userTokens;
    export let customVoices;
    export let handleUpgrade;
    export let isLoading;
</script>

<div class="billing-section">
    <div class="section-header">
        <h1>Billing & Subscription</h1>
        <p>Manage your subscription and view your current plan</p>
    </div>

    {#if portalError}
        <div class="error-banner" role="alert">{portalError}</div>
    {/if}

    {#if showSuccessMessage}
        <div class="success-banner" role="alert">
            Thank you for subscribing! Your plan has been upgraded.
        </div>
    {/if}

    {#if userPlan === 'Pro'}
        <!-- Pro User Dashboard -->
        <div class="billing-card pro-dashboard">
            <div class="card-header">
                <div class="plan-info">
                    <h2 class="plan-name">Pro Plan</h2>
                    <span class="status-badge active">Active</span>
                </div>
                <div class="token-display">
                    <span class="token-label">Tokens</span>
                    <span class="token-count">{userTokens}</span>
                </div>
            </div>
            
            <p class="plan-description">
                You have full access to all Pro features with unlimited potential.
            </p>

            <div class="features-grid">
                <div class="feature-item">
                    <div class="feature-icon">🎯</div>
                    <span>1000 Tokens per Month</span>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">🎤</div>
                    <span>All Premium Voices</span>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">🔧</div>
                    <span>Up to 3 Custom Voices</span>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">⚡</div>
                    <span>Priority Support</span>
                </div>
            </div>

            <div class="management-section">
                <p class="management-description">
                    Use the secure customer portal to update payment methods, view invoices, or manage your subscription.
                </p>
                <a href="/api/portal" class="portal-button" data-sveltekit-reload>
                    Open Customer Portal
                </a>
            </div>
        </div>
    {:else}
        <!-- Free User Upgrade View -->
        <div class="plans-container">
            <div class="plan-comparison">
                <!-- Current Free Plan -->
                <div class="plan-card current-plan">
                    <div class="plan-header">
                        <h3>Free Plan</h3>
                        <div class="current-badge">Current</div>
                    </div>
                    <div class="plan-price">
                        <span class="price">$0</span>
                        <span class="period">/month</span>
                    </div>
                    <div class="token-info">
                        <span class="token-label">Your Tokens:</span>
                        <span class="token-count">{userTokens}</span>
                    </div>
                    <ul class="features-list">
                        <li>3 Free Tokens on Signup</li>
                        <li>Basic TTS Features</li>
                        <li>Create 1 Custom Voice</li>
                        <li>Community Support</li>
                    </ul>
                </div>

                <!-- Pro Plan -->
                <div class="plan-card pro-plan">
                    <div class="plan-header">
                        <h3>Pro Plan</h3>
                        <div class="recommended-badge">Recommended</div>
                    </div>
                    <div class="plan-price">
                        <span class="price">$10</span>
                        <span class="period">/month</span>
                    </div>
                    <div class="upgrade-highlight">
                        Unlock unlimited creativity
                    </div>
                    <ul class="features-list">
                        <li>1000 Tokens per Month</li>
                        <li>All Premium Voices</li>
                        <li>Create up to 3 Custom Voices</li>
                        <li>Priority Support</li>
                        <li>Advanced Voice Settings</li>
                    </ul>
                    <button 
                        class="upgrade-button" 
                        on:click={handleUpgrade} 
                        disabled={isLoading}
                    >
                        {#if isLoading}
                            <div class="loading-spinner" />
                            Processing...
                        {:else}
                            Upgrade to Pro
                        {/if}
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Usage Information -->
    <div class="usage-info-card">
        <h3>Usage Information</h3>
        <div class="usage-grid">
            <div class="usage-item">
                <span class="usage-label">Current Plan</span>
                <span class="usage-value plan-{userPlan.toLowerCase()}">{userPlan}</span>
            </div>
            <div class="usage-item">
                <span class="usage-label">Remaining Tokens</span>
                <span class="usage-value">{userTokens}</span>
            </div>
            <div class="usage-item">
                <span class="usage-label">Custom Voices</span>
                <span class="usage-value">{customVoices.length}/3</span>
            </div>
        </div>
        <div class="usage-note">
            <p>Tokens are used each time you generate speech. One token typically generates 30-60 seconds of audio.</p>
        </div>
    </div>
</div>

<style>
	.billing-section {
		max-width: 1000px;
	}

	.section-header {
		margin-bottom: 2rem;
	}

	.section-header h1 {
		font-size: 2rem;
		font-weight: 700;
		margin: 0 0 0.5rem 0;
	}

	.section-header p {
		color: var(--text-secondary);
		margin: 0;
	}

	/* Banners */
	.success-banner {
		margin-bottom: 2rem;
		border-radius: 8px;
		border: 1px solid #34d399;
		background-color: color-mix(in srgb, #10b981 10%, var(--bg-color));
		padding: 1rem;
		color: #065f46;
		font-weight: 500;
	}

	.error-banner {
		margin-bottom: 2rem;
		border-radius: 8px;
		border: 1px solid #f87171;
		background-color: color-mix(in srgb, #ef4444 10%, var(--bg-color));
		padding: 1rem;
		color: #b91c1c;
		font-weight: 500;
	}

	/* Billing Cards */
	.billing-card {
		background: var(--card-bg);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 2rem;
		box-shadow: var(--shadow);
		margin-bottom: 1.5rem;
	}

	.pro-dashboard {
		border: 2px solid var(--accent-color);
		background: linear-gradient(135deg, 
			color-mix(in srgb, var(--accent-color) 5%, var(--card-bg)) 0%, 
			var(--card-bg) 100%);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.plan-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.plan-name {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0;
		color: var(--accent-color);
	}

	.status-badge {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.status-badge.active {
		background: color-mix(in srgb, #10b981 15%, var(--bg-color));
		color: #065f46;
	}

	.token-display {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.25rem;
	}

	.token-label {
		font-size: 0.75rem;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.token-count {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--accent-color);
		font-variant-numeric: tabular-nums;
	}

	.plan-description {
		color: var(--text-secondary);
		margin-bottom: 1.5rem;
		line-height: 1.6;
	}

	/* Features Grid */
	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.feature-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: var(--bg-color);
		border: 1px solid var(--border-color);
		border-radius: 8px;
	}

	.feature-icon {
		font-size: 1.25rem;
	}

	/* Management Section */
	.management-section {
		padding-top: 1.5rem;
		border-top: 1px solid var(--border-color);
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.management-description {
		color: var(--text-secondary);
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.portal-button {
		background: var(--accent-color);
		color: white;
		padding: 0.75rem 1.5rem;
		border-radius: 8px;
		text-decoration: none;
		font-weight: 500;
		text-align: center;
		transition: all 0.2s ease;
		display: inline-block;
		width: fit-content;
	}

	.portal-button:hover {
		background: var(--accent-hover);
		transform: translateY(-1px);
	}

	/* Plans Container */
	.plans-container {
		margin-bottom: 2rem;
	}

	.plan-comparison {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.5rem;
		align-items: start;
	}

	.plan-card {
		background: var(--card-bg);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 1.5rem;
		position: relative;
		transition: all 0.3s ease;
	}

	.current-plan {
		border: 2px solid var(--border-color);
		transform: translateY(-2px);
	}

	.pro-plan {
		border: 2px solid var(--accent-color);
		background: linear-gradient(135deg, 
			color-mix(in srgb, var(--accent-color) 3%, var(--card-bg)) 0%, 
			var(--card-bg) 100%);
		transform: translateY(-4px);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
	}

	.plan-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.plan-header h3 {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
	}

	.pro-plan h3 {
		color: var(--accent-color);
	}

	.current-badge {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.25rem 0.75rem;
		background: var(--border-color);
		color: var(--text-secondary);
		border-radius: 12px;
	}

	.recommended-badge {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.25rem 0.75rem;
		background: var(--accent-color);
		color: white;
		border-radius: 12px;
	}

	.plan-price {
		display: flex;
		align-items: baseline;
		margin-bottom: 1rem;
	}

	.price {
		font-size: 2rem;
		font-weight: 700;
	}

	.period {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-left: 0.25rem;
	}

	.token-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		padding: 0.75rem;
		background: var(--bg-color);
		border-radius: 6px;
		border: 1px solid var(--border-color);
	}

	.upgrade-highlight {
		background: linear-gradient(90deg, var(--accent-color), #7c3aed);
		background-clip: text;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		font-weight: 600;
		margin-bottom: 1rem;
		text-align: center;
	}

	.features-list {
		list-style: none;
		padding: 0;
		margin: 0 0 1.5rem 0;
	}

	.features-list li {
		padding: 0.5rem 0;
		position: relative;
		padding-left: 1.5rem;
		color: var(--text-primary);
		font-size: 0.875rem;
	}

	.features-list li::before {
		content: "✓";
		position: absolute;
		left: 0;
		color: var(--accent-color);
		font-weight: bold;
	}

	.upgrade-button {
		width: 100%;
		background: var(--accent-color);
		color: white;
		border: none;
		border-radius: 8px;
		padding: 0.875rem 1rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	.upgrade-button:hover:not(:disabled) {
		background: var(--accent-hover);
		transform: translateY(-1px);
	}

	.upgrade-button:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}

	/* Usage Information Card */
	.usage-info-card {
		background: var(--card-bg);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: var(--shadow);
	}

	.usage-info-card h3 {
		font-size: 1.125rem;
		font-weight: 600;
		margin: 0 0 1rem 0;
		color: var(--text-primary);
	}

	.usage-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.usage-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.usage-label {
		font-size: 0.75rem;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.usage-value {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.usage-value.plan-pro {
		color: var(--accent-color);
	}

	.usage-note {
		padding-top: 1rem;
		border-top: 1px solid var(--border-color);
	}

	.usage-note p {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	.loading-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Responsive Design */
	@media (max-width: 768px) {
		.card-header {
			flex-direction: column;
			align-items: stretch;
		}
		
		.token-display {
			align-items: flex-start;
		}
		
		.features-grid {
			grid-template-columns: 1fr;
		}
		
		.plan-comparison {
			grid-template-columns: 1fr;
		}
		
		.usage-grid {
			grid-template-columns: repeat(2, 1fr);
		}
		
		.management-section {
			text-align: center;
		}
	}
</style>