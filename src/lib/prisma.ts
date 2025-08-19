import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// ============================================================================
// 4. Supabase Client (src/lib/supabaseClient.ts)
// ============================================================================
import { createClient } from '@supabase/supabase-js';
import { PRIVATE_SUPABASE_URL, PRIVATE_SUPABASE_ANON_KEY } from '$env/static/private';

export const supabase = createClient(PRIVATE_SUPABASE_URL, PRIVATE_SUPABASE_ANON_KEY);