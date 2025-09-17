<!-- src/routes/+page.svelte -->
<script lang="ts">
	import { page } from '$app/stores';
	import { signIn, signOut } from '@auth/sveltekit/client';
	import { onDestroy, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import theme from '$lib/theme';
    import CustomAudioPlayer from '$lib/components/CustomAudioPlayer.svelte';


	// --- TYPES AND INTERFACES ---
	interface Voice {
		id: string;
		name: string;
		description: string;
		url: string; // URL to the reference .wav file
	}

	// --- VOICE CONFIGURATION ---
	const voices: Record<string, Voice> = {
		mark: {
			id: 'mark',
			name: 'מארק',
			description: 'דובר יומיומי',
			url: 'https://jjrywtbchflizypxwfdy.supabase.co/storage/v1/object/public/voice-clips/voice-recording-1757499088766.wav'
		},
		olivia: {
			id: 'olivia',
			name: 'אוליביה',
			description: 'חברה עצובה',
			url: 'https://jjrywtbchflizypxwfdy.supabase.co/storage/v1/object/public/voice-clips/voice-recording-1757440627607.wav'
		},
		hades: {
			id: 'hades',
			name: 'האדס',
			description: 'קריין סיפורים',
			url: '/voices/hades.wav' // Assumes a local file in /static/voices
		},
		dennis: {
			id: 'dennis',
			name: 'דניס',
			description: 'מצגת עסקית',
			url: 'https://jjrywtbchflizypxwfdy.supabase.co/storage/v1/object/public/voice-clips/podcastbit.wav'
		}
	};
	const voiceList: Voice[] = Object.values(voices);

	// --- COMPONENT STATE ---
	let textInput = 'שלום וברוכים הבאים לעולם המרתק של טכנולוגיית הדיבור המתקדמת.';
	let selectedVoiceId = 'mark';
	let isLoading = false;
	let generatedAudioUrl: string | null = null;
	let taskId: string | null = null;
	let pollingInterval: number | null = null;
	let userTokens: number = 0;
	let userPlan: string = 'Free';
	let isProfileModalOpen = false;
	let isSignUpModalOpen = false;
	// let isDarkMode = false;
	
	// Kept from original logic for potential future use, not currently wired to UI
	let temperature = 0.8;
	let nikudEnabled = false;

	// --- REACTIVE DERIVED STATE ---
	$: textCharCount = textInput.length;
	$: selectedVoiceUrl = voices[selectedVoiceId]?.url || '';
	$: userAvatarInitial = $page.data.session?.user?.name?.charAt(0).toUpperCase() || 'U';

	// --- AUTHENTICATION & DATA FETCHING ---
	function requireAuth() {
		if (!$page.data.session?.user) {
			isSignUpModalOpen = true;
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
				userPlan = data.plan;
			}
		} catch (error) {
			console.error('Error fetching tokens:', error);
		}
	}

	// --- NAVIGATION ---
	function navigateToLab() {
		goto('/lab');
	}

	// --- CORE API LOGIC (UNCHANGED) ---
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

	// --- THEME, MODAL & SCROLL LOGIC ---
	// function toggleTheme() {
	// 	isDarkMode = !isDarkMode;
	// 	if (isDarkMode) {
	// 		document.documentElement.setAttribute('data-theme', 'dark');
	// 		localStorage.setItem('theme', 'dark');
	// 	} else {
	// 		document.documentElement.removeAttribute('data-theme');
	// 		localStorage.setItem('theme', 'light');
	// 	}
	// }

	function handleSmoothScroll(event: MouseEvent) {
		event.preventDefault();
		const targetId = (event.currentTarget as HTMLAnchorElement).getAttribute('href');
		const targetElement = document.querySelector(targetId!);
		if (targetElement) {
			targetElement.scrollIntoView({ behavior: 'smooth' });
		}
	}

	onMount(() => {
		// const savedTheme = localStorage.getItem('theme');
		// if (savedTheme === 'dark') {
		// 	isDarkMode = true;
		// 	document.documentElement.setAttribute('data-theme', 'dark');
		// }
		if ($page.data.session?.user) {
			fetchUserTokens();
		}
	});

	$: if ($page.data.session?.user) {
		fetchUserTokens();
		isSignUpModalOpen = false;
	}
	
	onDestroy(() => {
		if (pollingInterval) clearInterval(pollingInterval);
	});
