// src/routes/api/tts/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Retrieve the user's session
    const session = await locals.auth();

    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if the user has enough tokens
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tokens: true, plan: true },
    });

    if (!user) {
      return json({ error: 'User not found' }, { status: 404 });
    }

    if (user.tokens! < 1) {
      return json({ 
        error: 'Insufficient tokens. Please upgrade your plan to continue using the service.',
        remainingTokens: 0
      }, { status: 403 });
    }

    // Parse request data
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

    // Deduct 1 token atomically BEFORE making the API call
    await prisma.user.update({
      where: { id: userId },
      data: { tokens: { decrement: 1 } },
    });

    console.log(`Deducted 1 token from user ${userId}. Remaining tokens: ${user.tokens! - 1}`);

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
      
      // If the TTS API fails, refund the token
      await prisma.user.update({
        where: { id: userId },
        data: { tokens: { increment: 1 } },
      });
      
      console.log(`Refunded 1 token to user ${userId} due to TTS API failure`);
      
      return json(
        { error: `TTS service error: ${response.statusText}` }, 
        { status: response.status }
      );
    }

    const result: TTSResponse = await response.json();
    
    console.log('TTS API Response:', result);

    // Get updated token count to return to client
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { tokens: true },
    });

    return json({
      ...result,
      remainingTokens: updatedUser?.tokens || 0
    });

  } catch (error) {
    console.error('TTS API Error:', error);
    
    if (error instanceof SyntaxError) {
      return json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    
    return json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
};
