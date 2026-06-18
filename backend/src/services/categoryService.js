import { supabase } from '../lib/supabase.js';
import { catalogService } from './catalogService.js';

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export const categoryService = {
  async listByCatalog(userId, catalogId) {
    await catalogService.assertOwnership(userId, catalogId);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('catalog_id', catalogId)
      .order('position', { ascending: true });
    if (error) throw httpError(500, error.message);
    return data;
  },

  async create(userId, { catalog_id, name, position }) {
    await catalogService.assertOwnership(userId, catalog_id);
    const { data, error } = await supabase
      .from('categories')
      .insert({ catalog_id, name, position })
      .select('*')
      .single();
    if (error) throw httpError(400, error.message);
    return data;
  },

  /** Verifica propiedad de la categoría vía su catálogo. */
  async getOwned(userId, categoryId) {
    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .maybeSingle();
    if (error) throw httpError(500, error.message);
    if (!category) throw httpError(404, 'Categoría no encontrada');
    await catalogService.assertOwnership(userId, category.catalog_id);
    return category;
  },

  async update(userId, categoryId, data) {
    await this.getOwned(userId, categoryId);
    const { data: updated, error } = await supabase
      .from('categories')
      .update(data)
      .eq('id', categoryId)
      .select('*')
      .single();
    if (error) throw httpError(400, error.message);
    return updated;
  },

  async remove(userId, categoryId) {
    await this.getOwned(userId, categoryId);
    const { error } = await supabase.from('categories').delete().eq('id', categoryId);
    if (error) throw httpError(400, error.message);
    return true;
  },
};
