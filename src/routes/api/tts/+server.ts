import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

interface TTSRequest {
  prompt: string[];
  nikud: boolean;
  vc: boolean;
  ref_audio: string | null;
  ref_text: string | null;
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const requestData: TTSRequest = await request.json();
    
    // DEBUG: Log environment variables
    console.log('Environment Debug:', {
      PRIVATE_BEAM_API_KEY: env.PRIVATE_BEAM_API_KEY ? 'EXISTS' : 'MISSING',
      BEAM_API_KEY: env.BEAM_API_KEY ? 'EXISTS' : 'MISSING',
      allEnvKeys: Object.keys(env).filter(key => key.includes('BEAM') || key.includes('API')),
    });

    const {
      prompt,
      nikud,
      vc,
      ref_audio,
      ref_text,
    } = requestData;

    // Get API key - try multiple possible names
    const apiKey = env.PRIVATE_BEAM_API_KEY || env.BEAM_API_KEY || env.API_KEY;
    
    if (!apiKey) {
      console.error('No API key found. Available env vars:', Object.keys(env));
      return json({ error: 'API key not configured' }, { status: 500 });
    }

    console.log('Using API key (first 10 chars):', apiKey.substring(0, 10) + '...');

    // Validate input
    if (!prompt || !Array.isArray(prompt) || prompt.length === 0) {
      return json({ error: 'Prompt is required and must be a non-empty array' }, { status: 400 });
    }

    const payload = {
      prompt,
      nikud,
      vc,
      ref_audio,
      ref_text
    };

    const response = await fetch("https://testtts-6b3eeb5-v19.app.beam.cloud", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`TTS API Error: ${response.status} - ${errorText}`);
      
      return json(
        { 
          error: `TTS service error: ${response.status}`,
          details: errorText
        }, 
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('TTS API Success');
    return json(result);

  } catch (error) {
    console.error('TTS API Error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};