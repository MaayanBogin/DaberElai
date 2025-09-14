<!-- src/routes/labs/+page.svelte -->
<script lang="ts">
	import { page } from '$app/stores';
    import theme from '$lib/theme';
	import { onDestroy, onMount } from 'svelte';
    import CustomAudioPlayer from '$lib/components/CustomAudioPlayer.svelte';

	// --- TYPES AND INTERFACES ---
	interface Voice {
		id: string;
		name: string;
		description: string;
		url: string;
        isCustom : boolean;
	}

	// --- VOICE CONFIGURATION ---
	const voices: Record<string, Voice> = {
		mark: {
			id: 'mark',
			name: 'מארק',
			description: 'דובר יומיומי',
			url: 'https://jjrywtbchflizypxwfdy.supabase.co/storage/v1/object/public/voice-clips/voice-recording-1757499088766.wav',
            isCustom: false
		},
		olivia: {
			id: 'olivia',
			name: 'אוליביה',
			description: 'חברה עצובה',
			url: 'https://jjrywtbchflizypxwfdy.supabase.co/storage/v1/object/public/voice-clips/voice-recording-1757440627607.wav',
            isCustom: false
		},
		hades: {
			id: 'hades',
			name: 'האדס',
			description: 'קריין סיפורים',
			url: '/voices/hades.wav',
            isCustom: false
		},
		dennis: {
			id: 'dennis',
			name: 'דניס',
			description: 'מצגת עסקית',
			url: 'https://jjrywtbchflizypxwfdy.supabase.co/storage/v1/object/public/voice-clips/podcastbit.wav',
            isCustom: false
		}
	};
	let voiceList: Voice[] = Object.values(voices);

	// --- SIDEBAR NAVIGATION ---
	const sidebarItems = [
		{ id: 'tts', label: 'TTS' },
		{ id: 'voice-lab', label: 'Voice Lab' },
		{ id: 'settings', label: 'Settings' }
	];

	// --- COMPONENT STATE ---
	let textInput = 'שלום וברוכים הבאים לעולם המרתק של טכנולוגיית הדיבור המתקדמת.';
	let selectedVoiceId = 'mark';
	let isLoading = false;
	let generatedAudioUrl: string | null = null;
	let taskId: string | null = null;
	let pollingInterval: number | null = null;
	let userTokens: number = 0;
	let activeTab = 'tts';
	
	// Settings state
	// let darkMode = false;
	let showCancelModal = false;
	
	let temperature = 0.8;
	let nikudEnabled = false;

    let customVoices: any[] = [];
    let isRecording = false;
    let recordedBlob: Blob | null = null;
    let mediaRecorder: MediaRecorder | null = null;
    let audioChunks: BlobPart[] = [];
    let recordingStatus = 'Ready to record';
    let voiceName = '';
    let isUploading = false;

	// --- REACTIVE DERIVED STATE ---
	$: textCharCount = textInput.length;
	$: selectedVoiceUrl = (() => {
    if (selectedVoiceId.startsWith('custom_')) {
        const customVoiceId = selectedVoiceId.replace('custom_', '');
        const customVoice = customVoices.find(v => v.id === customVoiceId);
        return customVoice?.url || '';
    }
    return voices[selectedVoiceId]?.url || '';
})();

	// --- DARK MODE HANDLING ---
	// function toggleDarkMode() {
	// 	darkMode = !darkMode;
	// 	document.documentElement.classList.toggle('dark', darkMode);
	// 	localStorage.setItem('darkMode', darkMode.toString());
	// }

	// --- AUTHENTICATION & DATA FETCHING ---
	function requireAuth() {
		if (!$page.data.session?.user) {
			window.location.href = '/';
			return false;
		}
		return true;
	}

	async function fetchUserTokens() {
		if (!$page.data.session?.user) return;
		try {
			const response = await fetch('/api/user/tokens');
			if (response.ok) {
				const data = await response.json();
				userTokens = data.tokens;
			}
		} catch (error) {
			console.error('Error fetching tokens:', error);
		}
	}

    async function fetchCustomVoices() {
    if (!$page.data.session?.user) return;
    
    try {
        const response = await fetch('/api/voices');
        if (response.ok) {
            customVoices = await response.json();
            // Refresh the voice list to include custom voices
            refreshVoiceList();
        }
    } catch (error) {
        console.error('Error fetching custom voices:', error);
    }
}

