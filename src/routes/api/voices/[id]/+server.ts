// src/routes/api/voices/[id]/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

// Initialize Supabase client
const supabase = createClient(
    process.env.PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY! // Use service role key for admin operations
);

export const DELETE: RequestHandler = async ({ params, locals }) => {
    const session = await locals.auth();
    const voiceId = params.id;

    if (!session?.user?.id) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!voiceId) {
        return json({ error: 'Voice ID is required' }, { status: 400 });
    }

    try {
        // First, find the voice to ensure it exists and belongs to the user
        const voice = await prisma.customVoice.findFirst({
            where: {
                id: voiceId,
                userId: session.user.id,
            },
        });

        if (!voice) {
            return json({ error: 'Voice not found or access denied' }, { status: 404 });
        }

        // Extract the file path from the URL
        // Assuming your URLs are like: https://your-project.supabase.co/storage/v1/object/public/voice-clips/filename.wav
        const urlParts = voice.url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const bucketName = 'voice-clips'; // Adjust this to match your bucket name

        // Delete the file from Supabase Storage
        const { error: storageError } = await supabase.storage
            .from(bucketName)
            .remove([fileName]);

        if (storageError) {
            console.error('Error deleting file from Supabase storage:', storageError);
            // You might want to continue with database deletion even if file deletion fails
            // or you could return an error here - depends on your preference
        }

        // Delete the voice record from the database
        await prisma.customVoice.delete({
            where: {
                id: voiceId,
            },
        });

        return json({ success: true, message: 'Voice deleted successfully' });

    } catch (error) {
        console.error('Error deleting voice:', error);
        return json({ error: 'Failed to delete voice' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
};