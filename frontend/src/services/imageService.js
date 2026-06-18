import { supabase } from '../lib/supabaseClient.js';

const BUCKET = 'product-images';

/**
 * Sube una imagen a Supabase Storage y devuelve su URL pública.
 * Path: {catalogId}/{timestamp}-{filename}
 */
export const imageService = {
  async uploadImage(file, catalogId) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${catalogId}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) throw new Error(error.message);

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  },
};