function refreshVoiceList() {
    // Add custom voices to the voice list with green styling
    const customVoiceEntries = customVoices.map(voice => ({
        id: `custom_${voice.id}`,
        name: voice.name,
        description: 'Custom Voice',
        url: voice.url,
        isCustom: true
    }));
    
    voiceList = [...Object.values(voices), ...customVoiceEntries];
}

async function startRecording(): Promise<void> {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };
        
        mediaRecorder.onstop = () => {
            recordedBlob = new Blob(audioChunks);
            stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        isRecording = true;
        recordingStatus = 'Recording...';
    } catch (error) {
        alert('Microphone access needed');
        console.error('Recording error:', error);
    }
}

function stopRecording(): void {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        recordingStatus = 'Recording complete. You can now save your voice.';
    }
}

function playRecording(): void {
    if (recordedBlob) {
        const audio = new Audio(URL.createObjectURL(recordedBlob));
        audio.play().catch(console.error);
    }
}

async function blobToWav(blob: Blob): Promise<Blob> {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const pcmData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);

    const wavData = new DataView(new ArrayBuffer(44 + pcmData.length * 2));

    let offset = 0;
    wavData.setUint32(offset, 0x52494646, false); offset += 4;
    wavData.setUint32(offset, 36 + pcmData.length * 2, true); offset += 4;
    wavData.setUint32(offset, 0x57415645, false); offset += 4;
    wavData.setUint32(offset, 0x666d7420, false); offset += 4;
    wavData.setUint32(offset, 16, true); offset += 4;
    wavData.setUint16(offset, 1, true); offset += 2;
    wavData.setUint16(offset, numChannels, true); offset += 2;
    wavData.setUint32(offset, sampleRate, true); offset += 4;
    wavData.setUint32(offset, byteRate, true); offset += 4;
    wavData.setUint16(offset, blockAlign, true); offset += 2;
    wavData.setUint16(offset, bitsPerSample, true); offset += 2;
    wavData.setUint32(offset, 0x64617461, false); offset += 4;
    wavData.setUint32(offset, pcmData.length * 2, true); offset += 4;

    for (let i = 0; i < pcmData.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, pcmData[i]));
        wavData.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return new Blob([wavData], { type: 'audio/wav' });
}

async function saveVoice(): Promise<void> {
    if (!requireAuth()) return;
    if (!recordedBlob) {
        alert('Please record your voice first.');
        return;
    }
    if (!voiceName.trim()) {
        alert('Please enter a voice name.');
        return;
    }

    isUploading = true;
    recordingStatus = 'Uploading and saving voice...';

    try {
        const wavBlob = await blobToWav(recordedBlob);
        
        const formData = new FormData();
        formData.append('audio', wavBlob);
        formData.append('voiceName', voiceName.trim());

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.error || 'Upload failed');
        }

        const result = await response.json();
        recordingStatus = 'Voice saved successfully!';
        
        // Reset form
        voiceName = '';
        recordedBlob = null;
        
        // Refresh custom voices list
        await fetchCustomVoices();
        
        alert('Voice saved successfully! You can now use it for TTS.');
        
    } catch (error: any) {
        console.error('Upload Error:', error);
        alert(`Failed to save voice: ${error.message}`);
        recordingStatus = 'Upload failed. Please try again.';
    } finally {
        isUploading = false;
    }
}

