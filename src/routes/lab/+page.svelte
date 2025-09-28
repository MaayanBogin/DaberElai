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
        { id: 'billing', label: 'Billing' },
        { id: 'settings', label: 'Settings' }
    ];

	// --- COMPONENT STATE ---
	let textInput = 'שלום וברוכים הבאים לעולם המרתק של טכנולוגיית הדיבור המתקדמת.';
	let selectedVoiceId = 'mark';
	let isLoading = false;
	let generatedAudioUrl: string | null = null;
	let taskId: string | null = null;
	let pollingInterval: number | null = null;
	let activeTab = 'tts';
	
	// Settings state
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
    let showSuccessMessage = false;
    let portalError: string | null = null;

    let voiceCreationStep = 'initial'; // 'initial', 'consent', 'recording', 'naming'
    let consentChecks = {
    ownVoice: false,
    legalUse: false,
    noDeception: false,
    compliance: false
};
    let currentPromptText = '';

    // Hebrew text prompts for voice recording
    const hebrewPrompts = [
        "שלום וברוכים הבאים לעולם המרתק של טכנولוגיית הדיבור המתקדמת. אני כאן כדי לעזור לכם ליצור חוויה מותאמת אישית שתשנה את הדרך שבה אתם מתקשרים עם טכנולוגיה.",
        "בחיים המודרניים אנו נתקלים במגוון רחב של אתגרים ושל הזדמנויות. הטכנולוגיה החדשה מאפשרת לנו לחבר בין אנשים, לשתף רגשות ולהעביר מסרים בצורה מדויקת יותר מאי פעם.",
        "ארץ ישראל היא מקום מיוחד המלא בהיסטוריה, תרבות ומסורת. כל פינה בה מספרת סיפור, כל נוף חושף יופי וכל מפגש עם בני אדם מביא אתו חוכמה חדשה.",
        "הטבע סביבנו מלא בפלאים ויופי שקשה לתאר במילים. הים הכחול, ההרים הירוקים, השדות הפתוחים והיערות העבותים - כולם יוצרים מקום מושלם לחיים ולהתפתחות.",
        "חינוך הוא הבסיס לחברה טובה יותר. כאשר אנו משקיעים בלמידה ובהעברת ידע, אנו בונים עתיד טוב יותר לדורות הבאים ומעצימים את יכולתנו להתמודד עם אתגרים חדשים.",
        "המשפחה היא הבית הרגשי שלנו, המקום בו אנו מרגישים בטוחים ואהובים. יחד אנו חוגגים הצלחות, מתמודדים עם קשיים ובונים זכרונות שיישארו אתנו לכל החיים.",
        "היצירתיות היא כוח מניע חזק בחיים. כאשר אנו נותנים לדמיון שלנו לפרוח, אנו יוצרים דברים חדשים ומרגשים שמעשירים את העולם ומביאים שמחה לאנשים רבים.",
        "הספורט והפעילות הגופנית חשובים לבריאות שלנו ולרווחתנו. כאשר אנו שומרים על כושר גופני טוב, אנו מרגישים חזקים יותר, אופטימיים יותר ומוכנים לקרב כל אתגר.",
        "המוזיקה היא שפה אוניברסלית שמחברת בין לבבות. כל מלודיה, כל קצב וכל הרמוניה יכולים לעורר בנו רגשות עמוקים ולהביא אותנו למקומות חדשים בדמיון.",
        "הידידות האמיתית היא אוצר יקר שיש לטפח ולשמור עליו. חברים טובים הם אלה שתומכים בנו בזמנים קשים, חוגגים אתנו בשמחות ועוזרים לנו לגדול ולהתפתח."
    ];

    $: allConsentChecked = consentChecks.ownVoice && 
                       consentChecks.legalUse && 
                       consentChecks.noDeception && 
                       consentChecks.compliance;

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

    export let data
    $: userPlan = data?.user?.plan ?? 'Free';
    $: userTokens = data?.user?.tokens ?? 0;

	// --- AUTHENTICATION & DATA FETCHING ---
	function requireAuth() {
		if (!$page.data.session?.user) {
			window.location.href = '/';
			return false;
		}
		return true;
	}

    async function handleUpgrade() {
    if (!$page.data.session?.user) {
        alert('Please sign in to upgrade.');
        return;
    }
    isLoading = true;

    try {
        const response = await fetch('/api/checkout/embed', { method: 'POST' });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to start checkout.');
        }
        const { checkoutUrl } = await response.json();
        const { PolarEmbedCheckout } = await import('@polar-sh/checkout/embed');
        const checkout = await PolarEmbedCheckout.create(checkoutUrl, 'dark');
        checkout.addEventListener('close', () => (isLoading = false));
    } catch (error: any) {
        console.error('Checkout Error:', error);
        alert(`Error: ${error.message}`);
        isLoading = false;
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

    function startVoiceCreation() {
        voiceCreationStep = 'consent';
        // Reset all state
        consentChecks = {
            ownVoice: false,
            legalUse: false,
            noDeception: false,
            compliance: false
        };
        recordedBlob = null;
        voiceName = '';
        recordingStatus = 'Ready to record';
    }
    function generateNewPromptText() {
        const randomIndex = Math.floor(Math.random() * hebrewPrompts.length);
        currentPromptText = hebrewPrompts[randomIndex];
    }

    function proceedToRecording() {
        if (!allConsentChecked) {
            alert('Please complete all consent verification steps before proceeding.');
            return;
        }
        voiceCreationStep = 'recording';
        generateNewPromptText();
        recordingStatus = 'Read the text above and click "Start Recording" when ready';
    }

    function proceedToNaming() {
        if (!recordedBlob) {
            alert('Please record your voice first.');
            return;
        }
        voiceCreationStep = 'naming';
    }

    function backToConsent() {
        voiceCreationStep = 'consent';
        // Keep the recorded blob in case they want to go back
    }

    function backToRecording() {
        voiceCreationStep = 'recording';
    }

    function resetVoiceCreation() {
        voiceCreationStep = 'initial';
        consentChecks = {
            ownVoice: false,
            legalUse: false,
            noDeception: false,
            compliance: false
        };
        recordedBlob = null;
        voiceName = '';
        currentPromptText = '';
        recordingStatus = 'Ready to record';
        
        // Stop any ongoing recording
        if (mediaRecorder && isRecording) {
            stopRecording();
        }
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
        recordingStatus = 'Recording in progress... Speak clearly and naturally';
    } catch (error) {
        alert('Microphone access is required for voice recording. Please allow access and try again.');
        console.error('Recording error:', error);
    }
}

function stopRecording(): void {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        recordingStatus = 'Recording complete! You can play it back or move to the next step.';
    }
}

