<!-- src/lib/components/CustomAudioPlayer.svelte -->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	export let audioSrc: string = '';
	export let title: string = 'Generated Hebrew Audio';
	export let subtitle: string = 'Text-to-Speech';

	let audio: HTMLAudioElement;
	let isPlaying = false;
	let isDragging = false;
	let currentVolume = 1;
	let isLoading = false;
	let progress = 0;
	let currentTime = 0;
	let duration = 0;
	let volume = 1;

	// Generate waveform bars (for visual effect)
	let waveformBars: number[] = [];

	$: formattedCurrentTime = formatTime(currentTime);
	$: formattedDuration = formatTime(duration);
	$: volumeIcon = getVolumeIcon(volume);
	$: playIcon = isPlaying ? '⏸' : '▶';

	onMount(() => {
		generateWaveform();
		if (audio) {
			audio.volume = 1;
		}
	});

	function generateWaveform() {
		waveformBars = Array.from({ length: 50 }, () => Math.random() * 30 + 5);
	}

	function formatTime(seconds: number): string {
		if (isNaN(seconds)) return '0:00';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return mins + ':' + secs.toString().padStart(2, '0');
	}

	function getVolumeIcon(vol: number): string {
		if (vol === 0) return '🔇';
		if (vol < 0.5) return '🔉';
		return '🔊';
	}

	function togglePlay() {
		if (!audio) return;
		
		if (isPlaying) {
			audio.pause();
		} else {
			audio.play().catch(console.error);
		}
	}

	function handleTimeUpdate() {
		if (!audio || isDragging) return;
		currentTime = audio.currentTime;
		progress = (currentTime / duration) * 100;
	}

	function handleLoadedMetadata() {
		if (!audio) return;
		duration = audio.duration;
	}

	function handlePlay() {
		isPlaying = true;
	}

	function handlePause() {
		isPlaying = false;
	}

	function handleEnded() {
		isPlaying = false;
		progress = 0;
		currentTime = 0;
	}

	function handleLoadStart() {
		isLoading = true;
	}

	function handleCanPlay() {
		isLoading = false;
	}

	function seek(event: MouseEvent) {
		if (!audio) return;
		const progressBar = event.currentTarget as HTMLElement;
		const rect = progressBar.getBoundingClientRect();
		const percent = (event.clientX - rect.left) / rect.width;
		const time = percent * duration;
		audio.currentTime = time;
	}

	function handleVolumeChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const newVolume = parseInt(target.value) / 100;
		volume = newVolume;
		if (audio) {
			audio.volume = newVolume;
		}
	}

	function toggleMute() {
		if (!audio) return;
		if (audio.volume > 0) {
			currentVolume = audio.volume;
			audio.volume = 0;
			volume = 0;
		} else {
			audio.volume = currentVolume;
			volume = currentVolume;
		}
	}

	function download() {
		if (audioSrc) {
			const a = document.createElement('a');
			a.href = audioSrc;
			a.download = 'hebrew-tts-audio.wav';
			a.click();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.code === 'Space' && event.target === document.body) {
			event.preventDefault();
			togglePlay();
		}
	}

	onDestroy(() => {
		if (audio) {
			audio.pause();
		}
	});
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="audio-player" class:loading={isLoading}>
	<div class="player-header">
		<button class="play-button" on:click={togglePlay} disabled={!audioSrc}>
			<span>{playIcon}</span>
		</button>
		<div class="track-info">
			<h3 class="track-title">{title}</h3>
			<p class="track-subtitle">{subtitle}</p>
		</div>
	</div>

	<div class="waveform">
		{#each waveformBars as height, i}
			<div 
				class="waveform-bar" 
				class:active={i < (progress / 100) * waveformBars.length}
				style="height: {height}px"
			></div>
		{/each}
	</div>

	<div class="progress-container">
		<div 
			class="progress-bar" 
			on:click={seek}
			on:mousedown={() => isDragging = true}
			on:mouseup={() => isDragging = false}
			role="slider"
			tabindex="0"
		>
			<div class="progress-fill" style="width: {progress}%"></div>
			<div class="progress-handle" style="left: {progress}%"></div>
		</div>
		<div class="time-display">
			<span>{formattedCurrentTime}</span>
			<span>{formattedDuration}</span>
		</div>
	</div>

	<div class="controls">
		<div class="volume-container">
			<button class="volume-button" on:click={toggleMute}>
				{volumeIcon}
			</button>
			<input 
				type="range" 
				class="volume-slider" 
				min="0" 
				max="100" 
				value={volume * 100}
				on:input={handleVolumeChange}
			/>
		</div>
		<button class="download-button" on:click={download} disabled={!audioSrc}>
			Download
		</button>
	</div>
</div>

<audio
	bind:this={audio}
	src={audioSrc}
	preload="metadata"
	on:timeupdate={handleTimeUpdate}
	on:loadedmetadata={handleLoadedMetadata}
	on:play={handlePlay}
	on:pause={handlePause}
	on:ended={handleEnded}
	on:loadstart={handleLoadStart}
	on:canplay={handleCanPlay}
	style="display: none;"
></audio>

<style>
	.audio-player {
		background: var(--card-bg);
		border: 1px solid var(--border-color);
		border-radius: 16px;
		padding: 1.5rem;
		max-width: 500px;
		box-shadow: var(--shadow);
		transition: opacity 0.3s ease;
	}

	.loading {
		opacity: 0.6;
		pointer-events: none;
	}

	.player-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.play-button {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: var(--accent-color);
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 1.2rem;
		transition: all 0.2s ease;
		flex-shrink: 0;
	}

	.play-button:hover:not(:disabled) {
		background: var(--accent-hover);
		transform: scale(1.05);
	}

	.play-button:active {
		transform: scale(0.95);
	}

	.play-button:disabled {
		background: #9ca3af;
		cursor: not-allowed;
		transform: none;
	}

	.track-info {
		flex: 1;
		min-width: 0;
	}

	.track-title {
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 0.25rem 0;
		font-size: 1rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.track-subtitle {
		color: var(--text-secondary);
		margin: 0;
		font-size: 0.875rem;
	}

	.waveform {
		display: flex;
		align-items: center;
		gap: 2px;
		height: 40px;
		margin: 1rem 0;
		justify-content: center;
	}

	.waveform-bar {
		background: var(--border-color);
		width: 3px;
		border-radius: 2px;
		transition: all 0.3s ease;
	}

	.waveform-bar.active {
		background: var(--accent-color);
	}

	.progress-container {
		margin: 1rem 0;
	}

	.progress-bar {
		width: 100%;
		height: 6px;
		background: var(--border-color);
		border-radius: 3px;
		position: relative;
		cursor: pointer;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: var(--accent-color);
		border-radius: 3px;
		transition: width 0.1s ease;
	}

	.progress-handle {
		position: absolute;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 16px;
		height: 16px;
		background: var(--accent-color);
		border-radius: 50%;
		opacity: 0;
		transition: opacity 0.2s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.progress-bar:hover .progress-handle {
		opacity: 1;
	}

	.time-display {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin-top: 0.5rem;
		font-variant-numeric: tabular-nums;
	}

	.controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 1rem;
	}

	.volume-container {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.volume-button {
		background: none;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 6px;
		transition: all 0.2s ease;
	}

	.volume-button:hover {
		background: var(--bg-color);
		color: var(--text-primary);
	}

	.volume-slider {
		width: 80px;
		height: 4px;
		background: var(--border-color);
		border-radius: 2px;
		outline: none;
		appearance: none;
		cursor: pointer;
	}

	.volume-slider::-webkit-slider-thumb {
		appearance: none;
		width: 14px;
		height: 14px;
		background: var(--accent-color);
		border-radius: 50%;
		cursor: pointer;
	}

	.volume-slider::-moz-range-thumb {
		width: 14px;
		height: 14px;
		background: var(--accent-color);
		border-radius: 50%;
		cursor: pointer;
		border: none;
	}

	.download-button {
		background: var(--bg-color);
		border: 1px solid var(--border-color);
		color: var(--text-primary);
		padding: 0.5rem 1rem;
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.875rem;
		transition: all 0.2s ease;
	}

	.download-button:hover:not(:disabled) {
		background: var(--border-color);
	}

	.download-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 480px) {
		.controls {
			flex-direction: column;
			gap: 1rem;
		}

		.volume-container {
			order: 1;
		}

		.download-button {
			order: 2;
			align-self: stretch;
			text-align: center;
		}
	}
</style>
