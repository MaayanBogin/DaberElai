import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

interface TTSRequest {
  prompt: string;
  nikud: boolean;
  ref_audio: string | null;
  temperature: number;
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
      ref_audio,
      temperature
    } = requestData;

    console.log('Received /api/tts payload:', {
      prompt,
      nikud,
      ref_audio,
      temperature,
    });

    if (!prompt || typeof prompt !== 'string') {
      return json({ error: 'Prompt is required and must be a string' }, { status: 400 });
    }

    const hebrewRegex = /[\u0590-\u05FF]/;
    if (!hebrewRegex.test(prompt)) {
      return json({ error: 'Text must contain Hebrew characters' }, { status: 400 });
    }

    // Validate temperature
    const validTemperature = (typeof temperature === 'number' && temperature >= 0 && temperature <= 1) 
      ? temperature 
      : 0.7;

    const ttsApiUrl = env.PRIVATE_BEAM_API_URL;
    
    const payload = {
      prompt,
      nikud,
      ref_audio,
      temperature: validTemperature
    };

    const response = await fetch(ttsApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.PRIVATE_BEAM_API_KEY}`,
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`TTS API Error: ${response.status} ${response.statusText}`);
      return json(
        { error: `TTS service error: ${response.statusText}` }, 
        { status: response.status }
      );
    }

    const result: TTSResponse = await response.json();
    
    console.log('TTS API Response:', result);

    return json(result);

  } catch (error) {
    console.error('TTS API Error:', error);
    
    if (error instanceof SyntaxError) {
      return json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    
    return json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
};

