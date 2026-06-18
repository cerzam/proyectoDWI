import { supabase } from '../lib/supabase.js';

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export const catalogService = {
  /** Catálogo del usuario autenticado + sus categorías. */
  async getMine(userId) {
    const { data: catalog, error } = await supabase
      .from('catalogs')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw httpError(500, error.message);
    if (!catalog) return null;

    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('catalog_id', catalog.id)
      .order('position', { ascending: true });
    if (catError) throw httpError(500, catError.message);

    return { ...catalog, categories: categories || [] };
  },

  async create(userId, { name, slug, description, whatsapp }) {
    // Evitar slugs duplicados con un mensaje claro
    const { data: existing } = await supabase
      .from('catalogs')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (existing) throw httpError(409, 'El slug ya está en uso, elige otro');

    const { data, error } = await supabase
      .from('catalogs')
      .insert({ user_id: userId, name, slug, description: description ?? null, whatsapp: whatsapp ?? null })
      .select('*')
      .single();
    if (error) {
      if (error.code === '23505') throw httpError(409, 'El slug ya está en uso, elige otro');
      throw httpError(400, error.message);
    }
    return data;
  },

  async update(userId, id, payload) {
    // Verificar propiedad
    const { data: catalog, error: findError } = await supabase
      .from('catalogs')
      .select('id, user_id')
      .eq('id', id)
      .maybeSingle();
    if (findError) throw httpError(500, findError.message);
    if (!catalog) throw httpError(404, 'Catálogo no encontrado');
    if (catalog.user_id !== userId) throw httpError(403, 'No tienes permiso sobre este catálogo');

    const allowed = {};
    for (const key of ['name', 'slug', 'description', 'whatsapp', 'is_active']) {
      if (payload[key] !== undefined) allowed[key] = payload[key];
    }
    allowed.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('catalogs')
      .update(allowed)
      .eq('id', id)
      .select('*')
      .single();
    if (error) {
      if (error.code === '23505') throw httpError(409, 'El slug ya está en uso, elige otro');
      throw httpError(400, error.message);
    }
    return data;
  },

  /** Helper reutilizable: ¿el catálogo pertenece al usuario? */
  async assertOwnership(userId, catalogId) {
    const { data, error } = await supabase
      .from('catalogs')
      .select('id, user_id')
      .eq('id', catalogId)
      .maybeSingle();
    if (error) throw httpError(500, error.message);
    if (!data) throw httpError(404, 'Catálogo no encontrado');
    if (data.user_id !== userId) throw httpError(403, 'No tienes permiso sobre este catálogo');
    return data;
  },
};
