<!-- src/routes/+page.svelte -->
<script lang="ts">
    import { page } from '$app/state';
    import { SignOut, SignIn } from '@auth/sveltekit/components';
  import { onMount } from 'svelte';

  // Types
  interface VoiceOption {
    value: string;
    label: string;
    disabled?: boolean;
  }

  // State
  let activeTab: 'tts' | 'clone' = 'tts';
  let textInput = '';
  let cloneInput = '';
  let nikudEnabled = false;
  let selectedVoice = 'default';
  let temperature = 0.5;
  let isRecording = false;
  let voiceTrained = false;
  let recordedBlob: Blob | null = null;
  let mediaRecorder: MediaRecorder | null = null;
  let audioChunks: BlobPart[] = [];
  let recordingStatus = 'Ready to record';
  let currentTextIndex = 0;

  // New state for uploading and storing the URL
  let isUploading = false;
  let uploadedAudioUrl: string | null = null;
  
  // Task polling state
  let isLoading = false;
  let taskId: string | null = null;
  let pollingInterval: number | null = null;
  let generatedAudioUrl: string | null = null;

  // Constants
  const MAX_CHARS = 100;
  
  const trainingTexts = [
    "שלום וברוכים הבאים לעולם המרתק של טכנולוגיית הדיבור המתקדמת. אנחנו חיים בעידן שבו הבינה המלאכותית מסוגלת ליצור קולות טבעיים ומבטאים מושלמים.",
    "בעיר תל אביב השוקקת, בין רחובותיה הצבעוניים ובתי הקפה הרבים, מתפתחת תרבות טכנולוגית ייחודית. מהנדסי תוכנה וחוקרי בינה מלאכותית עובדים יחד.",
    "חקר הים התיכון והאקלים הים תיכוני מלמד אותנו על השפעות השינוי האקלימי על האזור שלנו. מדענים ישראליים בודקים את השינויים בטמפרטורת המים.",
    "המטבח הישראלי משלב מסורות קולינריות מכל רחבי העולם - מהמטבח המרוקאי הצבעוני דרך המטבח הרוסי העשיר ועד למטבח הבלקני הטעים.",
    "הטכנולוגיה הישראלית זוכה להכרה עולמית בתחומים רבים - מסייבר ובטחון מידע דרך חקלאות מתקדמת ועד רפואה דיגיטלית."
  ];

  // Reactive statements
  $: textCharCount = textInput.length;
  $: cloneCharCount = cloneInput.length;
  $: textCharClass = getCharCountClass(textCharCount);
  $: cloneCharClass = getCharCountClass(cloneCharCount);
  $: currentTrainingText = trainingTexts[currentTextIndex];
  $: trainingWords = currentTrainingText.split(' ');
  
  $: voiceOptions = [
    { value: 'default', label: 'Default' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'custom', label: voiceTrained ? 'Your Voice' : 'Custom', disabled: !voiceTrained }
  ] as VoiceOption[];

    function requireAuth() {
    if (!page.data.session?.user) {
      alert('Please sign in to use this feature');
      return false;
    }
    return true;
  }

  // Functions
  function getCharCountClass(count: number): string {
    if (count > 90) return 'danger';
    if (count > 75) return 'warning';
    return '';
  }

  function switchTab(tab: 'tts' | 'clone'): void {
    activeTab = tab;
  }

  // Task status checking (no changes needed here)
  const checkTaskStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/task/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch task status: ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error(error);
      alert(`Error checking task status: ${error.message}`);
      return null;
    }
  };

  // Function to poll task status (no changes needed here)
  const pollTaskStatus = (id: string) => {
    isLoading = true;
    pollingInterval = window.setInterval(async () => {
      const statusData = await checkTaskStatus(id);
      if (!statusData) return;
      console.log('Task Status:', statusData.status);
      if (statusData.status === 'COMPLETE') {
        if (pollingInterval) clearInterval(pollingInterval);
        
        if (Array.isArray(statusData.outputs) && statusData.outputs.length > 0) {
          generatedAudioUrl = statusData.outputs[0].url || statusData.outputs[0];
          
          if (generatedAudioUrl) {
            const audio = new Audio(generatedAudioUrl);
            audio.play().catch(console.error);
          }
          
          alert('Audio generated successfully! 🎵');
        } else {
          console.error('TTS API Response Missing "outputs":', statusData);
          alert('TTS API response missing audio output.');
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

  import { onDestroy } from 'svelte';
  onDestroy(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
  });

  async function startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      mediaRecorder.onstop = () => {
        // Let the browser create the blob with its default MIME type (e.g., audio/webm)
        recordedBlob = new Blob(audioChunks); 
        
        uploadedAudioUrl = null; 
        voiceTrained = false;
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
      recordingStatus = 'Recording complete. You can now Play or Save.';
    }
  }

  function playRecording(): void {
    if (recordedBlob) {
      const audio = new Audio(URL.createObjectURL(recordedBlob));
      audio.play().catch(console.error);
    }
  }

   async function saveVoice(): Promise<void> {
    if (!recordedBlob) {
      alert('Please record your voice first.');
      return;
    }
    isUploading = true;
    recordingStatus = 'Uploading and converting voice...';

    try {
      // *** CONVERT TO WAV BEFORE UPLOADING ***
      console.log('Original blob type:', recordedBlob.type, 'size:', recordedBlob.size);
      const wavBlob = await blobToWav(recordedBlob);
      console.log('Converted WAV blob type:', wavBlob.type, 'size:', wavBlob.size);

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'audio/wav', // The header is now correct because the data is correct
        },
        body: wavBlob, // Upload the converted WAV blob
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || 'Upload failed');
      }

      const result = await response.json();
      uploadedAudioUrl = result.audioUrl;
      voiceTrained = true;
      recordingStatus = 'Voice saved successfully! Ready to clone.';
      
    } catch (error: any) {
      console.error('Upload Error:', error);
      alert(`Failed to save voice: ${error.message}`);
      recordingStatus = 'Upload failed. Please try again.';
    } finally {
      isUploading = false;
    }
  }

  // NEW HELPER FUNCTION - Add this to your <script> section
  async function blobToWav(blob: Blob): Promise<Blob> {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = await blob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Get the raw PCM audio data
    const pcmData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const numChannels = 1; // Mono
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);

    const wavData = new DataView(new ArrayBuffer(44 + pcmData.length * 2));

    // Write WAV header
    let offset = 0;
    // "RIFF" chunk descriptor
    wavData.setUint32(offset, 0x52494646, false); offset += 4;
    wavData.setUint32(offset, 36 + pcmData.length * 2, true); offset += 4;
    wavData.setUint32(offset, 0x57415645, false); offset += 4;
    // "fmt " sub-chunk
    wavData.setUint32(offset, 0x666d7420, false); offset += 4;
    wavData.setUint32(offset, 16, true); offset += 4;
    wavData.setUint16(offset, 1, true); offset += 2; // PCM
    wavData.setUint16(offset, numChannels, true); offset += 2;
    wavData.setUint32(offset, sampleRate, true); offset += 4;
    wavData.setUint32(offset, byteRate, true); offset += 4;
    wavData.setUint16(offset, blockAlign, true); offset += 2;
    wavData.setUint16(offset, bitsPerSample, true); offset += 2;
    // "data" sub-chunk
    wavData.setUint32(offset, 0x64617461, false); offset += 4;
    wavData.setUint32(offset, pcmData.length * 2, true); offset += 4;

    // Write PCM data
    for (let i = 0; i < pcmData.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, pcmData[i]));
      wavData.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return new Blob([wavData], { type: 'audio/wav' });
  }

  function randomizeTrainingText(): void {
    currentTextIndex = Math.floor(Math.random() * trainingTexts.length);
  }

  // generateTTS function remains unchanged
  async function generateTTS(): Promise<void> {
    if (!requireAuth()) return;
    if (!textInput.trim()) {
      alert('Enter Hebrew text');
      return;
    }
    if (isLoading) {
      alert('Please wait for the current generation to complete');
      return;
    }
    isLoading = true;
    generatedAudioUrl = null;
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: [textInput],
          nikud: nikudEnabled,
          ref_audio: null,
          temperature: temperature
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log('TTS Response:', result);
      
      if (result.task_id) {
        taskId = result.task_id;
        console.log('Task ID:', taskId);
        pollTaskStatus(taskId!);
      } else if (result.audio_url) {
        generatedAudioUrl = result.audio_url;
        const audio = new Audio(result.audio_url);
        audio.play().catch(console.error);
        alert('Audio generated successfully! 🎵');
        isLoading = false;
      } else {
        throw new Error('No task_id or audio_url in response');
      }
    } catch (error: any) {
      console.error('TTS Generation Error:', error);
      alert(`Failed to generate audio: ${error.message}`);
      isLoading = false;
    }
  }

  // *** MODIFIED FUNCTION ***
  async function generateClone(): Promise<void> {
    if (!requireAuth()) return;
    if (!cloneInput.trim()) {
      alert('Enter text to clone');
      return;
    }
    // Check for the uploaded URL now
    if (!voiceTrained || !uploadedAudioUrl) {
      alert('Please record and save your voice first. The voice must be successfully uploaded.');
      return;
    }

    if (isLoading) {
      alert('Please wait for the current task to complete.');
      return;
    }

    isLoading = true;
    generatedAudioUrl = null; // Clear previous results

    try {
      const clonePayload = {
        prompt: [cloneInput],
        nikud: nikudEnabled,
        ref_audio: uploadedAudioUrl, // Use the public URL from Supabase
        temperature: temperature
      };

      console.log('Sending Clone Payload:', clonePayload);

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clonePayload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Clone Response:', result);

      if (result.task_id) {
        taskId = result.task_id;
        console.log('Clone Task ID:', taskId);
        // Start polling for the clone task status
        pollTaskStatus(taskId!);
      } else {
        throw new Error('Cloning service did not return a task_id.');
      }
    } catch (error: any) {
      console.error('Clone Generation Error:', error);
      alert(`Failed to generate cloned voice: ${error.message}`);
      isLoading = false; // Reset loading state on error
    }
    // No finally block needed to manage button state as it's handled by `isLoading`
  }

  onMount(() => {
    randomizeTrainingText();
  });
