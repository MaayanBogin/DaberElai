import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const supabase = createClient(env.PRIVATE_SUPABASE_URL, env.PRIVATE_SUPABASE_SERVICE_KEY);

export const POST: RequestHandler = async ({ request }) => {
  const audioBlob = await request.blob();

  if (!audioBlob || audioBlob.size === 0) {
    return json({ error: 'No audio file provided.' }, { status: 400 });
  }

  // Generate a unique file name
  const fileName = `voice-recording-${Date.now()}.wav`;
  const bucketName = 'voice-clips'; // Create a bucket named "voice-clips" in your Supabase project

  try {
    // Upload the file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, audioBlob, {
        contentType: 'audio/wav',
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      throw new Error(uploadError.message);
    }

    // Get the public URL for the uploaded file
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    if (!data || !data.publicUrl) {
      throw new Error('Could not retrieve public URL for the uploaded file.');
    }

    console.log('File uploaded successfully:', data.publicUrl);

    // Return the public URL
    return json({ audioUrl: data.publicUrl });

  } catch (error: any) {
    console.error('Upload handler error:', error);
    return json({ error: 'Failed to upload audio file.', details: error.message }, { status: 500 });
  }
};