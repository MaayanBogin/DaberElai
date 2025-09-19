<!-- src/lib/components/SettingsSection.svelte -->
<script lang="ts">
    export let theme;
    export let page;
    export let userTokens;
    export let contactForm;
    export let submitContactForm;
    export let showCancelModal;
</script>

<div class="settings-section">
    <div class="section-header">
        <h1>Settings</h1>
        <p>Configure your preferences and manage your account</p>
    </div>
    
    <div class="settings-grid">
        <!-- Appearance Settings -->
        <div class="settings-card">
            <h3>Appearance</h3>
            <div class="setting-item">
                <label class="setting-label">
                    <span>Dark Mode</span>
                    <button
                        class="toggle-button"
                        class:active={$theme === 'dark'}
                        on:click={() => theme.set($theme === 'dark' ? 'light' : 'dark')}
                    >
                        <div class="toggle-slider"></div>
                    </button>
                </label>
            </div>
        </div>

        <!-- Account Information -->
        <div class="settings-card">
            <h3>Account Information</h3>
            <div class="setting-item">
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">{$page.data.session?.user?.email || 'Not available'}</span>
                </div>
            </div>
            <div class="setting-item">
                <div class="info-row">
                    <span class="info-label">Tokens Remaining:</span>
                    <span class="info-value token-highlight">{userTokens}</span>
                </div>
            </div>
        </div>

        <!-- Contact Support -->
        <div class="settings-card">
            <h3>Contact Support</h3>
            <form class="contact-form" on:submit|preventDefault={submitContactForm}>
                <div class="form-group">
                    <label for="subject">Subject</label>
                    <input 
                        id="subject"
                        type="text" 
                        bind:value={contactForm.subject}
                        placeholder="How can we help?"
                        disabled={contactForm.isSubmitting}
                    />
                </div>
                <div class="form-group">
                    <label for="message">Message</label>
                    <textarea 
                        id="message"
                        bind:value={contactForm.message}
                        placeholder="Describe your issue or question..."
                        rows="4"
                        disabled={contactForm.isSubmitting}
                    ></textarea>
                </div>
                <button 
                    type="submit" 
                    class="submit-button"
                    disabled={contactForm.isSubmitting}
                >
                    {#if contactForm.isSubmitting}
                        <div class="loading-spinner small" />
                        Sending...
                    {:else}
                        Send Message
                    {/if}
                </button>
            </form>
        </div>

        <!-- Subscription Management -->
        <div class="settings-card danger-card">
            <h3>Subscription</h3>
            <p class="card-description">Manage your subscription settings</p>
            <button 
                class="danger-button"
                on:click={() => showCancelModal = true}
            >
                Cancel Subscription
            </button>
        </div>
    </div>
</div>

<style>
	.settings-section {
		max-width: 1200px;
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

	.settings-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
		gap: 1.5rem;
	}

	.settings-card {
		background: var(--card-bg);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: var(--shadow);
	}

	.settings-card h3 {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0 0 1rem 0;
		color: var(--text-primary);
	}

	.card-description {
		color: var(--text-secondary);
		font-size: 0.875rem;
		margin: 0 0 1rem 0;
	}

	.setting-item {
		margin-bottom: 1rem;
	}

	.setting-item:last-child {
		margin-bottom: 0;
	}

	.setting-label {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-weight: 500;
		cursor: pointer;
	}

	.toggle-button {
		width: 44px;
		height: 24px;
		background: #e5e7eb;
		border: none;
		border-radius: 12px;
		position: relative;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.toggle-button.active {
		background: var(--accent-color);
	}

	.toggle-slider {
		width: 20px;
		height: 20px;
		background: white;
		border-radius: 50%;
		position: absolute;
		top: 2px;
		left: 2px;
		transition: transform 0.2s ease;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.toggle-button.active .toggle-slider {
		transform: translateX(20px);
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
	}

	.info-label {
		color: var(--text-secondary);
		font-weight: 500;
	}

	.info-value {
		color: var(--text-primary);
		font-weight: 600;
	}

	.token-highlight {
		color: var(--accent-color);
		font-size: 1.1em;
	}

	/* Contact Form */
	.contact-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-weight: 500;
		color: var(--text-primary);
		font-size: 0.875rem;
	}

	.form-group input,
	.form-group textarea {
		padding: 0.75rem;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		background: var(--bg-color);
		color: var(--text-primary);
		font-size: 0.875rem;
		transition: border-color 0.2s ease;
	}

	.form-group input:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: var(--accent-color);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-color) 10%, transparent);
	}

	.form-group textarea {
		resize: vertical;
		min-height: 100px;
	}

	.submit-button {
		background: var(--accent-color);
		color: white;
		border: none;
		border-radius: 8px;
		padding: 0.75rem 1.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		justify-content: center;
	}

	.submit-button:hover:not(:disabled) {
		background: var(--accent-hover);
	}

	.submit-button:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}

	/* Danger Card */
	.danger-card {
		border-color: color-mix(in srgb, var(--danger-color) 20%, var(--border-color));
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

	.loading-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.loading-spinner.small {
		width: 12px;
		height: 12px;
		border-width: 1.5px;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Responsive */
	@media (max-width: 768px) {
		.settings-grid {
			grid-template-columns: 1fr;
		}
	}
</style>