async function deleteVoice(voiceId: string) {
    if (!confirm('Are you sure you want to delete this voice?')) return;
    
    try {
        const response = await fetch(`/api/voices/${voiceId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await fetchCustomVoices();
            alert('Voice deleted successfully.');
        } else {
            const error = await response.json();
            alert(`Failed to delete voice: ${error.message}`);
        }
    } catch (error) {
        console.error('Error deleting voice:', error);
        alert('Failed to delete voice. Please try again.');
    }
}

	// --- SUBSCRIPTION MANAGEMENT ---
	async function cancelSubscription() {
		try {
			const response = await fetch('/api/subscription/cancel', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});
			
			if (response.ok) {
				alert('Subscription cancelled successfully. You can continue using the service until the end of your billing period.');
				showCancelModal = false;
			} else {
				const error = await response.json();
				alert(`Failed to cancel subscription: ${error.message}`);
			}
		} catch (error) {
			console.error('Error cancelling subscription:', error);
			alert('Failed to cancel subscription. Please try again.');
		}
	}

	// --- CONTACT FORM ---
	let contactForm = {
		subject: '',
		message: '',
		isSubmitting: false
	};

	async function submitContactForm() {
		if (!contactForm.subject.trim() || !contactForm.message.trim()) {
			alert('Please fill in both subject and message fields.');
			return;
		}

		contactForm.isSubmitting = true;
		try {
			const response = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					subject: contactForm.subject,
					message: contactForm.message,
					userEmail: $page.data.session?.user?.email
				})
			});

			if (response.ok) {
				alert('Message sent successfully! We\'ll get back to you soon.');
				contactForm.subject = '';
				contactForm.message = '';
			} else {
				const error = await response.json();
				alert(`Failed to send message: ${error.message}`);
			}
		} catch (error) {
			console.error('Error sending contact form:', error);
			alert('Failed to send message. Please try again.');
		} finally {
			contactForm.isSubmitting = false;
		}
	}

	// --- CORE API LOGIC ---
	const checkTaskStatus = async (id: string) => {
		try {
			const response = await fetch(`/api/task/${id}`);
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `Failed to fetch task status`);
			}
			return await response.json();
		} catch (error: any) {
			console.error(error);
			alert(`Error checking task status: ${error.message}`);
			return null;
		}
	};

	const pollTaskStatus = (id: string) => {
		isLoading = true;
		pollingInterval = window.setInterval(async () => {
			const statusData = await checkTaskStatus(id);
			if (!statusData) return;
			if (statusData.status === 'COMPLETE') {
				if (pollingInterval) clearInterval(pollingInterval);
				if (Array.isArray(statusData.outputs) && statusData.outputs.length > 0) {
					generatedAudioUrl = statusData.outputs[0].url || statusData.outputs[0];
				} else {
					alert('API response missing audio output.');
				}
				isLoading = false;
				taskId = null;
			} else if (['FAILED', 'CANCELLED', 'TIMEOUT', 'EXPIRED'].includes(statusData.status)) {
				if (pollingInterval) clearInterval(pollingInterval);
				alert(`Task ended with status: ${statusData.status}`);
				isLoading = false;
				taskId = null;
			}
		}, 3000);
	};

	// --- GENERATION FUNCTION ---
async function generateAudio(): Promise<void> {
    if (!requireAuth()) return;
    if (!textInput.trim()) {
        alert('Enter Hebrew text to generate.');
        return;
    }
    if (isLoading) {
        alert('Please wait for the current task to complete.');
        return;
    }
    if (userTokens < 1) {
        alert('You have no tokens remaining. Please upgrade your plan.');
        return;
    }
    isLoading = true;
    generatedAudioUrl = null;
    try {
        const payload = {
            prompt: textInput,
            nikud: nikudEnabled,
            ref_audio: selectedVoiceUrl,
            temperature: temperature
        };
        const response = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || `HTTP error! status: ${response.status}`);
        }
        if (result.remainingTokens !== undefined) {
            userTokens = result.remainingTokens;
        }
        if (result.task_id) {
            taskId = result.task_id;
            pollTaskStatus(taskId!);
        } else {
            throw new Error('API did not return a task_id.');
        }
    } catch (error: any) {
        console.error('Audio Generation Error:', error);
        alert(`Failed to generate audio: ${error.message}`);
        isLoading = false;
        fetchUserTokens();
    }
}

	// --- NAVIGATION ---
	function switchTab(tabId: string) {
		activeTab = tabId;
	}

	onMount(() => {
		if ($page.data.session?.user) {
            fetchCustomVoices();
			fetchUserTokens();
		}
		
		// Load dark mode preference
		// const savedDarkMode = localStorage.getItem('darkMode');
		// if (savedDarkMode === 'true') {
		// 	darkMode = true;
		// 	document.documentElement.classList.add('dark');
		// }
	});

	onDestroy(() => {
		if (pollingInterval) clearInterval(pollingInterval);
	});
</script>

<div class="labs-container">
	<!-- Sidebar -->
	<aside class="sidebar">
		<div class="sidebar-header">
			<a href="/" class="logo">Daber Elai</a>
			<div class="labs-badge">Labs</div>
		</div>
		
		<!-- Simple vertical tabs -->
		<nav class="tab-nav">
			{#each sidebarItems as item}
				<button 
					class="tab-item" 
					class:active={activeTab === item.id}
					on:click={() => switchTab(item.id)}
				>
					{item.label}
				</button>
			{/each}
		</nav>
		
		<div class="sidebar-footer">
			<div class="token-info">
				<span class="token-label">Tokens</span>
				<span class="token-count">{userTokens}</span>
			</div>
		</div>
	</aside>

	<!-- Main Content -->
	<main class="main-content">
		{#if activeTab === 'tts'}
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
		{:else if activeTab === 'voice-lab'}
    <div class="voice-lab-section">
        <div class="section-header">
            <h1>Voice Lab</h1>
            <p>Create and manage custom voices</p>
        </div>
        
        <!-- Voice Recording -->
        <div class="voice-lab-card">
            <h3>Record New Voice</h3>
            <p class="card-description">Record a sample to create your custom voice</p>
            
            <div class="recording-section">
                <div class="form-group">
                    <label for="voiceName">Voice Name</label>
                    <input 
                        id="voiceName"
                        type="text" 
                        bind:value={voiceName}
                        placeholder="Enter voice name (e.g., My Podcast Voice)"
                        maxlength="50"
                        disabled={isUploading || isRecording}
                    />
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
                        {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </button>
                    
                    <button 
                        class="play-button"
                        on:click={playRecording}
                        disabled={!recordedBlob || isUploading || isRecording}
                    >
                        Play Recording
                    </button>
                    
                    <button 
                        class="save-button"
                        on:click={saveVoice}
                        disabled={!recordedBlob || !voiceName.trim() || isUploading}
                    >
                        {#if isUploading}
                            <div class="loading-spinner small" />
                            Saving...
                        {:else}
                            Save Voice
                        {/if}
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Custom Voices List -->
        <div class="voice-lab-card">
            <h3>Your Custom Voices</h3>
            <p class="card-description">Manage your saved voices</p>
            
            {#if customVoices.length === 0}
                <div class="empty-state">
                    <div class="empty-icon">🎤</div>
                    <p>No custom voices yet. Record your first voice above!</p>
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
		{:else if activeTab === 'settings'}
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
		{/if}
	</main>
</div>

<!-- Cancel Subscription Modal -->
{#if showCancelModal}
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
{/if}

<style>
	/* :root {
		--bg-color: #f9fafb;
		--text-primary: #111827;
		--text-secondary: #6b7280;
		--accent-color: #4f46e5;
		--accent-hover: #4338ca;
		--card-bg: #ffffff;
		--border-color: #e5e7eb;
		--sidebar-bg: #ffffff;
		--shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
		--danger-color: #dc2626;
		--danger-hover: #b91c1c;
		--success-color: #059669;
	}

	:global(.dark) {
		--bg-color: #111827;
		--text-primary: #f9fafb;
		--text-secondary: #9ca3af;
		--card-bg: #1f2937;
		--border-color: #374151;
		--sidebar-bg: #1f2937;
	}

	:global(body) {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
		background: var(--bg-color);
		color: var(--text-primary);
		margin: 0;
		padding: 0;
		transition: background-color 0.3s ease, color 0.3s ease;
	} */

	.labs-container {
		display: flex;
		height: 100vh;
		overflow: hidden;
	}

	/* Sidebar Styles */
	.sidebar {
		width: 240px;
		background: var(--sidebar-bg);
		border-right: 1px solid var(--border-color);
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
	}

	.sidebar-header {
		padding: 1.5rem;
		border-bottom: 1px solid var(--border-color);
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.logo {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		text-decoration: none;
	}

	.labs-badge {
		background: var(--accent-color);
		color: white;
		font-size: 0.75rem;
		font-weight: 500;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
	}

	/* Simple Tab Navigation */
	.tab-nav {
		flex: 1;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.tab-item {
		padding: 0.75rem 1rem;
		border: none;
		background: none;
		text-align: left;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.2s ease;
		border-radius: 6px;
	}

	.tab-item:hover {
		background: color-mix(in srgb, var(--accent-color) 8%, transparent);
		color: var(--text-primary);
	}

	.tab-item.active {
		background: color-mix(in srgb, var(--accent-color) 15%, transparent);
		color: var(--accent-color);
		font-weight: 600;
	}

	.sidebar-footer {
		padding: 1rem 1.5rem;
		border-top: 1px solid var(--border-color);
	}

	.token-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.875rem;
	}

	.token-label {
		color: var(--text-secondary);
	}

	.token-count {
		font-weight: 600;
		color: var(--text-primary);
	}

	/* Main Content */
	.main-content {
		flex: 1;
		overflow-y: auto;
		padding: 2rem;
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

	/* Settings Styles */
	.settings-section {
		max-width: 1200px;
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

	/* Modal */
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

	/* Audio Player */
	.audio-player {
		padding: 1rem;
		background: var(--card-bg);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		box-shadow: var(--shadow);
		animation: fadeIn 0.5s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.audio-player audio {
		width: 100%;
	}

	.download-link {
		display: inline-block;
		margin-top: 0.75rem;
		font-size: 0.875rem;
		color: var(--accent-color);
		text-decoration: none;
	}

	.download-link:hover {
		text-decoration: underline;
	}

	/* Placeholder Sections */
	.placeholder-section {
		text-align: center;
		padding: 4rem 2rem;
	}

	.placeholder-section h1 {
		font-size: 2rem;
		font-weight: 700;
		margin: 0 0 0.5rem 0;
	}

	.placeholder-section > p {
		color: var(--text-secondary);
		margin: 0 0 3rem 0;
	}

	.placeholder-content {
		background: var(--card-bg);
		border: 1px solid var(--border-color);
		border-radius: 16px;
		padding: 3rem;
		max-width: 400px;
		margin: 0 auto;
	}

	.placeholder-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.placeholder-content p {
		color: var(--text-secondary);
		margin: 0;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.labs-container {
			flex-direction: column;
		}

		.sidebar {
			width: 100%;
			height: auto;
		}

		.tab-nav {
			flex-direction: row;
			padding: 1rem;
			overflow-x: auto;
			gap: 0.5rem;
		}

		.tab-item {
			white-space: nowrap;
			flex-shrink: 0;
		}

		.main-content {
			padding: 1rem;
		}

		.settings-grid {
			grid-template-columns: 1fr;
		}

		.modal-content {
			margin: 1rem;
		}

		.modal-actions {
			flex-direction: column;
		}
	}
    /* Voice Lab Styles */
.voice-lab-section {
    max-width: 800px;
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

@media (max-width: 640px) {
    .recording-controls {
        flex-direction: column;
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
</style>