</script>
<!-- Rest of the HTML and CSS remains unchanged -->

<div class="auth-section">
  {#if page.data.session?.user}
    <div class="user-info">
      <span>Welcome, {page.data.session.user.name || page.data.session.user.email}</span>
      <SignOut>
        <button slot="submitButton" class="auth-btn signout">Sign Out</button>
      </SignOut>
    </div>
  {:else}
    <div class="signin-prompt">
      <span>Sign in to use Hebrew TTS</span>
      <SignIn provider="github">
        <button slot="submitButton" class="auth-btn signin">Sign In with GitHub</button>
      </SignIn>
    </div>
  {/if}
</div>
<svelte:head>
  <title>Hebrew TTS</title>
  <meta name="description" content="State-of-the-art Hebrew voice AI with cloning" />
</svelte:head>
<div class="container" dir="rtl">
  <header class="header">
    <h1 class="title">Hebrew TTS</h1>
    <p class="subtitle">State-of-the-art Hebrew voice AI with cloning</p>
  </header>
  <div class="tabs">
    <button 
      class="tab" 
      class:active={activeTab === 'tts'}
      on:click={() => switchTab('tts')}
    >
      Text to Speech
    </button>
    <button 
      class="tab" 
      class:active={activeTab === 'clone'}
      on:click={() => switchTab('clone')}
    >
      Voice Cloning
    </button>
  </div>
  <!-- TTS Content -->
  {#if activeTab === 'tts'}
    <div class="content">
      <div class="section">
        <textarea 
          bind:value={textInput}
          class="textarea" 
          placeholder="הכנס כאן את הטקסט בעברית..."
          maxlength={MAX_CHARS}
        ></textarea>
        <div class="char-count {textCharClass}">
          {textCharCount}/{MAX_CHARS}
        </div>
      </div>
      <div class="controls">
        <div class="toggle-wrapper">
          <button 
            class="toggle"
            class:active={nikudEnabled}
            on:click={() => nikudEnabled = !nikudEnabled}
            aria-label="Toggle Nikud"
          >
            <div class="toggle-knob"></div>
          </button>
          <span class="toggle-label">Nikud</span>
        </div>
        <div class="slider-wrapper">
          <label class="slider-label">Temperature: {temperature.toFixed(2)}</label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            bind:value={temperature} 
            class="temperature-slider"
          />
        </div>
        <select bind:value={selectedVoice} class="voice-select">
          {#each voiceOptions as option}
            <option value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          {/each}
        </select>
      </div>
      <button 
        class="generate-btn"
        class:loading={isLoading}
        on:click={generateTTS}
        disabled={!textInput.trim() || isLoading}
      >
        {isLoading ? 'Generating...' : 'Generate'}
      </button>
      <!-- Audio player for generated audio -->
      {#if generatedAudioUrl}
        <div class="audio-player">
          <h3>Generated Audio:</h3>
          <audio controls src={generatedAudioUrl}>
            Your browser does not support the audio element.
          </audio>
          <a href={generatedAudioUrl} download="generated-audio.wav" class="download-link">
            Download Audio
          </a>
        </div>
      {/if}
    </div>
  {/if}
  <!-- Clone Content -->
  {#if activeTab === 'clone'}
    <div class="content">
      <div class="recording-box">
        <p>Read this text to train your voice:</p>
        
        <div class="sample-text">
          {#each trainingWords as word, i}
            <span class="word">{word}</span>{#if i < trainingWords.length - 1} {/if}
          {/each}
        </div>
        <div class="status" class:recording={isRecording}>
          {recordingStatus}
        </div>
        <div class="record-controls">
          <button 
            class="record-btn"
            on:click={isRecording ? stopRecording : startRecording}
            disabled={isUploading}
          >
            {isRecording ? 'Stop' : 'Record'}
          </button>
          <button 
            class="record-btn"
            on:click={playRecording}
            disabled={!recordedBlob || isUploading}
          >
            Play
          </button>
          <button 
            class="record-btn primary"
            on:click={saveVoice}
            disabled={!recordedBlob || isUploading || voiceTrained}
          >
            <!-- Show different text while uploading -->
            {isUploading ? 'Uploading...' : 'Save Voice'}
          </button>
        </div>
      </div>
      <div class="section">
        <textarea 
          bind:value={cloneInput}
          class="textarea clone-input" 
          placeholder="הכנס טקסט לבדיקה..."
          maxlength={MAX_CHARS}
        ></textarea>
        <div class="char-count {cloneCharClass}">
          {cloneCharCount}/{MAX_CHARS}
        </div>
      </div>
      <div class="controls">
        <div class="toggle-wrapper">
          <button 
            class="toggle"
            class:active={nikudEnabled}
            on:click={() => nikudEnabled = !nikudEnabled}
            aria-label="Toggle Nikud"
          >
            <div class="toggle-knob"></div>
          </button>
          <span class="toggle-label">Nikud</span>
        </div>
        <div class="slider-wrapper">
          <label class="slider-label">Temperature: {temperature.toFixed(2)}</label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            bind:value={temperature} 
            class="temperature-slider"
          />
        </div>
      </div>
      <button 
        class="generate-btn"
        class:loading={isLoading}
        on:click={generateClone}
        disabled={!voiceTrained || !cloneInput.trim() || isLoading}
      >
        {isLoading ? 'Generating...' : 'Generate with Your Voice'}
      </button>
      {#if generatedAudioUrl}
        <div class="audio-player">
          <h3>Generated Audio:</h3>
          <audio controls src={generatedAudioUrl}>
            Your browser does not support the audio element.
          </audio>
          <a href={generatedAudioUrl} download="generated-audio.wav" class="download-link">
            Download Audio
          </a>
        </div>
      {/if}
    </div>
  {/if}
</div>
<style>
  /* All CSS remains unchanged */
  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    background: #fafafa;
    color: #1a1a1a;
    line-height: 1.5;
    margin: 0;
    padding: 0;
  }
  .container {
    max-width: 640px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }
  .header {
    text-align: center;
    margin-bottom: 3rem;
  }
  .title {
    font-size: 2.5rem;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 0.5rem;
  }
  .subtitle {
    font-size: 1.1rem;
    color: #6b7280;
    font-weight: 400;
  }
  .tabs {
    display: flex;
    background: #f3f4f6;
    border-radius: 8px;
    padding: 4px;
    margin-bottom: 2rem;
  }
  .tab {
    flex: 1;
    padding: 12px 16px;
    border: none;
    background: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    color: #6b7280;
    position: relative;
    overflow: hidden;
  }
  .tab:hover {
    transform: translateY(-1px);
  }
  .tab.active {
    background: white;
    color: #1a1a1a;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    transform: translateY(-2px);
  }
  .content {
    animation: fadeIn 0.3s ease-in-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .section {
    margin-bottom: 1.5rem;
  }
  .textarea {
    width: 100%;
    min-height: 180px;
    padding: 20px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    font-size: 16px;
    font-family: inherit;
    resize: vertical;
    transition: all 0.3s ease;
    background: white;
    box-sizing: border-box;
  }
  .textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    transform: translateY(-2px);
  }
  .textarea:hover {
    border-color: #d1d5db;
    transform: translateY(-1px);
  }
  .clone-input {
    min-height: 100px;
  }
  .char-count {
    text-align: left;
    font-size: 14px;
    color: #9ca3af;
    margin-top: 8px;
  }
  .char-count.warning { color: #f59e0b; }
  .char-count.danger { color: #ef4444; }
  .controls {
    display: flex;
    gap: 1rem;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }
  .toggle-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .toggle {
    position: relative;
    width: 44px;
    height: 24px;
    background: #e5e7eb;
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.15s ease;
    border: none;
  }
  .toggle.active {
    background: #3b82f6;
  }
  .toggle-knob {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: transform 0.15s ease;
  }
  .toggle.active .toggle-knob {
    transform: translateX(20px);
  }
  .toggle-label {
    font-size: 14px;
    color: #6b7280;
  }
  .slider-wrapper {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 120px;
  }
  .slider-label {
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
  }
  .temperature-slider {
    width: 100%;
    height: 4px;
    background: #e5e7eb;
    border-radius: 2px;
    outline: none;
    appearance: none;
  }
  .temperature-slider::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    background: #3b82f6;
    border-radius: 50%;
    cursor: pointer;
  }
  .temperature-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: #3b82f6;
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }
  .voice-select {
    padding: 8px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 14px;
    background: white;
    cursor: pointer;
    min-width: 140px;
  }
  .voice-select:focus {
    outline: none;
    border-color: #3b82f6;
  }
  .generate-btn {
    width: 100%;
    background: linear-gradient(135deg, #16a34a, #15803d);
    color: white;
    border: none;
    padding: 16px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  .generate-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #15803d, #166534);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(22, 163, 74, 0.3);
  }
  .generate-btn:disabled {
    background: #d1d5db;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  .recording-box {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    padding: 2.5rem;
    text-align: center;
    margin-bottom: 1.5rem;
    transition: all 0.3s ease;
  }
  .recording-box:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  }
  .sample-text {
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.5rem;
    margin: 1.5rem 0;
    font-size: 16px;
    line-height: 1.8;
  }
  .word {
    display: inline-block;
    padding: 2px 4px;
    border-radius: 4px;
    transition: all 0.4s ease;
  }
  .record-controls {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    margin: 1rem 0;
  }
  .record-btn {
    padding: 10px 20px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    background: white;
  }
  .record-btn.primary {
    background: #dc2626;
    border-color: #dc2626;
    color: white;
  }
  .record-btn.primary:hover:not(:disabled) {
    background: #b91c1c;
  }
  .record-btn:hover:not(:disabled) {
    border-color: #d1d5db;
  }
  .record-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .status {
    font-size: 14px;
    color: #6b7280;
    margin: 0.5rem 0;
  }
  .status.recording {
    color: #dc2626;
  }
  .audio-player {
    margin-top: 1.5rem;
    padding: 1rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }
  .audio-player h3 {
    margin: 0 0 1rem 0;
    font-size: 16px;
    color: #1a1a1a;
  }
  .download-link {
    display: inline-block;
    margin-top: 0.5rem;
    padding: 8px 12px;
    background: #f3f4f6;
    border-radius: 6px;
    text-decoration: none;
    color: #6b7280;
    font-size: 14px;
    font-weight: 500;
  }
  .download-link:hover {
    background: #e5e7eb;
  }
  @media (max-width: 640px) {
    .title {
      font-size: 2rem;
    }
    
    .controls {
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
    }
    
    .record-controls {
      flex-direction: column;
      gap: 0.5rem;
    }
  }

  .auth-section {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 2rem;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .user-info {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .signin-prompt {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .auth-btn {
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }

  .auth-btn.signin {
    background: #24292f;
    color: white;
  }

  .auth-btn.signin:hover {
    background: #1c2128;
  }

  .auth-btn.signout {
    background: #f3f4f6;
    color: #6b7280;
    border: 1px solid #e5e7eb;
  }

  .auth-btn.signout:hover {
    background: #e5e7eb;
  }
</style>