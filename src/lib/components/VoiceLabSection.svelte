<!-- src/lib/components/VoiceLabSection.svelte -->
<script lang="ts">
    export let voiceCreationStep;
    export let startVoiceCreation;
    export let consentChecks;
    export let allConsentChecked;
    export let proceedToRecording;
    export let currentPromptText;
    export let recordingStatus;
    export let isRecording;
    export let isUploading;
    export let recordedBlob;
    export let startRecording;
    export let stopRecording;
    export let playRecording;
    export let proceedToNaming;
    export let backToConsent;
    export let backToRecording;
    export let voiceName: string;
    export let saveVoice;
    export let customVoices;
    export let deleteVoice;
    export let generateNewPromptText;
</script>

<div class="voice-lab-section">
    <div class="section-header">
        <h1>Voice Lab</h1>
        <p>Create and manage custom voices with ethical consent verification</p>
    </div>
    
    <!-- Voice Creation Process -->
    <div class="voice-lab-card">
        <h3>Create New Voice</h3>
        <p class="card-description">Follow our guided process to create a custom voice ethically</p>
        
        {#if voiceCreationStep === 'consent'}
            <!-- Consent Step -->
            <div class="consent-section">
                <div class="consent-header">
                    <div class="step-indicator">Step 1 of 3</div>
                    <h4>Consent Verification</h4>
                </div>
                
                <div class="consent-content">
                    <div class="consent-warning">
                        <div class="warning-icon">⚠️</div>
                        <div class="warning-text">
                            <strong>Important: Voice Cloning Ethics</strong>
                            <p>Voice cloning technology can be misused. Please ensure you have proper authorization before proceeding.</p>
                        </div>
                    </div>
                    
                    <div class="consent-checklist">
                        <label class="consent-item">
                            <input 
                                type="checkbox" 
                                bind:checked={consentChecks.ownVoice}
                                class="consent-checkbox"
                            />
                            <span class="consent-text">
                                I confirm this is my own voice, or I have explicit written consent from the person whose voice I'm cloning
                            </span>
                        </label>
                        
                        <label class="consent-item">
                            <input 
                                type="checkbox" 
                                bind:checked={consentChecks.legalUse}
                                class="consent-checkbox"
                            />
                            <span class="consent-text">
                                I will only use this voice clone for legal and ethical purposes
                            </span>
                        </label>
                        
                        <label class="consent-item">
                            <input 
                                type="checkbox" 
                                bind:checked={consentChecks.noDeception}
                                class="consent-checkbox"
                            />
                            <span class="consent-text">
                                I will not use this voice to deceive, impersonate, or harm others
                            </span>
                        </label>
                        
                        <label class="consent-item">
                            <input 
                                type="checkbox" 
                                bind:checked={consentChecks.compliance}
                                class="consent-checkbox"
                            />
                            <span class="consent-text">
                                I understand that misuse may result in account termination and legal consequences
                            </span>
                        </label>
                    </div>
                    
                    <div class="consent-actions">
                        <button 
                            class="consent-button"
                            disabled={!allConsentChecked}
                            on:click={() => proceedToRecording()}
                        >
                            {#if allConsentChecked}
                                Proceed to Recording
                            {:else}
                                Please Complete All Checks Above
                            {/if}
                        </button>
                    </div>
                </div>
            </div>
        
        {:else if voiceCreationStep === 'recording'}
            <!-- Recording Step -->
            <div class="recording-section">
                <div class="recording-header">
                    <div class="step-indicator">Step 2 of 3</div>
                    <h4>Voice Recording</h4>
                    <p>Read the provided text clearly and naturally</p>
                </div>
                
                <div class="text-prompt-section">
                    <div class="prompt-header">
                        <h5>Please read this text aloud:</h5>
                        <button 
                            class="refresh-text-btn"
                            on:click={generateNewPromptText}
                            disabled={isRecording}
                        >
                            🔄 New Text
                        </button>
                    </div>
                    
                    <div class="prompt-text" dir="rtl">
                        {currentPromptText}
                    </div>
                    
                    <div class="prompt-tips">
                        <strong>Tips for best results:</strong>
                        <ul>
                            <li>Speak clearly and at a natural pace</li>
                            <li>Record in a quiet environment</li>
                            <li>Keep consistent volume throughout</li>
                            <li>Read with natural expression</li>
                        </ul>
                    </div>
                </div>
                
                <div class="recording-status" class:recording={isRecording}>
                    {recordingStatus}
                </div>
                
                <div class="recording-controls">
                    <button 
                        class="record-button"
                        class:recording={isRecording}
                        on:click={isRecording ? stopRecording : startRecording}
                        disabled={isUploading}
                    >
                        {#if isRecording}
                            🛑 Stop Recording
                        {:else}
                            🎤 Start Recording
                        {/if}
                    </button>
                    
                    {#if recordedBlob}
                        <button 
                            class="play-button"
                            on:click={playRecording}
                            disabled={isUploading || isRecording}
                        >
                            ▶️ Play Recording
                        </button>
                        
                        <button 
                            class="next-button"
                            on:click={() => proceedToNaming()}
                            disabled={isUploading}
                        >
                            Next Step →
                        </button>
                    {/if}
                </div>
                
                <div class="step-navigation">
                    <button 
                        class="back-button"
                        on:click={() => backToConsent()}
                        disabled={isRecording || isUploading}
                    >
                        ← Back to Consent
                    </button>
                </div>
            </div>
        
        {:else if voiceCreationStep === 'naming'}
            <!-- Naming and Save Step -->
            <div class="naming-section">
                <div class="naming-header">
                    <div class="step-indicator">Step 3 of 3</div>
                    <h4>Name Your Voice</h4>
                    <p>Give your custom voice a memorable name</p>
                </div>
                
                <div class="form-group">
                    <label for="voiceName">Voice Name</label>
                    <input 
                        id="voiceName"
                        type="text" 
                        bind:value={voiceName}
                        placeholder="Enter voice name (e.g., My Podcast Voice)"
                        maxlength="50"
                        disabled={isUploading}
                    />
                    <small class="input-help">
                        Choose a name that helps you identify this voice later
                    </small>
                </div>
                
                <div class="recording-preview">
                    <h5>Recording Preview:</h5>
                    <div class="preview-text">"{currentPromptText}"</div>
                    <button 
                        class="play-button small"
                        on:click={playRecording}
                        disabled={isUploading}
                    >
                        ▶️ Play
                    </button>
                </div>
                
                <div class="naming-actions">
                    <button 
                        class="back-button"
                        on:click={() => backToRecording()}
                        disabled={isUploading}
                    >
                        ← Back to Recording
                    </button>
                    
                    <button 
                        class="save-button"
                        on:click={saveVoice}
                        disabled={!recordedBlob || !voiceName.trim() || isUploading}
                    >
                        {#if isUploading}
                            <div class="loading-spinner small" />
                            Saving Voice...
                        {:else}
                            💾 Save Voice
                        {/if}
                    </button>
                </div>
            </div>
        
        {:else}
            <!-- Initial State -->
            <div class="initial-state">
                <div class="cta-content">
                    <div class="cta-icon">🎤</div>
                    <h4>Ready to create your custom voice?</h4>
                    <p>Our guided process ensures ethical voice cloning with proper consent verification.</p>
                    <button 
                        class="start-button"
                        on:click={startVoiceCreation}
                    >
                        Start Voice Creation
                    </button>
                </div>
            </div>
        {/if}
    </div>
    
    <!-- Existing Custom Voices List (unchanged) -->
    <div class="voice-lab-card">
        <h3>Your Custom Voices</h3>
        <p class="card-description">Manage your saved voices</p>
        
        {#if customVoices.length === 0}
            <div class="empty-state">
                <div class="empty-icon">🎤</div>
                <p>No custom voices yet. Create your first voice above!</p>
            </div>
        {:else}
            <div class="voices-grid">
                {#each customVoices as voice}
                    <div class="voice-card">
                        <div class="voice-info">
                            <h4>{voice.name}</h4>
                            <p class="voice-date">
                                Created {new Date(voice.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                        <div class="voice-actions">
                            <button 
                                class="voice-action-btn play"
                                on:click={() => {
                                    const audio = new Audio(voice.url);
                                    audio.play().catch(console.error);
                                }}
                            >
                                Play
                            </button>
                            <button 
                                class="voice-action-btn delete"
                                on:click={() => deleteVoice(voice.id)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>

<style>
	.voice-lab-section {
		max-width: 800px;
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

	.voice-lab-card {
		background: var(--card-bg);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		box-shadow: var(--shadow);
	}

	.voice-lab-card h3 {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
		color: var(--text-primary);
	}

	.recording-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.recording-status {
		font-size: 0.875rem;
		color: var(--text-secondary);
		padding: 0.5rem;
		text-align: center;
		border-radius: 6px;
		background: var(--bg-color);
	}

	.recording-status.recording {
		color: #dc2626;
		background: color-mix(in srgb, #dc2626 10%, var(--bg-color));
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.7; }
	}

	.recording-controls {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.record-button, .play-button, .save-button {
		padding: 0.75rem 1.5rem;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		background: var(--card-bg);
		color: var(--text-primary);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.record-button.recording {
		background: #dc2626;
		border-color: #dc2626;
		color: white;
	}

	.save-button {
		background: var(--accent-color);
		border-color: var(--accent-color);
		color: white;
	}

	.save-button:hover:not(:disabled) {
		background: var(--accent-hover);
	}

	.record-button:hover:not(:disabled),
	.play-button:hover:not(:disabled) {
		border-color: var(--accent-color);
		background: color-mix(in srgb, var(--accent-color) 5%, var(--card-bg));
	}

	.record-button:disabled,
	.play-button:disabled,
	.save-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.voices-grid {
		display: grid;
		gap: 1rem;
	}

	.voice-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		background: var(--bg-color);
	}

	.voice-info h4 {
		margin: 0 0 0.25rem 0;
		font-weight: 600;
		color: var(--text-primary);
	}

	.voice-date {
		margin: 0;
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.voice-actions {
		display: flex;
		gap: 0.5rem;
	}

	.voice-action-btn {
		padding: 0.5rem 1rem;
		border: 1px solid var(--border-color);
		border-radius: 6px;
		font-size: 0.75rem;
		cursor: pointer;
		background: var(--card-bg);
		transition: all 0.2s ease;
	}

	.voice-action-btn.play {
		color: var(--accent-color);
		border-color: var(--accent-color);
	}

	.voice-action-btn.delete {
		color: #dc2626;
		border-color: #dc2626;
	}

	.voice-action-btn:hover {
		transform: translateY(-1px);
	}

	.voice-action-btn.play:hover {
		background: color-mix(in srgb, var(--accent-color) 10%, var(--card-bg));
	}

	.voice-action-btn.delete:hover {
		background: color-mix(in srgb, #dc2626 10%, var(--card-bg));
	}

	.empty-state {
		text-align: center;
		padding: 2rem;
		color: var(--text-secondary);
	}

	.empty-icon {
		font-size: 2rem;
		margin-bottom: 1rem;
	}

	.card-description {
		color: var(--text-secondary);
		font-size: 0.875rem;
		margin: 0 0 1rem 0;
	}

	/* Voice Creation Process Styles */
	.step-indicator {
		display: inline-block;
		background: var(--accent-color);
		color: white;
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		margin-bottom: 0.75rem;
	}

	/* Consent Section */
	.consent-section {
		padding: 1rem 0;
	}

	.consent-header h4 {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0 0 1rem 0;
		color: var(--text-primary);
	}

	.consent-warning {
		display: flex;
		gap: 1rem;
		padding: 1rem;
		background: color-mix(in srgb, #f59e0b 10%, var(--bg-color));
		border: 1px solid color-mix(in srgb, #f59e0b 30%, var(--border-color));
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}

	.warning-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.warning-text strong {
		display: block;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}

	.warning-text p {
		margin: 0;
		color: var(--text-secondary);
		font-size: 0.875rem;
		line-height: 1.4;
	}

	.consent-checklist {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.consent-item {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		cursor: pointer;
		padding: 0.75rem;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		background: var(--bg-color);
		transition: all 0.2s ease;
	}

	.consent-item:hover {
		border-color: var(--accent-color);
		background: color-mix(in srgb, var(--accent-color) 3%, var(--bg-color));
	}

	.consent-checkbox {
		width: 18px;
		height: 18px;
		margin: 0;
		flex-shrink: 0;
		margin-top: 2px;
		accent-color: var(--accent-color);
	}

	.consent-text {
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--text-primary);
	}

	.consent-actions {
		display: flex;
		justify-content: center;
	}

	.consent-button {
		padding: 0.875rem 2rem;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.875rem;
	}

	.consent-button:disabled {
		background: #9ca3af;
		color: #6b7280;
		cursor: not-allowed;
	}

	.consent-button:not(:disabled) {
		background: var(--accent-color);
		color: white;
	}

	.consent-button:not(:disabled):hover {
		background: var(--accent-hover);
		transform: translateY(-1px);
	}

	/* Recording Section */
	.recording-header h4 {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
		color: var(--text-primary);
	}

	.recording-header p {
		color: var(--text-secondary);
		margin: 0 0 1.5rem 0;
	}

	.text-prompt-section {
		background: var(--bg-color);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
	}

	.prompt-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.prompt-header h5 {
		margin: 0;
		font-weight: 600;
		color: var(--text-primary);
	}

	.refresh-text-btn {
		background: none;
		border: 1px solid var(--border-color);
		border-radius: 6px;
		padding: 0.5rem 0.75rem;
		font-size: 0.75rem;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.refresh-text-btn:hover:not(:disabled) {
		border-color: var(--accent-color);
		color: var(--accent-color);
	}

	.refresh-text-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.prompt-text {
		background: var(--card-bg);
		border: 2px solid color-mix(in srgb, var(--accent-color) 20%, var(--border-color));
		border-radius: 8px;
		padding: 1rem;
		font-size: 1rem;
		line-height: 1.6;
		color: var(--text-primary);
		margin-bottom: 1rem;
		min-height: 80px;
		text-align: right;
	}

	.prompt-tips {
		font-size: 0.875rem;
	}

	.prompt-tips strong {
		color: var(--text-primary);
		display: block;
		margin-bottom: 0.5rem;
	}

	.prompt-tips ul {
		margin: 0;
		padding-left: 1.25rem;
		color: var(--text-secondary);
	}

	.prompt-tips li {
		margin-bottom: 0.25rem;
	}

	/* Naming Section */
	.naming-header h4 {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0 0 0.5rem 0;
		color: var(--text-primary);
	}

	.naming-header p {
		color: var(--text-secondary);
		margin: 0 0 1.5rem 0;
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

	.form-group input {
		padding: 0.75rem;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		background: var(--bg-color);
		color: var(--text-primary);
		font-size: 0.875rem;
		transition: border-color 0.2s ease;
	}

	.form-group input:focus {
		outline: none;
		border-color: var(--accent-color);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-color) 10%, transparent);
	}

	.input-help {
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin-top: 0.25rem;
	}

	.recording-preview {
		background: var(--bg-color);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		padding: 1rem;
		margin: 1rem 0;
	}

	.recording-preview h5 {
		margin: 0 0 0.75rem 0;
		font-weight: 600;
		color: var(--text-primary);
		font-size: 0.875rem;
	}

	.preview-text {
		font-style: italic;
		color: var(--text-secondary);
		margin-bottom: 0.75rem;
		font-size: 0.875rem;
		direction: rtl;
		text-align: right;
	}

	.naming-actions {
		display: flex;
		gap: 1rem;
		justify-content: space-between;
	}

	/* Step Navigation */
	.step-navigation {
		margin-top: 1.5rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border-color);
	}

	/* Button Styles */
	.start-button, .next-button {
		background: var(--accent-color);
		color: white;
		border: none;
		border-radius: 8px;
		padding: 0.875rem 1.75rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.875rem;
	}

	.start-button:hover, .next-button:hover {
		background: var(--accent-hover);
		transform: translateY(-1px);
	}

	.back-button {
		background: var(--bg-color);
		color: var(--text-secondary);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		padding: 0.75rem 1.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.875rem;
	}

	.back-button:hover:not(:disabled) {
		border-color: var(--accent-color);
		color: var(--text-primary);
	}

	.back-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.play-button.small {
		padding: 0.5rem 1rem;
		font-size: 0.75rem;
		border: 1px solid var(--border-color);
		background: var(--card-bg);
		color: var(--text-primary);
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.play-button.small:hover:not(:disabled) {
		border-color: var(--accent-color);
		color: var(--accent-color);
	}

	/* Initial State */
	.initial-state {
		text-align: center;
		padding: 2rem;
	}

	.cta-content {
		max-width: 400px;
		margin: 0 auto;
	}

	.cta-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.cta-content h4 {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0 0 0.75rem 0;
		color: var(--text-primary);
	}

	.cta-content p {
		color: var(--text-secondary);
		margin: 0 0 1.5rem 0;
		line-height: 1.5;
	}

	/* Recording Controls Updates */
	.recording-controls {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
		flex-wrap: wrap;
		margin-bottom: 1rem;
	}

	.record-button {
		padding: 0.875rem 1.5rem;
		border: 2px solid var(--border-color);
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		background: var(--card-bg);
		color: var(--text-primary);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.record-button.recording {
		background: #dc2626;
		border-color: #dc2626;
		color: white;
		animation: recording-pulse 2s infinite;
	}

	@keyframes recording-pulse {
		0%, 100% { 
			transform: scale(1);
			box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.7);
		}
		50% { 
			transform: scale(1.05);
			box-shadow: 0 0 0 10px rgba(220, 38, 38, 0);
		}
	}

	.record-button:hover:not(:disabled):not(.recording) {
		border-color: var(--accent-color);
		background: color-mix(in srgb, var(--accent-color) 5%, var(--card-bg));
	}

	.play-button {
		padding: 0.75rem 1.25rem;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		background: var(--card-bg);
		color: var(--text-primary);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.play-button:hover:not(:disabled) {
		border-color: var(--accent-color);
		color: var(--accent-color);
		transform: translateY(-1px);
	}

	.recording-status {
		font-size: 0.875rem;
		color: var(--text-secondary);
		padding: 0.75rem;
		text-align: center;
		border-radius: 6px;
		background: var(--bg-color);
		border: 1px solid var(--border-color);
		margin-bottom: 1rem;
	}

	.recording-status.recording {
		color: #dc2626;
		background: color-mix(in srgb, #dc2626 8%, var(--bg-color));
		border-color: color-mix(in srgb, #dc2626 20%, var(--border-color));
		font-weight: 500;
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

	/* Responsive Design */
	@media (max-width: 640px) {
		.prompt-header {
			flex-direction: column;
			gap: 0.75rem;
			align-items: stretch;
		}
		
		.refresh-text-btn {
			align-self: flex-end;
			width: fit-content;
		}
		
		.recording-controls {
			flex-direction: column;
			align-items: center;
		}
		
		.recording-controls button {
			width: 100%;
			max-width: 200px;
		}
		
		.naming-actions {
			flex-direction: column;
			gap: 0.75rem;
		}
		
		.step-navigation {
			text-align: center;
		}
		
		.consent-item {
			padding: 1rem;
		}
		
		.consent-text {
			font-size: 0.8rem;
		}
		
		.voice-card {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}
		
		.voice-actions {
			justify-content: center;
		}
	}

	/* Enhanced Visual Feedback */
	.voice-tab.custom-voice {
		border: 2px solid #10b981;
		background: color-mix(in srgb, #10b981 8%, transparent);
		position: relative;
	}

	.voice-tab.custom-voice::before {
		content: "✨";
		position: absolute;
		top: -2px;
		right: -2px;
		font-size: 0.75rem;
	}

	.voice-tab.custom-voice.active {
		border-color: #10b981;
		background: color-mix(in srgb, #10b981 15%, var(--card-bg));
		color: #10b981;
	}
</style>