// Initialize prompt text on component mount (add this to your existing onMount function)
function initializeVoiceLab() {
    generateNewPromptText();
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
        
        // Success - reset the voice creation flow
        alert('Voice saved successfully! You can now use it for TTS.');
        resetVoiceCreation();
        
        // Refresh custom voices list
        await fetchCustomVoices();
        
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
    }
}

	// --- NAVIGATION ---
	function switchTab(tabId: string) {
		activeTab = tabId;
	}

	onMount(() => {
		if ($page.data.session?.user) {
            fetchCustomVoices();
            initializeVoiceLab();
		}
		
        // Billing initialization
        const url = new URL(window.location.href);

        if (url.searchParams.get('success') === 'true') {
            showSuccessMessage = true;
            activeTab = 'billing'; // Switch to billing tab on success
            url.searchParams.delete('success');
            window.history.replaceState({}, '', url.toString());
        }

        const errorParam = url.searchParams.get('error');
        if (errorParam === 'no_subscription') {
            portalError = "You don't have an active subscription to manage.";
            activeTab = 'billing';
        } else if (errorParam === 'portal_failed') {
            portalError = 'Could not open the customer portal. Please try again later or contact support.';
            activeTab = 'billing';
        }
        if (portalError) {
            url.searchParams.delete('error');
            window.history.replaceState({}, '', url.toString());
        }
    });

	onDestroy(() => {
		if (pollingInterval) clearInterval(pollingInterval);
	});
</script>

