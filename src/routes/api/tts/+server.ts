// src/routes/api/tts/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
// Use static private imports instead of dynamic
import { PRIVATE_BEAM_API_URL, PRIVATE_BEAM_API_KEY } from '$env/static/private';

interface TTSRequest {
  prompt: string[];
  nikud: boolean;
  vc: boolean;
  ref_audio: string | null;
  ref_text: string | null;
}

interface TTSResponse {
  audio_url?: string;
  task_id?: string;
  status?: string;
  message?: string;
  error?: string;
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const requestData: TTSRequest = await request.json();
    
    const {
      prompt,
      nikud,
      vc,
      ref_audio,
      ref_text,
    } = requestData;

    console.log('Received /api/tts payload:', {
      prompt,
      nikud,
      vc,
      ref_audio,
      ref_text,
    });

    // Add environment variable debugging
    console.log('Environment check:', {
      hasApiUrl: !!PRIVATE_BEAM_API_URL,
      hasApiKey: !!PRIVATE_BEAM_API_KEY,
      apiUrlLength: PRIVATE_BEAM_API_URL?.length || 0,
      apiKeyLength: PRIVATE_BEAM_API_KEY?.length || 0,
    });

    // Validate environment variables
    if (!PRIVATE_BEAM_API_URL) {
      console.error('Missing PRIVATE_BEAM_API_URL environment variable');
      return json({ error: 'TTS service configuration error: Missing API URL' }, { status: 500 });
    }

    if (!PRIVATE_BEAM_API_KEY) {
      console.error('Missing PRIVATE_BEAM_API_KEY environment variable');
      return json({ error: 'TTS service configuration error: Missing API Key' }, { status: 500 });
    }

    // Validate input
    if (!prompt || !Array.isArray(prompt) || prompt.length === 0) {
      return json({ error: 'Prompt is required and must be a non-empty array' }, { status: 400 });
    }

    // Check if text is Hebrew (basic validation)
    const hebrewText = prompt[0];
    const hebrewRegex = /[\u0590-\u05FF]/;
    if (!hebrewRegex.test(hebrewText)) {
      return json({ error: 'Text must contain Hebrew characters' }, { status: 400 });
    }

    // Prepare the payload exactly as specified
    const payload = {
      prompt,
      nikud,
      vc,
      ref_audio,
      ref_text
    };

    console.log('Sending request to:', PRIVATE_BEAM_API_URL);
    console.log('With payload:', payload);

    const response = await fetch(PRIVATE_BEAM_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PRIVATE_BEAM_API_KEY}`,
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
      },
      body: JSON.stringify(payload),
    });

    console.log('TTS API Response Status:', response.status);
    console.log('TTS API Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`TTS API Error: ${response.status} ${response.statusText}`);
      console.error('Error response body:', errorText);
      
      return json(
        { 
          error: `TTS service error: ${response.statusText}`,
          details: errorText,
          status: response.status 
        }, 
        { status: response.status }
      );
    }

    const result: TTSResponse = await response.json();
    
    console.log('TTS API Success Response:', result);

    // Return the response from the TTS service
    return json(result);

  } catch (error) {
    console.error('TTS API Error:', error);
    
    if (error instanceof SyntaxError) {
      return json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return json({ error: 'Failed to connect to TTS service' }, { status: 502 });
    }
    
    return json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
};