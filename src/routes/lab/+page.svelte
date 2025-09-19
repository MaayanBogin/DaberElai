<!-- src/routes/labs/+page.svelte -->
<script lang="ts">
	import { page } from '$app/stores';
    import theme from '$lib/theme';
	import { onDestroy, onMount } from 'svelte';
    import CustomAudioPlayer from '$lib/components/CustomAudioPlayer.svelte';

    import Sidebar from '$lib/components/Sidebar.svelte';
    import TTSSection from '$lib/components/TTSSection.svelte';
    import VoiceLabSection from '$lib/components/VoiceLabSection.svelte';
    import BillingSection from '$lib/components/BillingSection.svelte';
    import SettingsSection from '$lib/components/SettingsSection.svelte';
    import CancelSubscriptionModal from '$lib/components/CancelSubscriptionModal.svelte';

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
	// let userTokens: number = 0;
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
        "שלום וברוכים הבאים לעולם המרתק של טכנולוגיית הדיבור המתקדמת. אני כאן כדי לעזור לכם ליצור חוויה מותאמת אישית שתשנה את הדרך שבה אתם מתקשרים עם טכנולוגיה.",
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

	// async function fetchUserTokens() {
	// 	if (!$page.data.session?.user) return;
	// 	try {
	// 		const response = await fetch('/api/user/tokens');
	// 		if (response.ok) {
	// 			const data = await response.json();
	// 			userTokens = data.tokens;
	// 		}
	// 	} catch (error) {
	// 		console.error('Error fetching tokens:', error);
	// 	}
	// }

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
        // fetchUserTokens();
    }
}

	// --- NAVIGATION ---
	function switchTab(tabId: string) {
		activeTab = tabId;
	}

	onMount(() => {
		if ($page.data.session?.user) {
            fetchCustomVoices();
			// fetchUserTokens();
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

<div class="labs-container">
	<Sidebar
        {sidebarItems}
        {activeTab}
        {switchTab}
        {userTokens}
    />

	<main class="main-content">
		{#if activeTab === 'tts'}
			<TTSSection
                bind:textInput
                {voiceList}
                bind:selectedVoiceId
                {textCharCount}
                {generateAudio}
                {isLoading}
                bind:generatedAudioUrl
            />
		{:else if activeTab === 'voice-lab'}
			<VoiceLabSection
                {voiceCreationStep}
                {startVoiceCreation}
                {consentChecks}
                {allConsentChecked}
                {proceedToRecording}
                {currentPromptText}
                {recordingStatus}
                {isRecording}
                {isUploading}
                {recordedBlob}
                {startRecording}
                {stopRecording}
                {playRecording}
                {proceedToNaming}
                {backToConsent}
                {backToRecording}
                bind:voiceName
                {saveVoice}
                {customVoices}
                {deleteVoice}
                {generateNewPromptText}
            />
		{:else if activeTab === 'billing'}
			<BillingSection
                {portalError}
                {showSuccessMessage}
                {userPlan}
                {userTokens}
                {customVoices}
                {handleUpgrade}
                {isLoading}
            />
		{:else if activeTab === 'settings'}
			<SettingsSection
                {theme}
                {page}
                {userTokens}
                {contactForm}
                {submitContactForm}
                bind:showCancelModal
            />
		{/if}
	</main>
</div>

{#if showCancelModal}
	<CancelSubscriptionModal
        bind:showCancelModal
        {cancelSubscription}
    />
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

	.main-content {
		flex: 1;
		overflow-y: auto;
		padding: 2rem;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.labs-container {
			flex-direction: column;
		}

		.main-content {
			padding: 1rem;
		}
	}
</style>