<main class="labs-container">
	<div class="background-overlay"></div>

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
	<section class="main-content">
		{#if activeTab === 'tts'}
			<div class="content-wrapper">
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
							dir="rtl"
						></textarea>
						
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

{:else if activeTab === 'voice-lab'}
    <div class="content-wrapper">
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
                        <div class="step-badge">Step 1 of 3</div>
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
                                class="proceed-button"
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
                        <div class="step-badge">Step 2 of 3</div>
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
                        <div class="step-badge">Step 3 of 3</div>
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
        
        <!-- Existing Custom Voices List -->
        <div class="custom-voices-card">
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
                                    class="play-voice"
                                    on:click={() => {
                                        const audio = new Audio(voice.url);
                                        audio.play().catch(console.error);
                                    }}
                                >
                                    Play
                                </button>
                                <button 
                                    class="delete-voice"
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

    {:else if activeTab === 'billing'}
    <div class="content-wrapper">
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
            <div class="pro-dashboard">
                <div class="card-header">
                    <div class="plan-info">
                        <div class="plan-icon">💳</div>
                        <div>
                            <h2 class="plan-name">Pro Plan</h2>
                            <span class="status-badge active">Active</span>
                        </div>
                    </div>
                    <div class="token-display">
                        <span class="token-label">Available Tokens</span>
                        <span class="token-count">{userTokens}</span>
                        <div class="token-progress">
                            <div class="progress-bar" style="width: {(userTokens / 1000) * 100}%"></div>
                        </div>
                    </div>
                </div>

                <p class="plan-description">
                    You have full access to all Pro features with unlimited potential.
                </p>

                <div class="features-grid">
                    <div class="feature-item">
                        <div class="feature-icon">🎯</div>
                        <div>
                            <span class="feature-title">1000 Tokens per Month</span>
                            <p class="feature-desc">Refresh monthly</p>
                        </div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">🎤</div>
                        <div>
                            <span class="feature-title">All Premium Voices</span>
                            <p class="feature-desc">Access to voice library</p>
                        </div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">🔧</div>
                        <div>
                            <span class="feature-title">Up to 3 Custom Voices</span>
                            <p class="feature-desc">Create your own</p>
                        </div>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">⚡</div>
                        <div>
                            <span class="feature-title">Priority Support</span>
                            <p class="feature-desc">Get help faster</p>
                        </div>
                    </div>
                </div>

                <div class="management-section">
                    <div>
                        <p class="management-title">Manage Subscription</p>
                        <p class="management-desc">Update payment methods, view invoices, or manage your subscription</p>
                    </div>
                    <a href="/api/portal" class="portal-button" data-sveltekit-reload>
                        💳 Customer Portal
                    </a>
                </div>
            </div>
        {:else}
            <!-- Free User Upgrade View -->
            <div class="plan-comparison">
                <div class="plan-card current">
                    <div class="plan-header">
                        <h3>Free Plan</h3>
                        <span class="current-badge">Current</span>
                    </div>
                    <div class="plan-price">
                        <span class="price">$0</span>
                        <span class="period">/month</span>
                    </div>
                    <div class="token-info">
                        <span>Your Tokens:</span>
                        <span class="token-count">{userTokens}</span>
                    </div>
                    <ul class="features-list">
                        <li>✅ 3 Free Tokens on Signup</li>
                        <li>✅ Basic TTS Features</li>
                        <li>✅ Create 1 Custom Voice</li>
                        <li>✅ Community Support</li>
                    </ul>
                </div>

                <div class="plan-card pro">
                    <div class="most-popular">Most Popular</div>
                    <div class="plan-header">
                        <h3>Pro Plan</h3>
                        <div class="plan-icon">💳</div>
                    </div>
                    <div class="plan-price">
                        <span class="price">$10</span>
                        <span class="period">/month</span>
                    </div>
                    <div class="upgrade-highlight">
                        ✨ Unlock unlimited creativity
                    </div>
                    <ul class="features-list">
                        <li>✅ 1000 Tokens per Month</li>
                        <li>✅ All Premium Voices</li>
                        <li>✅ Create up to 3 Custom Voices</li>
                        <li>✅ Priority Support</li>
                        <li>✅ Advanced Voice Settings</li>
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
                            💳 Upgrade to Pro
                        {/if}
                    </button>
                </div>
            </div>
        {/if}

        <!-- Usage Information -->
        <div class="usage-info-card">
            <h3>Usage Overview</h3>
            <div class="usage-grid">
                <div class="usage-item">
                    <span class="usage-label">Current Plan</span>
                    <span class="usage-value">{userPlan}</span>
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
                <p>💡 Tokens are used each time you generate speech. One token typically generates 30-60 seconds of audio.</p>
            </div>
        </div>
    </div>

		{:else if activeTab === 'settings'}
			<div class="content-wrapper">
				<div class="section-header">
					<h1>Settings</h1>
					<p>Configure your preferences and manage your account</p>
				</div>
				
				<div class="settings-grid">
					<!-- Appearance Settings -->
					<div class="settings-card">
						<div class="card-header">
							<div class="card-icon">🎨</div>
							<h3>Appearance</h3>
						</div>
						<div class="setting-item">
							<label class="setting-label">
								<div>
									<span class="setting-name">Dark Mode</span>
									<p class="setting-desc">Toggle dark theme</p>
								</div>
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
						<div class="card-header">
							<div class="card-icon">💳</div>
							<h3>Account Information</h3>
						</div>
						<div class="info-rows">
							<div class="info-row">
								<span class="info-label">Email:</span>
								<span class="info-value">{$page.data.session?.user?.email || 'Not available'}</span>
							</div>
							<div class="info-row">
								<span class="info-label">Tokens Remaining:</span>
								<span class="info-value primary">{userTokens}</span>
							</div>
							<div class="info-row">
								<span class="info-label">Plan:</span>
								<span class="info-badge {userPlan === 'Pro' ? 'pro' : ''}">{userPlan}</span>
							</div>
						</div>
					</div>

					<!-- Contact Support -->
					<div class="settings-card full-width">
						<div class="card-header">
							<div class="card-icon">⚠️</div>
							<h3>Contact Support</h3>
						</div>
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
							<div class="form-actions">
								<button 
									type="submit" 
									class="submit-button"
									disabled={contactForm.isSubmitting}
								>
									{#if contactForm.isSubmitting}
										<div class="loading-spinner small" />
										Sending...
									{:else}
										⚠️ Send Message
									{/if}
								</button>
							</div>
						</form>
					</div>

					<!-- Subscription Management -->
					<div class="settings-card danger-card">
						<div class="card-header">
							<div class="card-icon">⚠️</div>
							<h3>Subscription</h3>
						</div>
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
	</section>
</main>

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

/* --- CORRECTED AND THEME-AWARE STYLES --- */
<style>
	/* Reset and base styles */
	* {
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	.labs-container {
		display: flex;
		height: 100vh;
		overflow: hidden;
		position: relative;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
		background: var(--bg-color); /* USE VARIABLE */
		transition: background-color 0.3s ease;
	}

	.background-overlay {
		position: fixed;
		inset: 0;
		z-index: -1;
		/* This can stay as it is a subtle decorative background */
		background: linear-gradient(135deg, rgba(252, 211, 77, 0.1), rgba(251, 191, 36, 0.05), rgba(253, 224, 71, 0.1));
	}

	/* Sidebar */
	.sidebar {
		width: 240px;
		background: color-mix(in srgb, var(--sidebar-bg) 95%, transparent); /* USE VARIABLE */
		backdrop-filter: blur(8px);
		border-right: 1px solid var(--border-color); /* USE VARIABLE */
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
		transition: all 0.3s ease;
	}

	.sidebar-header {
		padding: 24px;
		border-bottom: 1px solid var(--border-color); /* USE VARIABLE */
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.logo {
		font-size: 20px;
		font-weight: 600;
		color: var(--text-primary); /* USE VARIABLE */
		text-decoration: none;
	}

	.labs-badge {
		background: var(--accent-color); /* USE VARIABLE */
		color: white;
		padding: 2px 8px;
		border-radius: 12px;
		font-size: 12px;
		font-weight: 600;
		animation: pulse 2s infinite;
	}

	.tab-nav {
		flex: 1;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.tab-item {
		background: none;
		border: none;
		padding: 12px 16px;
		text-align: left;
		font-size: 14px;
		font-weight: 500;
		color: var(--text-secondary); /* USE VARIABLE */
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.tab-item:hover {
		background: color-mix(in srgb, var(--accent-color) 5%, transparent); /* USE VARIABLE */
		color: var(--text-primary); /* USE VARIABLE */
		transform: translateX(2px);
	}

	.tab-item.active {
		background: color-mix(in srgb, var(--accent-color) 10%, transparent); /* USE VARIABLE */
		color: var(--accent-color); /* USE VARIABLE */
		border-right: 2px solid var(--accent-color); /* USE VARIABLE */
		box-shadow: var(--shadow); /* USE VARIABLE */
	}

	.sidebar-footer {
		padding: 24px;
		border-top: 1px solid var(--border-color); /* USE VARIABLE */
	}

	.token-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 14px;
		padding: 8px;
		border-radius: 8px;
		transition: all 0.2s ease;
	}

	.token-info:hover {
		background: color-mix(in srgb, var(--accent-color) 5%, transparent); /* USE VARIABLE */
	}

	.token-label {
		color: var(--text-secondary); /* USE VARIABLE */
	}

	.token-count {
		font-weight: 600;
		color: var(--text-primary); /* USE VARIABLE */
	}

	/* Main Content */
	.main-content {
		flex: 1;
		overflow-y: auto;
		padding: 32px;
		transition: all 0.3s ease;
	}

	.content-wrapper {
		max-width: 1024px;
		width: 100%;
		margin: 0 auto;
		animation: fadeInUp 0.5s ease;
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.section-header {
		margin-bottom: 32px;
		text-align: center;
	}

	.section-header h1 {
		font-size: 30px;
		font-weight: 700;
		color: var(--text-primary); /* USE VARIABLE */
		margin-bottom: 8px;
	}

	.section-header p {
		color: var(--text-secondary); /* USE VARIABLE */
		font-size: 16px;
	}

	/* TTS Component */
	.tts-component {
		background: var(--card-bg); /* USE VARIABLE */
		border: 1px solid var(--border-color); /* USE VARIABLE */
		border-radius: 16px;
		box-shadow: var(--shadow); /* USE VARIABLE */
		display: flex;
		flex-direction: column;
		height: 384px;
		overflow: hidden;
		margin-bottom: 24px;
		transition: all 0.3s ease;
	}

	.tts-component:hover {
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.text-area-wrapper {
		position: relative;
		flex: 1;
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
		background: transparent;
		font-family: inherit;
		transition: all 0.2s ease;
		direction: rtl;
		color: var(--text-primary); /* ADD VARIABLE */
	}

	.text-input:focus {
		background: color-mix(in srgb, var(--accent-color) 3%, transparent); /* USE VARIABLE */
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
		background: color-mix(in srgb, var(--card-bg) 95%, transparent); /* USE VARIABLE */
		border: 1px solid var(--border-color); /* USE VARIABLE */
		border-radius: 8px;
		padding: 6px 12px;
		font-size: 13px;
		cursor: pointer;
		transition: all 0.2s ease;
		user-select: none;
		backdrop-filter: blur(4px);
	}

	.voice-tab:hover {
		transform: translateY(-2px);
		border-color: var(--text-secondary); /* USE VARIABLE */
		box-shadow: var(--shadow); /* USE VARIABLE */
	}

	.voice-tab.active {
		border-color: var(--accent-color); /* USE VARIABLE */
		background: color-mix(in srgb, var(--accent-color) 10%, transparent); /* USE VARIABLE */
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-color) 20%, transparent); /* USE VARIABLE */
		transform: scale(1.05);
	}

	.voice-tab.custom-voice {
		border: 2px solid var(--success-color); /* USE VARIABLE */
		background: color-mix(in srgb, var(--success-color) 8%, transparent); /* USE VARIABLE */
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
		border-color: var(--success-color); /* USE VARIABLE */
		background: color-mix(in srgb, var(--success-color) 15%, transparent); /* USE VARIABLE */
		color: var(--success-color); /* USE VARIABLE */
	}

	.voice-name {
		font-weight: 600;
		color: var(--text-primary); /* USE VARIABLE */
	}

	.voice-description {
		color: var(--text-secondary); /* USE VARIABLE */
		margin-left: 6px;
	}

	.bottom-controls {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 24px;
		border-top: 1px solid var(--border-color); /* USE VARIABLE */
	}

	.voice-select {
		width: 160px;
		padding: 8px 12px;
		border: 1px solid var(--border-color); /* USE VARIABLE */
		border-radius: 6px;
		background: var(--card-bg); /* USE VARIABLE */
		color: var(--text-primary); /* ADD VARIABLE */
		transition: all 0.2s ease;
	}

	.voice-select:hover {
		border-color: color-mix(in srgb, var(--accent-color) 50%, transparent); /* USE VARIABLE */
	}

	.generation-tools {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.char-count {
		font-size: 14px;
		color: var(--text-secondary); /* USE VARIABLE */
		font-family: 'Courier New', monospace;
	}

	.generate-button {
		background: var(--accent-color); /* USE VARIABLE */
		color: white;
		border: none;
		padding: 10px 20px;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.generate-button:hover:not(:disabled) {
		background: var(--accent-hover); /* USE VARIABLE */
		transform: scale(1.05);
	}

	.generate-button:active:not(:disabled) {
		transform: scale(0.95);
	}

	.generate-button:disabled {
		background: var(--text-secondary); /* USE VARIABLE */
		cursor: not-allowed;
	}

	.loading-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	.loading-spinner.small {
		width: 12px;
		height: 12px;
		border-width: 1.5px;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	/* Voice Lab Styles */
	.voice-lab-card, .custom-voices-card {
		background: var(--card-bg); /* USE VARIABLE */
		border: 1px solid var(--border-color); /* USE VARIABLE */
		border-radius: 12px;
		padding: 24px;
		box-shadow: var(--shadow); /* USE VARIABLE */
		margin-bottom: 24px;
		transition: all 0.3s ease;
	}

	.voice-lab-card:hover, .custom-voices-card:hover {
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.voice-lab-card h3, .custom-voices-card h3 {
		font-size: 20px;
		font-weight: 600;
		color: var(--text-primary); /* USE VARIABLE */
		margin-bottom: 8px;
	}

	.voice-lab-card p, .custom-voices-card p {
		color: var(--text-secondary); /* USE VARIABLE */
		margin-bottom: 24px;
	}

	.card-description {
		color: var(--text-secondary); /* USE VARIABLE */
		font-size: 14px;
		margin: 0 0 24px 0;
	}

	.consent-section, .recording-section, .naming-section {
		animation: slideInRight 0.3s ease;
	}

	@keyframes slideInRight {
		from {
			opacity: 0;
			transform: translateX(20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.consent-header, .recording-header, .naming-header {
		margin-bottom: 24px;
	}

	.step-badge {
		background: var(--accent-color); /* USE VARIABLE */
		color: white;
		padding: 4px 12px;
		border-radius: 12px;
		font-size: 12px;
		font-weight: 600;
		margin-bottom: 12px;
		display: inline-block;
	}

	.consent-header h4, .recording-header h4, .naming-header h4 {
		font-size: 18px;
		font-weight: 600;
		color: var(--text-primary); /* USE VARIABLE */
		margin-bottom: 8px;
	}

	.consent-warning {
		display: flex;
		gap: 16px;
		padding: 16px;
		background: color-mix(in srgb, var(--warning-color) 10%, var(--bg-color)); /* USE VARIABLE */
		border: 1px solid var(--warning-color); /* USE VARIABLE */
		border-radius: 8px;
		margin-bottom: 24px;
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.warning-icon {
		font-size: 24px;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.consent-warning strong {
		display: block;
		font-weight: 600;
		color: var(--text-primary); /* USE VARIABLE */
		margin-bottom: 4px;
	}

	.consent-warning p {
		font-size: 14px;
		color: var(--text-secondary); /* USE VARIABLE */
		margin: 0;
	}

	.consent-checklist {
		display: flex;
		flex-direction: column;
		gap: 16px;
		margin-bottom: 24px;
	}

	.consent-item {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 12px;
		border: 1px solid var(--border-color); /* USE VARIABLE */
		border-radius: 8px;
		background: var(--card-bg); /* USE VARIABLE */
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.consent-item:hover {
		border-color: var(--accent-color); /* USE VARIABLE */
		background: color-mix(in srgb, var(--accent-color) 5%, transparent); /* USE VARIABLE */
		transform: scale(1.01);
	}

	.consent-checkbox {
		width: 16px;
		height: 16px;
		margin-top: 2px;
		accent-color: var(--accent-color); /* USE VARIABLE */
		transition: all 0.2s ease;
	}

	.consent-text {
		font-size: 14px;
		line-height: 1.4;
        color: var(--text-primary); /* ADD VARIABLE */
	}

	.consent-actions {
		text-align: center;
	}

	.proceed-button, .record-button, .start-button, .save-button {
		background: var(--accent-color); /* USE VARIABLE */
		color: white;
		border: none;
		padding: 12px 32px;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}

	.proceed-button:hover, .record-button:hover, .start-button:hover, .save-button:hover {
		background: var(--accent-hover); /* USE VARIABLE */
		transform: scale(1.05);
	}

	.proceed-button:active, .record-button:active, .start-button:active, .save-button:active {
		transform: scale(0.95);
	}

	.proceed-button:disabled {
		background: var(--text-secondary); /* USE VARIABLE */
		cursor: not-allowed;
		transform: none;
	}

	.text-prompt-section {
		background: var(--card-bg); /* USE VARIABLE */
		border: 1px solid var(--border-color); /* USE VARIABLE */
		border-radius: 8px;
		padding: 24px;
		margin-bottom: 24px;
		box-shadow: var(--shadow); /* USE VARIABLE */
		transition: all 0.3s ease;
	}

	.text-prompt-section:hover {
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.prompt-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}

	.prompt-header h5 {
		font-weight: 600;
		color: var(--text-primary); /* USE VARIABLE */
	}

	.refresh-text-btn {
		background: transparent;
		border: 1px solid var(--border-color); /* USE VARIABLE */
        color: var(--text-primary); /* ADD VARIABLE */
		padding: 6px 12px;
		border-radius: 6px;
		font-size: 14px;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.refresh-text-btn:hover:not(:disabled) {
		transform: scale(1.05);
		border-color: var(--accent-color); /* USE VARIABLE */
	}

	.refresh-text-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.prompt-text {
		background: var(--bg-color); /* USE VARIABLE */
		border: 2px solid color-mix(in srgb, var(--accent-color) 20%, transparent); /* USE VARIABLE */
		border-radius: 8px;
		padding: 16px;
		margin-bottom: 16px;
		direction: rtl;
		line-height: 1.6;
        color: var(--text-primary); /* ADD VARIABLE */
	}

	.prompt-tips {
		font-size: 14px;
	}

	.prompt-tips strong {
		display: block;
		margin-bottom: 8px;
		color: var(--text-primary); /* USE VARIABLE */
	}

	.prompt-tips ul {
		list-style: disc;
		list-style-position: inside;
		color: var(--text-secondary); /* USE VARIABLE */
	}

	.prompt-tips li {
		margin-bottom: 4px;
	}

	.recording-status {
		text-align: center;
		padding: 12px;
		border-radius: 8px;
		border: 1px solid var(--border-color); /* USE VARIABLE */
        color: var(--text-secondary); /* ADD VARIABLE */
		margin-bottom: 16px;
		transition: all 0.2s ease;
	}

	.recording-status.recording {
		color: var(--danger-color); /* USE VARIABLE */
		background: color-mix(in srgb, var(--danger-color) 10%, transparent); /* USE VARIABLE */
		border-color: var(--danger-color); /* USE VARIABLE */
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.7; }
	}

	.recording-controls {
		display: flex;
		gap: 12px;
		justify-content: center;
		flex-wrap: wrap;
		margin-bottom: 24px;
	}

	.record-button.recording {
		background: var(--danger-color); /* USE VARIABLE */
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

	.record-button.recording:hover {
		background: var(--danger-hover); /* USE VARIABLE */
	}

	.play-button, .next-button, .back-button {
		background: transparent;
		border: 1px solid var(--border-color); /* USE VARIABLE */
        color: var(--text-primary); /* ADD VARIABLE */
		padding: 8px 16px;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
		display: inline-flex;
		align-items: center;
		gap: 8px;
	}

	.play-button:hover, .back-button:hover {
		transform: scale(1.05);
		border-color: var(--accent-color); /* USE VARIABLE */
	}

	.next-button {
		background: var(--accent-color); /* USE VARIABLE */
		color: white;
		border-color: var(--accent-color); /* USE VARIABLE */
	}

	.next-button:hover {
		background: var(--accent-hover); /* USE VARIABLE */
		transform: scale(1.05);
	}

	.step-navigation {
		padding-top: 16px;
		border-top: 1px solid var(--border-color); /* USE VARIABLE */
	}

	.form-group {
		margin-bottom: 24px;
	}

	.form-group label {
		display: block;
		font-size: 14px;
		font-weight: 500;
		margin-bottom: 8px;
		color: var(--text-primary); /* USE VARIABLE */
	}

	.form-group input {
		width: 100%;
		padding: 10px 12px;
		border: 1px solid var(--border-color); /* USE VARIABLE */
		border-radius: 6px;
		background: var(--card-bg); /* USE VARIABLE */
        color: var(--text-primary); /* ADD VARIABLE */
		transition: all 0.2s ease;
	}

	.form-group input:focus {
		outline: none;
		border-color: var(--accent-color); /* USE VARIABLE */
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-color) 10%, transparent); /* USE VARIABLE */
		transform: scale(1.01);
	}

	.form-group input:disabled {
		background: var(--bg-color); /* USE VARIABLE */
		cursor: not-allowed;
	}

	.input-help {
		font-size: 12px;
		color: var(--text-secondary); /* USE VARIABLE */
		margin-top: 4px;
		display: block;
	}

	.recording-preview {
		background: var(--bg-color); /* USE VARIABLE */
		border: 1px solid var(--border-color); /* USE VARIABLE */
		border-radius: 8px;
		padding: 16px;
		margin-bottom: 24px;
		box-shadow: var(--shadow); /* USE VARIABLE */
		transition: all 0.3s ease;
	}

	.recording-preview:hover {
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.recording-preview h5 {
		font-weight: 600;
		font-size: 14px;
		margin-bottom: 12px;
		color: var(--text-primary); /* USE VARIABLE */
	}

	.preview-text {
		font-style: italic;
		color: var(--text-secondary); /* USE VARIABLE */
		font-size: 14px;
		margin-bottom: 12px;
		direction: rtl;
	}

	.play-button.small {
		padding: 6px 12px;
		font-size: 12px;
		border: 1px solid var(--border-color); /* USE VARIABLE */
		background: var(--card-bg); /* USE VARIABLE */
		color: var(--text-primary); /* USE VARIABLE */
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.play-button.small:hover:not(:disabled) {
		border-color: var(--accent-color); /* USE VARIABLE */
		color: var(--accent-color); /* USE VARIABLE */
		transform: scale(1.05);
	}

	.naming-actions {
		display: flex;
		gap: 16px;
		justify-content: space-between;
	}

	.initial-state {
		text-align: center;
		padding: 32px;
		animation: fadeIn 0.3s ease;
	}

	.cta-content {
		max-width: 384px;
		margin: 0 auto;
	}

	.cta-icon {
		font-size: 48px;
		margin-bottom: 16px;
		animation: bounce 2s infinite;
	}

	@keyframes bounce {
		0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
		40% { transform: translateY(-10px); }
		60% { transform: translateY(-5px); }
	}

	.cta-content h4 {
		font-size: 18px;
		font-weight: 600;
		color: var(--text-primary); /* USE VARIABLE */
		margin-bottom: 12px;
	}

	.cta-content p {
		color: var(--text-secondary); /* USE VARIABLE */
		margin-bottom: 24px;
		line-height: 1.5;
	}

	.empty-state {
		text-align: center;
		padding: 32px;
	}

	.empty-icon {
		font-size: 32px;
		margin-bottom: 16px;
	}

	.empty-state p {
		color: var(--text-secondary); /* USE VARIABLE */
		margin: 0;
	}

	.voices-grid {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.voice-card {
		background: var(--bg-color); /* USE VARIABLE */
		border: 1px solid var(--border-color); /* USE VARIABLE */
		border-radius: 8px;
		padding: 16px;
		box-shadow: var(--shadow); /* USE VARIABLE */
		display: flex;
		justify-content: space-between;
		align-items: center;
		transition: all 0.2s ease;
		animation: slideInLeft 0.3s ease;
	}

	@keyframes slideInLeft {
		from {
			opacity: 0;
			transform: translateX(-20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.voice-card:hover {
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		transform: scale(1.01);
	}

	.voice-info h4 {
		font-weight: 600;
		margin-bottom: 4px;
		color: var(--text-primary); /* USE VARIABLE */
	}

	.voice-date {
		font-size: 12px;
		color: var(--text-secondary); /* USE VARIABLE */
		margin: 0;
	}

	.voice-actions {
		display: flex;
		gap: 8px;
	}

	.play-voice {
		background: transparent;
		border: 1px solid var(--accent-color); /* USE VARIABLE */
		color: var(--accent-color); /* USE VARIABLE */
		padding: 6px 12px;
		border-radius: 4px;
		font-size: 12px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.play-voice:hover {
		background: color-mix(in srgb, var(--accent-color) 10%, transparent); /* USE VARIABLE */
		transform: scale(1.05);
	}

	.delete-voice {
		background: transparent;
		border: 1px solid var(--danger-color); /* USE VARIABLE */
		color: var(--danger-color); /* USE VARIABLE */
		padding: 6px 12px;
		border-radius: 4px;
		font-size: 12px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.delete-voice:hover {
		background: color-mix(in srgb, var(--danger-color) 10%, transparent); /* USE VARIABLE */
		transform: scale(1.05);
	}

	/* Billing Styles */
	.error-banner {
		margin-bottom: 24px;
		border-radius: 8px;
		border: 1px solid var(--danger-hover); /* USE VARIABLE */
		background-color: color-mix(in srgb, var(--danger-color) 10%, transparent); /* USE VARIABLE */
		padding: 16px;
		color: var(--danger-hover); /* USE VARIABLE */
		font-weight: 500;
		animation: slideInUp 0.3s ease;
	}

	.success-banner {
		margin-bottom: 24px;
		border-radius: 8px;
		border: 1px solid var(--success-color); /* USE VARIABLE */
		background-color: color-mix(in srgb, var(--success-color) 10%, transparent); /* USE VARIABLE */
		padding: 16px;
		color: var(--success-color); /* USE VARIABLE */
		font-weight: 500;
		animation: slideInUp 0.3s ease;
	}

	@keyframes slideInUp {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.pro-dashboard {
		background: linear-gradient(135deg, color-mix(in srgb, var(--accent-color) 5%, transparent), var(--card-bg), color-mix(in srgb, var(--accent-color) 10%, transparent)); /* USE VARIABLE */
		border: 2px solid var(--accent-color); /* USE VARIABLE */
		border-radius: 16px;
		padding: 32px;
		margin-bottom: 24px;
		position: relative;
		overflow: hidden;
		box-shadow: var(--shadow); /* USE VARIABLE */
		transition: all 0.3s ease;
		animation: slideInUp 0.5s ease;
	}

	.pro-dashboard:hover {
		box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 24px;
		flex-wrap: wrap;
		gap: 16px;
	}

	.plan-info {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.plan-icon {
		width: 48px;
		height: 48px;
		background: color-mix(in srgb, var(--accent-color) 10%, transparent); /* USE VARIABLE */
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24px;
		transition: all 0.2s ease;
	}

	.plan-icon:hover {
		transform: scale(1.1);
	}

	.plan-name {
		font-size: 24px;
		font-weight: 700;
		color: var(--accent-color); /* USE VARIABLE */
		margin-bottom: 4px;
	}

	.status-badge {
		background: var(--success-color); /* USE VARIABLE */
		color: white;
		padding: 4px 12px;
		border-radius: 12px;
		font-size: 12px;
		font-weight: 600;
	}

	.status-badge.active {
		animation: pulse 2s infinite;
	}

	.token-display {
		text-align: right;
		background: color-mix(in srgb, var(--card-bg) 80%, transparent); /* USE VARIABLE */
		backdrop-filter: blur(4px);
		border-radius: 8px;
		padding: 16px;
		border: 1px solid var(--border-color); /* USE VARIABLE */
		box-shadow: var(--shadow); /* USE VARIABLE */
		transition: all 0.2s ease;
	}

	.token-display:hover {
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.token-display .token-label {
		font-size: 12px;
		color: var(--text-secondary); /* USE VARIABLE */
		text-transform: uppercase;
		letter-spacing: 0.05em;
		display: block;
		margin-bottom: 4px;
	}

	.token-display .token-count {
		font-size: 30px;
		font-weight: 700;
		color: var(--accent-color); /* USE VARIABLE */
		display: block;
	}

	.token-progress {
		width: 100%;
		height: 8px;
		background: var(--border-color); /* USE VARIABLE */
		border-radius: 4px;
		margin-top: 8px;
		overflow: hidden;
	}

	.progress-bar {
		height: 100%;
		background: var(--accent-color); /* USE VARIABLE */
		border-radius: 4px;
		transition: width 1s ease;
	}

	.plan-description {
		color: var(--text-secondary); /* USE VARIABLE */
		margin-bottom: 32px;
		font-size: 18px;
		line-height: 1.6;
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 16px;
		margin-bottom: 32px;
	}

	.feature-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px;
		background: color-mix(in srgb, var(--card-bg) 60%, transparent); /* USE VARIABLE */
		backdrop-filter: blur(4px);
		border: 1px solid var(--border-color); /* USE VARIABLE */
		border-radius: 12px;
		transition: all 0.2s ease;
		animation: slideInUp 0.3s ease;
	}

	.feature-item:hover {
		background: color-mix(in srgb, var(--card-bg) 80%, transparent); /* USE VARIABLE */
		transform: scale(1.02);
	}

	.feature-icon {
		font-size: 24px;
	}

	.feature-title {
		font-weight: 500;
		color: var(--text-primary); /* USE VARIABLE */
		display: block;
	}

	.feature-desc {
		font-size: 14px;
		color: var(--text-secondary); /* USE VARIABLE */
		margin: 0;
	}

	.management-section {
		padding-top: 24px;
		border-top: 1px solid var(--border-color); /* USE VARIABLE */
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 16px;
	}

	.management-title {
		font-weight: 500;
		margin-bottom: 4px;
		color: var(--text-primary); /* USE VARIABLE */
	}

	.management-desc {
		font-size: 14px;
		color: var(--text-secondary); /* USE VARIABLE */
		margin: 0;
	}

	.portal-button {
		background: var(--accent-color); /* USE VARIABLE */
		color: white;
		border: none;
		padding: 10px 20px;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 8px;
		text-decoration: none;
	}

	.portal-button:hover {
		background: var(--accent-hover); /* USE VARIABLE */
		transform: scale(1.05);
	}

	.plan-comparison {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 32px;
		align-items: start;
		margin-bottom: 32px;
	}

	.plan-card {
		background: var(--card-bg); /* USE VARIABLE */
		border: 2px solid var(--border-color); /* USE VARIABLE */
		border-radius: 12px;
		padding: 24px;
		position: relative;
		box-shadow: var(--shadow); /* USE VARIABLE */
		transition: all 0.3s ease;
		animation: slideInUp 0.5s ease;
	}

	.plan-card:hover {
		box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
	}

	.plan-card.pro {
		background: linear-gradient(135deg, color-mix(in srgb, var(--accent-color) 5%, transparent), var(--card-bg), color-mix(in srgb, var(--accent-color) 10%, transparent)); /* USE VARIABLE */
		border-color: var(--accent-color); /* USE VARIABLE */
		transform: translateY(-16px);
		box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
	}

	.plan-card.pro:hover {
		box-shadow: 0 12px 20px rgba(0, 0, 0, 0.2);
	}

	.most-popular {
		position: absolute;
		top: 0;
		left: 50%;
		transform: translate(-50%, -50%);
		background: var(--accent-color); /* USE VARIABLE */
		color: white;
		padding: 4px 16px;
		border-radius: 12px;
		font-size: 12px;
		font-weight: 600;
	}

	.plan-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
		margin-top: 8px;
	}

	.plan-header h3 {
		font-size: 18px;
		font-weight: 600;
		color: var(--text-primary); /* USE VARIABLE */
	}

	.plan-card.pro .plan-header h3 {
		color: var(--accent-color); /* USE VARIABLE */
	}

	.current-badge {
		background: var(--text-secondary); /* USE VARIABLE */
		color: white;
		padding: 2px 8px;
		border-radius: 8px;
		font-size: 12px;
		font-weight: 500;
	}

	.plan-price {
		display: flex;
		align-items: baseline;
		margin-bottom: 16px;
	}

	.price {
		font-size: 32px;
		font-weight: 700;
		color: var(--text-primary); /* USE VARIABLE */
	}

	.plan-card.pro .price {
		color: var(--accent-color); /* USE VARIABLE */
	}

	.period {
		font-size: 14px;
		color: var(--text-secondary); /* USE VARIABLE */
		margin-left: 4px;
	}

	.plan-card .token-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px;
		background: color-mix(in srgb, var(--accent-color) 5%, transparent); /* USE VARIABLE */
		border: 1px solid var(--border-color); /* USE VARIABLE */
		border-radius: 8px;
		margin-bottom: 24px;
	}

	.plan-card .token-info .token-count {
		font-size: 20px;
		font-weight: 700;
		color: var(--accent-color); /* USE VARIABLE */
	}

	.upgrade-highlight {
		text-align: center;
		font-weight: 600;
		background: linear-gradient(135deg, var(--accent-color), #8b5cf6); /* USE VARIABLE */
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		margin-bottom: 24px;
		font-size: 18px;
	}

	.features-list {
		list-style: none;
		margin-bottom: 32px;
        padding: 0; /* Add padding reset */
	}

	.features-list li {
		display: flex;
		align-items: center;
		font-size: 14px;
		margin-bottom: 12px;
		line-height: 1.4;
	}

	.upgrade-button {
		width: 100%;
		background: var(--accent-color); /* USE VARIABLE */
		color: white;
		border: none;
		padding: 12px;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	.upgrade-button:hover {
		background: var(--accent-hover); /* USE VARIABLE */
		transform: scale(1.05);
	}

	.usage-info-card {
		background: linear-gradient(135deg, var(--card-bg), color-mix(in srgb, var(--border-color) 10%, transparent)); /* USE VARIABLE */
		border: 1px solid var(--border-color); /* USE VARIABLE */
		border-radius: 12px;
		padding: 24px;
		box-shadow: var(--shadow); /* USE VARIABLE */
		transition: all 0.3s ease;
		animation: slideInUp 0.3s ease;
	}

	.usage-info-card:hover {
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.usage-info-card h3 {
		font-size: 18px;
		font-weight: 600;
		color: var(--text-primary); /* USE VARIABLE */
		margin-bottom: 24px;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.usage-info-card h3::before {
		content: '';
		width: 8px;
		height: 8px;
		background: var(--accent-color); /* USE VARIABLE */
		border-radius: 50%;
		animation: pulse 2s infinite;
	}

	.usage-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 24px;
		margin-bottom: 24px;
	}

	.usage-item {
		text-align: center;
		padding: 16px;
		background: var(--card-bg); /* USE VARIABLE */
		border-radius: 8px;
		border: 1px solid var(--border-color); /* USE VARIABLE */
		box-shadow: var(--shadow); /* USE VARIABLE */
		transition: all 0.2s ease;
		animation: slideInUp 0.3s ease;
	}

	.usage-item:hover {
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		transform: scale(1.02);
	}

	.usage-label {
		font-size: 12px;
		color: var(--text-secondary); /* USE VARIABLE */
		text-transform: uppercase;
		letter-spacing: 0.05em;
		display: block;
		margin-bottom: 8px;
	}

	.usage-value {
		font-size: 24px;
		font-weight: 700;
		color: var(--text-primary); /* USE VARIABLE */
	}

	.usage-note {
		padding-top: 16px;
		border-top: 1px solid var(--border-color); /* USE VARIABLE */
		text-align: center;
	}

	.usage-note p {
		font-size: 14px;
		color: var(--text-secondary); /* USE VARIABLE */
		margin: 0;
	}

	/* Settings Styles */
	.settings-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 24px;
	}

	.settings-card {
		background: linear-gradient(135deg, var(--card-bg), color-mix(in srgb, var(--border-color) 5%, transparent)); /* USE VARIABLE */
		border: 1px solid var(--border-color); /* USE VARIABLE */
		border-radius: 12px;
		padding: 24px;
		box-shadow: var(--shadow); /* USE VARIABLE */
		transition: all 0.3s ease;
		animation: slideInUp 0.5s ease;
	}

	.settings-card:hover {
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		transform: scale(1.01);
	}

	.settings-card.full-width {
		grid-column: 1 / -1;
	}

	.settings-card .card-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 16px;
	}

	.card-icon {
		width: 32px;
		height: 32px;
		background: color-mix(in srgb, var(--accent-color) 10%, transparent); /* USE VARIABLE */
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 16px;
		transition: all 0.2s ease;
	}

	.card-icon:hover {
		transform: scale(1.1);
	}

	.settings-card .card-header h3 {
		font-size: 18px;
		font-weight: 600;
		color: var(--text-primary); /* USE VARIABLE */
	}

	.setting-item {
		margin-bottom: 16px;
	}

	.setting-label {
		display: flex;
		justify-content: space-between;
		align-items: center;
		cursor: pointer;
		padding: 12px;
		border-radius: 8px;
		transition: all 0.2s ease;
	}

	.setting-label:hover {
		background: color-mix(in srgb, var(--border-color) 50%, transparent); /* USE VARIABLE */
	}

	.setting-name {
		font-weight: 500;
		color: var(--text-primary); /* USE VARIABLE */
	}

	.setting-desc {
		font-size: 14px;
		color: var(--text-secondary); /* USE VARIABLE */
		margin: 0;
	}

	.toggle-button {
		width: 48px;
		height: 24px;
		border-radius: 12px;
		border: 2px solid var(--border-color); /* USE VARIABLE */
		background: var(--border-color); /* USE VARIABLE */
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		padding: 0;
		position: relative;
	}

	.toggle-button.active {
		background: var(--accent-color); /* USE VARIABLE */
		border-color: var(--accent-color); /* USE VARIABLE */
	}

	.toggle-slider {
		width: 16px;
		height: 16px;
		background: white;
		border-radius: 50%;
		transition: transform 0.3s ease;
		box-shadow: var(--shadow); /* USE VARIABLE */
		transform: translateX(0);
	}

	.toggle-button.active .toggle-slider {
		transform: translateX(24px);
	}

	.info-rows {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px;
		border-radius: 8px;
		background: color-mix(in srgb, var(--border-color) 50%, transparent); /* USE VARIABLE */
		transition: all 0.2s ease;
		animation: slideInRight 0.3s ease;
	}

	.info-row:hover {
		background: color-mix(in srgb, var(--border-color) 75%, transparent); /* USE VARIABLE */
	}

	.info-label {
		color: var(--text-secondary); /* USE VARIABLE */
		font-weight: 500;
	}

	.info-value {
		font-weight: 600;
		color: var(--text-primary); /* USE VARIABLE */
	}

	.info-value.primary {
		color: var(--accent-color); /* USE VARIABLE */
	}

	.info-badge {
		background: var(--text-secondary); /* USE VARIABLE */
		color: white;
		padding: 4px 12px;
		border-radius: 12px;
		font-size: 12px;
		font-weight: 600;
	}

	.info-badge.pro {
		background: var(--accent-color); /* USE VARIABLE */
	}

	.contact-form {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.contact-form .form-group {
		margin-bottom: 0;
	}

	.contact-form textarea {
		width: 100%;
		padding: 10px 12px;
		border: 1px solid var(--border-color); /* USE VARIABLE */
		border-radius: 6px;
		background: var(--card-bg); /* USE VARIABLE */
        color: var(--text-primary); /* ADD VARIABLE */
		transition: all 0.2s ease;
		resize: vertical;
		font-family: inherit;
	}

	.contact-form textarea:focus {
		outline: none;
		border-color: var(--accent-color); /* USE VARIABLE */
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-color) 10%, transparent); /* USE VARIABLE */
		transform: scale(1.01);
	}

	.contact-form textarea:disabled {
		background: var(--bg-color); /* USE VARIABLE */
		cursor: not-allowed;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
	}

	.submit-button {
		background: var(--accent-color); /* USE VARIABLE */
		color: white;
		border: none;
		padding: 10px 24px;
		border-radius: 6px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.submit-button:hover:not(:disabled) {
		background: var(--accent-hover); /* USE VARIABLE */
		transform: scale(1.05);
	}

	.submit-button:active:not(:disabled) {
		transform: scale(0.95);
	}

	.submit-button:disabled {
		background: var(--text-secondary); /* USE VARIABLE */
		cursor: not-allowed;
	}

	.danger-card {
		border-color: color-mix(in srgb, var(--danger-color) 20%, transparent); /* USE VARIABLE */
		background: linear-gradient(135deg, var(--card-bg), color-mix(in srgb, var(--danger-color) 5%, transparent)); /* USE VARIABLE */
	}

	.danger-button {
		background: var(--danger-color); /* USE VARIABLE */
		color: white;
		border: none;
		border-radius: 8px;
		padding: 10px 20px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.danger-button:hover {
		background: var(--danger-hover); /* USE VARIABLE */
		transform: scale(1.05);
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
		backdrop-filter: blur(4px);
		animation: fadeIn 0.3s ease;
	}

	.modal-content {
		background: var(--card-bg); /* USE VARIABLE */
		border-radius: 12px;
		padding: 32px;
		max-width: 500px;
		width: 90%;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
		animation: scaleIn 0.3s ease;
	}

	@keyframes scaleIn {
		from {
			opacity: 0;
			transform: scale(0.9);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.modal-content h3 {
		margin: 0 0 16px 0;
		font-size: 20px;
		font-weight: 600;
		color: var(--text-primary); /* USE VARIABLE */
	}

	.modal-content p {
		margin: 0 0 32px 0;
		color: var(--text-secondary); /* USE VARIABLE */
		line-height: 1.6;
	}

	.modal-actions {
		display: flex;
		gap: 16px;
		justify-content: flex-end;
	}

	.cancel-button {
		background: var(--card-bg); /* USE VARIABLE */
		color: var(--text-primary); /* USE VARIABLE */
		border: 1px solid var(--border-color); /* USE VARIABLE */
		border-radius: 8px;
		padding: 10px 20px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.cancel-button:hover {
		background: var(--bg-color); /* USE VARIABLE */
		transform: scale(1.05);
	}

	/* Responsive Design */
	@media (max-width: 1024px) {
		.labs-container {
			flex-direction: column;
			height: auto;
		}

		.sidebar {
			width: 100%;
			order: 2;
		}

		.main-content {
			order: 1;
			padding: 16px;
		}

		.content-wrapper {
			max-width: none;
		}

		.tab-nav {
			flex-direction: row;
			padding: 16px;
			overflow-x: auto;
			gap: 8px;
		}

		.tab-item {
			white-space: nowrap;
			flex-shrink: 0;
		}
	}

	@media (max-width: 768px) {
		.card-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 16px;
		}

		.token-display {
			text-align: left;
		}

		.features-grid {
			grid-template-columns: 1fr;
		}

		.plan-comparison {
			grid-template-columns: 1fr;
		}

		.plan-card.pro {
			transform: none;
		}

		.usage-grid {
			grid-template-columns: 1fr;
		}

		.settings-grid {
			grid-template-columns: 1fr;
		}

		.management-section {
			flex-direction: column;
			align-items: flex-start;
		}

		.naming-actions {
			flex-direction: column;
		}

		.floating-tabs {
			position: static;
			margin-top: 16px;
		}

		.tts-component {
			height: auto;
		}

		.text-input {
			min-height: 200px;
		}

		.modal-actions {
			flex-direction: column;
		}

		.prompt-header {
			flex-direction: column;
			gap: 12px;
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

		.bottom-controls {
			flex-direction: column;
			gap: 12px;
		}

		.generation-tools {
			width: 100%;
			justify-content: space-between;
		}
	}

	@media (max-width: 480px) {
		.sidebar {
			padding: 12px;
		}

		.sidebar-header {
			padding: 16px;
		}

		.main-content {
			padding: 12px;
		}

		.section-header h1 {
			font-size: 24px;
		}

		.voice-lab-card, .custom-voices-card, .settings-card {
			padding: 16px;
		}

		.consent-item {
			padding: 16px;
		}

		.consent-text {
			font-size: 13px;
		}

		.voice-card {
			flex-direction: column;
			gap: 16px;
			align-items: stretch;
		}

		.voice-actions {
			justify-content: center;
		}

		.usage-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>