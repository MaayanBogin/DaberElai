<!-- src/lib/components/TTSSection.svelte -->
<script lang="ts">
    import CustomAudioPlayer from '$lib/components/CustomAudioPlayer.svelte';

    export let textInput: string;
    export let voiceList;
    export let selectedVoiceId: string;
    export let textCharCount;
    export let generateAudio;
    export let isLoading;
    export let generatedAudioUrl;
</script>

<div class="tts-section">
	<div class="section-header">
		<h1>Text to Speech</h1>
		<p>Generate natural Hebrew speech from text</p>
	</div>
	
	<div class="tts-component">
		<div class="text-area-wrapper">
			<textarea
				bind:value={textInput}
				class="text-input"
				placeholder="הזן טקסט כאן..."
			/>
			<div class="floating-tabs">
				{#each voiceList as voice (voice.id)}
                <div
                    class="voice-tab"
                    class:active={selectedVoiceId === voice.id}
                    class:custom-voice={voice.isCustom}
                    on:click={() => (selectedVoiceId = voice.id)}
                    role="button"
                    tabindex="0"
                    on:keydown={(e) => e.key === 'Enter' && (selectedVoiceId = voice.id)}
                >
					<span class="voice-name">{voice.name}</span>
					<span class="voice-description">{voice.description}</span>
				</div>
				{/each}
			</div>
		</div>
		<div class="bottom-controls">
			<select bind:value={selectedVoiceId} class="voice-select">
				{#each voiceList as voice (voice.id)}
					<option value={voice.id}>{voice.name}</option>
				{/each}
			</select>
			<div class="generation-tools">
				<div class="char-count">{textCharCount}/1000</div>
				<button
					class="generate-button"
					on:click={generateAudio}
					disabled={isLoading || !textInput.trim()}
				>
					{#if isLoading}
						<div class="loading-spinner" />
						מפיק...
					{:else}
						הפק
					{/if}
				</button>
			</div>
		</div>
	</div>

    {#if generatedAudioUrl}
        <CustomAudioPlayer 
            audioSrc={generatedAudioUrl}
            title="Generated Hebrew Audio"
            subtitle="Text-to-Speech"
        />
    {/if}
</div>

<style>
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

	/* TTS Component Styles (unchanged) */
	.tts-component {
		background-color: var(--card-bg);
		border: 1px solid var(--border-color);
		border-radius: 16px;
		box-shadow: var(--shadow);
		display: flex;
		flex-direction: column;
		height: 380px;
		overflow: hidden;
		margin-bottom: 1.5rem;
	}

	.text-area-wrapper {
		position: relative;
		flex-grow: 1;
		display: flex;
	}

	.text-input {
		width: 100%;
		height: 100%;
		padding: 24px;
		border: none;
		outline: none;
		resize: none;
		font-size: 18px;
		line-height: 1.6;
		background-color: transparent;
		color: var(--text-primary);
	}

	.floating-tabs {
		position: absolute;
		bottom: 20px;
		right: 24px;
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.voice-tab {
		background-color: color-mix(in srgb, var(--card-bg) 95%, black);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		padding: 6px 12px;
		font-size: 13px;
		cursor: pointer;
		transition: all 0.2s ease;
		user-select: none;
	}

	.voice-tab:hover {
		transform: translateY(-2px);
		border-color: #9ca3af;
	}

	.voice-tab.active {
		border-color: var(--accent-color);
		background-color: color-mix(in srgb, var(--accent-color) 10%, var(--card-bg));
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-color) 20%, transparent);
	}

	.voice-tab .voice-name {
		font-weight: 600;
		color: var(--text-primary);
	}

	.voice-tab .voice-description {
		color: var(--text-secondary);
		margin-right: 6px;
	}

	.bottom-controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 24px;
		border-top: 1px solid var(--border-color);
	}

	.voice-select {
		padding: 0.5rem 1rem;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		background: var(--bg-color);
		color: var(--text-primary);
		font-size: 0.875rem;
		cursor: pointer;
	}

	.generation-tools {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.char-count {
		font-size: 0.875rem;
		color: var(--text-secondary);
		direction: ltr;
		font-variant-numeric: tabular-nums;
	}

	.generate-button {
		background: var(--accent-color);
		color: white;
		border: none;
		border-radius: 8px;
		padding: 12px 24px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.generate-button:hover:not(:disabled) {
		background: var(--accent-hover);
		transform: translateY(-1px);
	}

	.generate-button:disabled {
		background-color: #9ca3af;
		cursor: not-allowed;
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

	/* Custom voice styling */
	.voice-tab.custom-voice {
		border: 2px solid #10b981;
		background: color-mix(in srgb, #10b981 8%, transparent);
	}

	.voice-tab.custom-voice.active {
		border-color: #10b981;
		background: color-mix(in srgb, #10b981 15%, var(--card-bg));
		color: #10b981;
	}
</style>