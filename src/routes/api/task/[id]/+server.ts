// src/routes/api/task/[id]/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ params }) => {
    const { id } = params;
    
    if (!id) {
        return json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Use your actual task status endpoint URL
    const url = `https://api.beam.cloud/v2/task/${id}`;
    console.log(`Received /api/task/${id} request`);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${env.PRIVATE_BEAM_API_KEY}`,
                'Content-Type': 'application/json',
                'Connection': 'keep-alive'
            }
        });

        console.log('TTS API Task Status Response Status:', response.status);

        const responseText = await response.text();
        console.log('TTS API Task Status Response Text:', responseText);

        if (!response.ok) {
            console.error('TTS API Error:', responseText);
            return json({ error: `TTS API Error: ${responseText}` }, { status: response.status });
        }

        const data = JSON.parse(responseText);
        console.log(`TTS API Task Status Data for ${id}:`, data);
        
        return json(data);
    } catch (error) {
        console.error(`Error in /api/task/${id}:`, error);
        return json({ error: 'Internal Server Error' }, { status: 500 });
    }
};