// src/routes/api/upload/+server.ts

import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_KEY } from '$env/static/private';
import { PrismaClient } from '@prisma/client';
import type { RequestHandler } from './$types';

const supabase = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY);
const prisma = new PrismaClient();

export const POST: RequestHandler = async ({ request, locals }) => {
    // 1. Authentication
    const session = await locals.auth();
    if (!session?.user?.id) {
        return json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }
    const userId = session.user.id;

    try {
        // 2. The request will now be FormData, not just a blob
        const formData = await request.formData();
        const audioBlob = formData.get('audio') as File | null;
        const voiceName = formData.get('voiceName') as string | null;

        if (!audioBlob || audioBlob.size === 0) {
            return json({ error: 'No audio file provided.' }, { status: 400 });
        }
        if (!voiceName || voiceName.trim() === '') {
            return json({ error: 'Voice name is required.' }, { status: 400 });
        }

        // 3. Check user's plan and current voice count
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { voices: true }, // Include the custom voices to count them
        });

        if (!user) {
            return json({ error: 'User not found.' }, { status: 404 });
        }

        const voiceCount = user.voices.length;
        const plan = user.plan || 'Free';
        
        // Enforce limits
        if (plan === 'Pro' && voiceCount >= 3) {
            return json({ error: 'Pro plan limit reached (3 voices). Please manage your existing voices.' }, { status: 403 });
        }
        if (plan !== 'Pro' && voiceCount >= 1) {
            return json({ error: 'Basic plan limit reached (1 voice). Upgrade to Pro for more voices.' }, { status: 403 });
        }

        // 4. Define the structured file path
        const bucketName = 'voice-clips';
        const filePath = `${userId}/${voiceName}.wav`;

        // 5. Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, audioBlob, {
                contentType: 'audio/wav',
                upsert: true, // true allows overwriting if they re-record a voice with the same name
            });

        if (uploadError) {
            console.error('Supabase upload error:', uploadError);
            throw new Error(uploadError.message);
        }

        // 6. Get public URL
        const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);

        if (!urlData || !urlData.publicUrl) {
            throw new Error('Could not retrieve public URL for the uploaded file.');
        }
        const publicUrl = urlData.publicUrl;

        // 7. Save to our database
        const newVoice = await prisma.customVoice.create({
            data: {
                name: voiceName,
                url: publicUrl,
                userId: userId,
            },
        });

        console.log(`User ${userId} saved new voice "${voiceName}"`);
        return json(newVoice, { status: 201 }); // Return the newly created voice object

    } catch (error: any) {
        console.error('Upload handler error:', error);
        // Handle potential unique constraint violation (user trying to save a voice with a name that already exists)
        if (error.code === 'P2002') {
             return json({ error: 'A voice with this name already exists. Please choose a different name.' }, { status: 409 });
        }
        return json({ error: 'Failed to upload audio file.', details: error.message }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
};