</script>

<svelte:head>
	<title>DaberEl.ai - טקסט לדיבור מתקדם</title>
</svelte:head>

<!-- Navigation Bar -->
<nav class="nav">
	<div class="nav-container">
		<a href="/" class="logo">DaberEl.ai</a>
		<ul class="nav-links">
			<li><a href="#demo" on:click={handleSmoothScroll}>הדגמה</a></li>
			<li><a href="#features" on:click={handleSmoothScroll}>יכולות</a></li>
			<li><a href="#pricing" on:click={handleSmoothScroll}>תמחור</a></li>
		</ul>
		<div class="nav-right">
			{#if $page.data.session?.user}
				<button class="nav-btn lab-btn" on:click={navigateToLab}>
					🧪 למעבדה
				</button>
				<button class="nav-btn profile-btn" on:click={() => (isProfileModalOpen = true)}>
					<span class="avatar">{userAvatarInitial}</span>
					{$page.data.session.user.name || 'Profile'}
				</button>
			{:else}
				<button class="nav-btn primary" on:click={() => (isSignUpModalOpen = true)}>
					התחברות
				</button>
			{/if}
		</div>
	</div>
</nav>

<main class="main">
	<!-- Hero Section -->
	<section class="hero">
		<div class="hero-content">
			<h1 class="hero-title">DaberEl.ai</h1>
			<p class="hero-subtitle">
				הפיקו קולות טבעיים וצלולים בעברית באמצעות מודל מתקדם של בינה מלאכותית, 
				המבוסס על דגימות קול איכותיות ושיטות שכפול קול חדשניות.
			</p>
			<div class="hero-badges">
				<span class="badge">🏆 מודל SOTA</span>
				<span class="badge">🎤 שכפול קול</span>
				<span class="badge">⚡ מהיר וצלול</span>
			</div>
		</div>

		<!-- TTS Demo Section -->
		<div class="demo-section" id="demo">
			<div class="tts-component">
				<div class="text-area-wrapper">
					<textarea
						bind:value={textInput}
						id="textInput"
						class="text-input"
						placeholder="הזן טקסט כאן..."
					/>
					<div class="floating-tabs">
						{#each voiceList as voice (voice.id)}
							<div
								class="voice-tab"
								class:active={selectedVoiceId === voice.id}
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
								הפק קול
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
	</section>

	<!-- Features Section -->
	<section id="features" class="content-section">
		<h2 class="section-title">יכולות מתקדמות</h2>
		<div class="features-grid">
			<div class="feature-card">
				<div class="feature-icon">🔊</div>
				<h3 class="feature-title">קולות טבעיים וצלולים</h3>
				<p class="feature-description">מודל SOTA מתקדם המייצר קולות שנשמעים אנושיים לחלוטין, עם אינטונציה והדגשים מדויקים הייחודיים לעברית.</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">⚡️</div>
				<h3 class="feature-title">מהירות עיבוד גבוהה</h3>
				<p class="feature-description">קבלו את קובץ השמע שלכם תוך שניות ספורות, מוכן לשימוש מיידי בכל פלטפורמה ואפליקציה.</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">🎤</div>
				<h3 class="feature-title">שכפול קול מתקדם</h3>
				<p class="feature-description">השתמשו בדגימות קול קיימות כדי ליצור קולות עקביים ומותאמים אישית. <strong>דורש הסכמה מפורשת של בעל הקול</strong> ואימות זהות.</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">🌐</div>
				<h3 class="feature-title">תמיכה מלאה בניקוד</h3>
				<p class="feature-description">הוסיפו ניקוד לטקסט שלכם כדי להבטיח הגייה מושלמת ומדויקת של כל מילה, כולל מילים זרות ומונחים מיוחדים.</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">🔒</div>
				<h3 class="feature-title">אבטחה ופרטיות מקסימלית</h3>
				<p class="feature-description">המידע ודגימות הקול שלכם מאובטחים ברמה הגבוהה ביותר, נשארים בבעלותכם המלאה ואינם נשמרים במערכת.</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">🧩</div>
				<h3 class="feature-title">API פשוט ונוח למפתחים</h3>
				<p class="feature-description">שלבו את היכולות שלנו בקלות בכל אפליקציה או שירות עם תיעוד ברור, דוגמאות קוד וסיוע טכני מלא.</p>
			</div>
		</div>
	</section>

	<!-- Pricing Section -->
	<section id="pricing" class="content-section pricing-section">
		<h2 class="section-title">תמחור פשוט ושקוף</h2>
		<div class="pricing-grid">
			<div class="pricing-card basic">
				<div class="pricing-header">
					<h3 class="plan-name">בסיסי</h3>
					<div class="pricing-highlight">$2</div>
					<p class="plan-description">לשימוש אישי</p>
				</div>
				<div class="pricing-details">
					<div class="pricing-feature">✓ 100 שימושים (≈5,000-8,000 תווים)</div>
					<div class="pricing-feature">✓ כל הקולות הבסיסיים</div>
					<div class="pricing-feature">✓ תמיכה בניקוד</div>
					<div class="pricing-feature">✓ API מלא</div>
				</div>
				<button class="pricing-btn" on:click={() => isSignUpModalOpen = true}>
					התחילו עכשיו
				</button>
			</div>

			<div class="pricing-card popular">
				<div class="popular-badge">פופולרי</div>
				<div class="pricing-header">
					<h3 class="plan-name">מקצועי</h3>
					<div class="pricing-highlight">$5</div>
					<p class="plan-description">אידיאלי לעסקים קטנים</p>
				</div>
				<div class="pricing-details">
					<div class="pricing-feature">✓ 300 שימושים (≈15,000-24,000 תווים)</div>
					<div class="pricing-feature">✓ כל הקולות הבסיסיים</div>
					<div class="pricing-feature">✓ <strong>1 קול משוכפל</strong></div>
					<div class="pricing-feature">✓ תמיכה בניקוד ו-API</div>
					<div class="pricing-feature">✓ תמיכה מועדפת</div>
				</div>
				<button class="pricing-btn primary" on:click={() => isSignUpModalOpen = true}>
					התחילו עכשיו
				</button>
			</div>

			<div class="pricing-card premium">
				<div class="pricing-header">
					<h3 class="plan-name">מתקדם</h3>
					<div class="pricing-highlight">$10</div>
					<p class="plan-description">לחברות ויוצרי תוכן</p>
				</div>
				<div class="pricing-details">
					<div class="pricing-feature">✓ 800 שימושים (≈40,000-64,000 תווים)</div>
					<div class="pricing-feature">✓ כל הקולות הבסיסיים</div>
					<div class="pricing-feature">✓ קולות משוכפלים ללא הגבלה</div>
					<div class="pricing-feature">✓ תמיכה מלאה ו-API מתקדם</div>
					<div class="pricing-feature">✓ גישה מוקדמת לתכונות חדשות</div>
				</div>
				<button class="pricing-btn" on:click={() => isSignUpModalOpen = true}>
					התחילו עכשיו
				</button>
			</div>
		</div>
		
		<div class="pricing-note">
			<p><strong>חשוב לדעת:</strong> שכפול קול דורש הסכמה מפורשת של בעל הקול המקורי. ייתכן שתידרשו למלא מידע אימות נוסף בהתאם לדרישות החוק.</p>
		</div>
	</section>
</main>

<!-- Modals -->
{#if isSignUpModalOpen}
	<div class="modal-overlay" on:click={() => (isSignUpModalOpen = false)}>
		<div class="modal-content auth-modal" on:click|stopPropagation>
			<div class="modal-header">
				<div class="modal-icon">🎤</div>
				<h3>ברוכים הבאים ל-Daber El.ai</h3>
				<p>התחברו כדי להתחיל ליצור קולות בעברית באיכות מקצועית</p>
			</div>

			<div class="auth-features">
				<div class="auth-feature">
					<span class="feature-check">✓</span>
					<span>גישה מיידית למודל SOTA</span>
				</div>
				<div class="auth-feature">
					<span class="feature-check">✓</span>
					<span>כל הקולות הבסיסיים</span>
				</div>
				<div class="auth-feature">
					<span class="feature-check">✓</span>
					<span>API מלא למפתחים</span>
				</div>
			</div>

			<div class="oauth-buttons">
				<button class="auth-btn google" on:click={() => signIn('google', { callbackUrl: '/' })}>
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
						<path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
						<path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
						<path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
						<path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
					</svg>
					התחברו עם Google
				</button>
				<button class="auth-btn github" on:click={() => signIn('github', { callbackUrl: '/' })}>
					<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
						<path fill="currentColor" d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.5 2.3.96 2.87.73c.09-.57.34-.96.63-1.18c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02A9.58 9.58 0 0 1 12 6.82a9.58 9.58 0 0 1 2.5-.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z"/>
					</svg>
					התחברו עם GitHub
				</button>
			</div>

			<div class="modal-footer">
				<p class="terms-text">
					בהתחברות אתם מסכימים <a href="/terms">לתנאי השימוש</a> ו<a href="/privacy">למדיניות הפרטיות</a>
				</p>
			</div>
		</div>
	</div>
{/if}

{#if isProfileModalOpen && $page.data.session?.user}
	<div class="modal-overlay" on:click={() => (isProfileModalOpen = false)}>
		<div class="modal-content profile-modal" on:click|stopPropagation>
			<div class="profile-header">
				<div class="profile-avatar-large">{userAvatarInitial}</div>
				<div class="profile-info">
					<h4>{$page.data.session.user.name}</h4>
					<p class="profile-email">{$page.data.session.user.email}</p>
					<span class="plan-badge-large {userPlan.toLowerCase()}">{userPlan} Plan</span>
				</div>
			</div>

			<div class="profile-stats">
				<div class="stat-card">
					<div class="stat-number">{userTokens}</div>
					<div class="stat-label">שימושים נותרו</div>
				</div>
				<div class="stat-card">
					<div class="stat-number">Hebrew</div>
					<div class="stat-label">שפה עיקרית</div>
				</div>
				<div class="stat-card">
					<div class="stat-number">🎤</div>
					<div class="stat-label">קולות זמינים</div>
				</div>
			</div>

			<div class="modal-section">
				<h5>⚡ פעולות מהירות</h5>
				<div class="quick-actions">
					<a href="/billing" class="action-btn">
						💳 ניהול תשלומים
					</a>
					<button class="action-btn" on:click={navigateToLab}>
						🧪 מעבדת קולות
					</button>
					<a href="/api-docs" class="action-btn">
						📖 תיעוד API
					</a>
				</div>
			</div>

			<div class="modal-section">
				<h5>⚙️ הגדרות</h5>
				<div class="settings-grid">
					<div class="setting-item">
						<span>מצב תצוגה</span>
					<button 
					class="toggle-theme" 
					on:click={() => theme.set($theme === 'dark' ? 'light' : 'dark')}
				>
					{$theme === 'dark' ? '☀️ בהיר' : '🌙 כהה'}
				</button>
					</div>
					<div class="setting-item">
						<span>שפת ממשק</span>
						<span class="setting-value">עברית</span>
					</div>
				</div>
			</div>

			<div class="modal-actions">
				<button class="auth-btn signout" on:click={() => signOut()}>
					🚪 התנתקות
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	:root {
		--bg-color: #f9fafb;
		--text-primary: #111827;
		--text-secondary: #6b7280;
		--accent-color: #4f46e5;
		--accent-hover: #4338ca;
		--card-bg: #ffffff;
		--border-color: #e5e7eb;
		--shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
		--nav-height: 64px;
		--success-color: #10b981;
		--warning-color: #f59e0b;
	}
	:root[data-theme='dark'] {
		--bg-color: #111827;
		--text-primary: #f9fafb;
		--text-secondary: #9ca3af;
		--card-bg: #1f2937;
		--border-color: #374151;
	}
	:global(body) {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
		background: var(--bg-color);
		color: var(--text-primary);
		transition: background-color 0.3s, color 0.3s;
	}

	/* Navigation Bar */
	.nav {
		position: fixed; top: 0; left: 0; right: 0;
		height: var(--nav-height);
		background: color-mix(in srgb, var(--card-bg) 80%, transparent);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid var(--border-color);
		z-index: 100;
	}
	.nav-container {
		max-width: 1200px; height: 100%; margin: 0 auto;
		padding: 0 1.5rem; display: flex;
		justify-content: space-between; align-items: center;
	}
	.logo {
		font-size: 1.25rem; font-weight: 600;
		color: var(--text-primary); text-decoration: none;
	}
	.nav-links {
		display: flex; gap: 2rem; list-style: none;
	}
	.nav-links a {
		font-size: 0.9rem; color: var(--text-secondary);
		text-decoration: none; transition: color 0.2s;
	}
	.nav-links a:hover { color: var(--text-primary); }
	.nav-right { display: flex; align-items: center; gap: 1rem; }
	.nav-btn {
		padding: 8px 16px; border-radius: 8px; font-size: 14px;
		font-weight: 500; cursor: pointer; transition: all 0.2s ease;
		border: 1px solid transparent; background: transparent; color: var(--text-primary);
	}
	.nav-btn.primary {
		background: var(--accent-color); color: white; border-color: var(--accent-color);
	}
	.nav-btn.primary:hover {
		background: var(--accent-hover); border-color: var(--accent-hover);
	}
	.nav-btn.profile-btn {
		display: flex; align-items: center; gap: 0.5rem;
		background: var(--bg-color); border-color: var(--border-color);
	}
	.nav-btn.profile-btn:hover { border-color: #9ca3af; }
	.nav-btn.lab-btn {
		background: color-mix(in srgb, var(--success-color) 10%, var(--card-bg));
		border-color: var(--success-color); color: var(--success-color);
	}
	.nav-btn.lab-btn:hover {
		background: color-mix(in srgb, var(--success-color) 20%, var(--card-bg));
	}
	.avatar {
		width: 24px; height: 24px; border-radius: 50%;
		background: var(--accent-color); color: white;
		display: flex; align-items: center; justify-content: center;
		font-size: 12px; font-weight: 600;
	}

	/* Hero Section Enhancements */
	.hero-badges {
		display: flex; gap: 1rem; justify-content: center; margin-top: 1.5rem;
		flex-wrap: wrap;
	}
	.badge {
		background: color-mix(in srgb, var(--accent-color) 10%, var(--card-bg));
		color: var(--accent-color); padding: 0.5rem 1rem;
		border-radius: 20px; font-size: 0.875rem; font-weight: 500;
		border: 1px solid color-mix(in srgb, var(--accent-color) 20%, transparent);
	}

	/* Main Layout */
	.main {
		min-height: 100vh;
		padding: calc(var(--nav-height) + 4rem) 1rem 4rem;
		display: flex; flex-direction: column; align-items: center;
	}
	.hero {
		width: 100%; max-width: 700px;
	}
	.hero-content {
		text-align: center; margin-bottom: 3rem;
	}
	.hero-title {
		font-size: clamp(2.8rem, 6vw, 4rem); font-weight: 800;
		line-height: 1.1; margin-bottom: 1rem;
		background: linear-gradient(45deg, var(--accent-color), #9333ea);
		-webkit-background-clip: text; -webkit-text-fill-color: transparent;
	}
	.hero-subtitle {
		font-size: 1.25rem; color: var(--text-secondary);
		margin-bottom: 1.5rem; max-width: 550px; margin-inline: auto;
	}
	
	/* TTS Component Styles */
	.demo-section { width: 100%; }
	.tts-component {
		background-color: var(--card-bg); border: 1px solid var(--border-color);
		border-radius: 16px; box-shadow: var(--shadow);
		display: flex; flex-direction: column; height: 380px; overflow: hidden;
	}
	.text-area-wrapper { position: relative; flex-grow: 1; display: flex; }
	.text-input {
		width: 100%; height: 100%; padding: 24px;
		border: none; outline: none; resize: none;
		font-size: 18px; line-height: 1.6;
		background-color: transparent; color: var(--text-primary);
	}
	.floating-tabs {
		position: absolute; bottom: 20px; right: 24px;
		display: flex; gap: 8px; flex-wrap: wrap;
	}
	.voice-tab {
		background-color: color-mix(in srgb, var(--card-bg) 95%, black);
		border: 1px solid var(--border-color); border-radius: 8px;
		padding: 6px 12px; font-size: 13px; cursor: pointer;
		transition: all 0.2s ease; user-select: none;
	}
	.voice-tab:hover { transform: translateY(-2px); border-color: #9ca3af; }
	.voice-tab.active {
		border-color: var(--accent-color);
		background-color: color-mix(in srgb, var(--accent-color) 10%, var(--card-bg));
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-color) 20%, transparent);
	}
	.voice-tab .voice-name { font-weight: 600; color: var(--text-primary); }
	.voice-tab .voice-description { color: var(--text-secondary); margin-right: 6px; }
	.bottom-controls {
		display: flex; justify-content: space-between; align-items: center;
		padding: 16px 24px; border-top: 1px solid var(--border-color);
	}
	.voice-select {
		padding: 0.5rem 1rem; border: 1px solid var(--border-color);
		border-radius: 8px; background: var(--bg-color);
		color: var(--text-primary); font-size: 0.875rem; cursor: pointer;
	}
	.generation-tools { display: flex; align-items: center; gap: 16px; }
	.char-count {
		font-size: 0.875rem; color: var(--text-secondary);
		direction: ltr; font-variant-numeric: tabular-nums;
	}
	.generate-button {
		background: var(--accent-color); color: white; border: none;
		border-radius: 8px; padding: 12px 24px; font-size: 1rem;
		font-weight: 500; cursor: pointer; transition: all 0.2s ease;
		display: flex; align-items: center; gap: 0.5rem;
	}
	.generate-button:hover:not(:disabled) {
		background: var(--accent-hover); transform: translateY(-1px);
	}
	.generate-button:disabled { background-color: #9ca3af; cursor: not-allowed; }
	.loading-spinner {
		width: 16px; height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white; border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin { to { transform: rotate(360deg); } }

	/* Audio Player */
	.audio-player {
		margin-top: 1.5rem; padding: 1rem; background: var(--card-bg);
		border: 1px solid var(--border-color); border-radius: 12px;
		box-shadow: var(--shadow); animation: fadeIn 0.5s ease;
	}
	@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
	.audio-player audio { width: 100%; }
	.download-link {
		display: inline-block; margin-top: 0.75rem; font-size: 0.875rem;
		color: var(--accent-color); text-decoration: none;
	}
	.download-link:hover { text-decoration: underline; }

	/* Content Sections (Features & Pricing) */
	.content-section {
		width: 100%; max-width: 1000px; margin: 4rem auto 0;
	}
	.section-title {
		font-size: 2.25rem; font-weight: 700;
		text-align: center; margin-bottom: 3rem; color: var(--text-primary);
	}
	.features-grid {
		display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
	}
	.feature-card {
		background: var(--card-bg); border: 1px solid var(--border-color);
		border-radius: 12px; padding: 2rem;
		transition: all 0.3s ease;
	}
	.feature-card:hover { transform: translateY(-4px); box-shadow: var(--shadow); }
	.feature-icon { font-size: 2rem; margin-bottom: 1rem; }
	.feature-title { font-size: 1.125rem; font-weight: 600; margin-bottom: 0.5rem; }
	.feature-description { color: var(--text-secondary); line-height: 1.6; }

	/* Enhanced Pricing Section */
	.pricing-section { text-align: center; }
	.pricing-grid {
		display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 2rem; margin-bottom: 2rem;
	}
	.pricing-card {
		background: var(--card-bg); border: 1px solid var(--border-color);
		border-radius: 16px; padding: 2rem; position: relative;
		box-shadow: var(--shadow); transition: all 0.3s ease;
	}
	.pricing-card:hover { transform: translateY(-4px); }
	.pricing-card.popular {
		border-color: var(--accent-color);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-color) 20%, transparent);
	}
	.popular-badge {
		position: absolute; top: -12px; left: 50%;
		transform: translateX(-50%);
		background: var(--accent-color); color: white;
		padding: 0.5rem 1rem; border-radius: 20px;
		font-size: 0.75rem; font-weight: 600;
	}
	.pricing-header { margin-bottom: 1.5rem; }
	.plan-name { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; }
	.pricing-highlight {
		font-size: 2.5rem; font-weight: 800; color: var(--text-primary);
		margin-bottom: 0.25rem;
	}
	.plan-description { color: var(--text-secondary); font-size: 0.875rem; }
	.pricing-details { margin-bottom: 2rem; }
	.pricing-feature {
		text-align: right; margin-bottom: 0.75rem; font-size: 0.9rem;
		color: var(--text-primary);
	}
	.pricing-btn {
		width: 100%; padding: 12px; border-radius: 8px;
		font-size: 1rem; font-weight: 500; cursor: pointer;
		transition: all 0.2s ease; border: 1px solid var(--border-color);
		background: var(--bg-color); color: var(--text-primary);
	}
	.pricing-btn.primary {
		background: var(--accent-color); color: white; border-color: var(--accent-color);
	}
	.pricing-btn.primary:hover {
		background: var(--accent-hover); border-color: var(--accent-hover);
	}
	.pricing-btn:hover:not(.primary) { background-color: var(--border-color); }
	.pricing-note {
		background: color-mix(in srgb, var(--warning-color) 10%, var(--card-bg));
		border: 1px solid color-mix(in srgb, var(--warning-color) 30%, transparent);
		border-radius: 12px; padding: 1rem; margin-top: 2rem;
		text-align: right; font-size: 0.875rem;
	}
	
	/* Enhanced Modal Styles */
	.modal-overlay {
		position: fixed; top: 0; left: 0; width: 100%; height: 100%;
		background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(8px);
		display: flex; align-items: center; justify-content: center;
		z-index: 1000; animation: fadeIn 0.3s ease;
	}
	.modal-content {
		background: var(--card-bg); padding: 2rem; border-radius: 16px;
		border: 1px solid var(--border-color);
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
		width: 100%; max-width: 400px;
	}

	/* Enhanced Auth Modal */
	.auth-modal { text-align: center; max-width: 450px; }
	.modal-header { margin-bottom: 2rem; }
	.modal-icon {
		font-size: 3rem; margin-bottom: 1rem;
		background: color-mix(in srgb, var(--accent-color) 10%, var(--card-bg));
		color: var(--accent-color); width: 80px; height: 80px;
		border-radius: 50%; display: flex; align-items: center;
		justify-content: center; margin: 0 auto 1rem;
	}
	.modal-content h3 { margin: 0 0 0.5rem 0; font-size: 1.5rem; }
	.modal-content p { color: var(--text-secondary); margin-bottom: 1.5rem; }
	.auth-features {
		background: var(--bg-color); border-radius: 12px;
		padding: 1.5rem; margin-bottom: 2rem; text-align: right;
	}
	.auth-feature {
		display: flex; align-items: center; gap: 0.75rem;
		margin-bottom: 0.75rem; font-size: 0.9rem;
	}
	.auth-feature:last-child { margin-bottom: 0; }
	.feature-check {
		color: var(--success-color); font-weight: 600;
		background: color-mix(in srgb, var(--success-color) 10%, var(--card-bg));
		border-radius: 50%; width: 20px; height: 20px;
		display: flex; align-items: center; justify-content: center;
		font-size: 12px; flex-shrink: 0;
	}
	.oauth-buttons { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
	.auth-btn {
		width: 100%; padding: 12px; border-radius: 8px;
		font-size: 1rem; font-weight: 500; cursor: pointer;
		transition: all 0.2s ease; border: 1px solid var(--border-color);
		display: flex; align-items: center; justify-content: center; gap: 0.75rem;
	}
	.auth-btn:focus-visible {
		outline: none;
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-color) 30%, transparent);
	}
	.auth-btn.google { background: var(--card-bg); color: var(--text-primary); }
	.auth-btn.github { background: #24292f; color: white; border-color: #24292f; }
	:root[data-theme='dark'] .auth-btn.github { background: #f0f6fc; color: #1f2328; border-color: #f0f6fc; }
	.auth-btn.signout {
		background: transparent; color: #ef4444; border-color: #fecaca;
	}
	:root[data-theme='dark'] .auth-btn.signout { border-color: #4b5563; }
	.auth-btn.signout:hover { background: #fee2e2; }
	:root[data-theme='dark'] .auth-btn.signout:hover { background-color: #374151; }
	.modal-footer { text-align: center; }
	.terms-text { font-size: 0.75rem; color: var(--text-secondary); }
	.terms-text a { color: var(--accent-color); text-decoration: none; }
	.terms-text a:hover { text-decoration: underline; }
	
	/* Enhanced Profile Modal */
	.profile-modal { text-align: left; max-width: 500px; }
	.profile-header { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem; }
	.profile-avatar-large {
		width: 64px; height: 64px; border-radius: 50%;
		background: var(--accent-color); color: white;
		display: flex; align-items: center; justify-content: center;
		font-size: 2rem; font-weight: 600;
	}
	.profile-info h4 { margin: 0 0 0.25rem 0; font-size: 1.25rem; }
	.profile-email { margin: 0 0 0.5rem 0; font-size: 0.875rem; color: var(--text-secondary); }
	.plan-badge-large {
		font-size: 0.75rem; font-weight: 600; padding: 0.25rem 0.75rem;
		border-radius: 12px; text-transform: uppercase;
	}
	.plan-badge-large.free { background: #f3f4f6; color: #6b7280; }
	.plan-badge-large.basic { background: color-mix(in srgb, var(--accent-color) 10%, var(--card-bg)); color: var(--accent-color); }
	.plan-badge-large.pro { background: color-mix(in srgb, var(--success-color) 10%, var(--card-bg)); color: var(--success-color); }
	.plan-badge-large.premium { background: color-mix(in srgb, var(--warning-color) 10%, var(--card-bg)); color: var(--warning-color); }

	.profile-stats {
		display: grid; grid-template-columns: repeat(3, 1fr);
		gap: 1rem; margin-bottom: 2rem;
	}
	.stat-card {
		background: var(--bg-color); border: 1px solid var(--border-color);
		border-radius: 8px; padding: 1rem; text-align: center;
	}
	.stat-number {
		font-size: 1.5rem; font-weight: 700; color: var(--text-primary);
		margin-bottom: 0.25rem;
	}
	.stat-label { font-size: 0.75rem; color: var(--text-secondary); }

	.modal-section { margin-bottom: 2rem; }
	.modal-section h5 {
		margin: 0 0 1rem 0; color: var(--text-primary);
		font-size: 1rem; font-weight: 600; display: flex;
		align-items: center; gap: 0.5rem;
	}
	.quick-actions {
		display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 0.75rem;
	}
	.action-btn {
		padding: 0.75rem 1rem; border-radius: 8px;
		background: var(--bg-color); border: 1px solid var(--border-color);
		text-decoration: none; color: var(--text-primary);
		font-size: 0.875rem; text-align: center; cursor: pointer;
		transition: all 0.2s ease; display: flex; align-items: center;
		justify-content: center; gap: 0.5rem;
	}
	.action-btn:hover { background-color: var(--border-color); }
	.settings-grid {
		background: var(--bg-color); border: 1px solid var(--border-color);
		border-radius: 8px; padding: 1rem;
	}
	.setting-item {
		display: flex; justify-content: space-between; align-items: center;
		margin-bottom: 1rem;
	}
	.setting-item:last-child { margin-bottom: 0; }
	.setting-value {
		color: var(--text-secondary); font-size: 0.875rem;
	}
	.toggle-theme {
		padding: 0.5rem 1rem; border-radius: 6px;
		background: var(--card-bg); border: 1px solid var(--border-color);
		cursor: pointer; transition: background-color 0.2s;
		font-size: 0.875rem; color: var(--text-primary);
	}
	.toggle-theme:hover { background-color: var(--bg-color); }
	.modal-actions { margin-top: 2rem; }
	
	/* Responsive Adjustments */
	@media (max-width: 768px) {
		.nav-links { display: none; }
		.nav-right { gap: 0.5rem; }
		.nav-btn { padding: 6px 12px; font-size: 13px; }
		.hero-badges { gap: 0.75rem; }
		.pricing-grid { grid-template-columns: 1fr; }
		.profile-stats { grid-template-columns: repeat(2, 1fr); }
		.quick-actions { grid-template-columns: 1fr; }
	}

	@media (max-width: 480px) {
		.modal-content { margin: 1rem; padding: 1.5rem; }
		.profile-header { flex-direction: column; text-align: center; }
		.profile-stats { grid-template-columns: 1fr; }
	}
</style>