// src/routes/api/voices/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const GET: RequestHandler = async ({ locals }) => {
    const session = await locals.auth();

    if (!session?.user?.id) {
        // Return an empty array if not logged in, or you could return a 401
        return json([], { status: 200 }); 
    }

    try {
        const customVoices = await prisma.customVoice.findMany({
            where: {
                userId: session.user.id,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
        return json(customVoices);
    } catch (error) {
        console.error("Failed to fetch custom voices:", error);
        return json({ error: "Could not fetch voices." }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
};