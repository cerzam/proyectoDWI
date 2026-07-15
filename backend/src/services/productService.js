import { supabase } from '../lib/supabase.js';
import { catalogService } from './catalogService.js';

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export const productService = {
  /** Lista productos de un catálogo del usuario. */
  async listByCatalog(userId, catalogId) {
    await catalogService.assertOwnership(userId, catalogId);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('catalog_id', catalogId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw httpError(500, error.message);
    return data;
  },

  /** Obtiene un producto verificando que pertenezca al usuario. */
  async getOwned(userId, productId) {
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .maybeSingle();
    if (error) throw httpError(500, error.message);
    if (!product) throw httpError(404, 'Producto no encontrado');
    await catalogService.assertOwnership(userId, product.catalog_id);
    return product;
  },

  /**
   * Crea un producto. Flujo:
   *  1. Verificar propiedad del catálogo.
   *  2. INSERT con stock = 0.
   *  3. Si stock_inicial > 0 → INSERT en inventory_movements (trigger ajusta stock).
   *  4. Devolver el producto con stock actualizado.
   */
  async create(userId, payload) {
    const { catalog_id, name, price, stock_inicial, description, category_id, images } = payload;
    await catalogService.assertOwnership(userId, catalog_id);

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        catalog_id,
        name,
        price,
        description,
        category_id,
        images, 
        stock: 0,
      })
      .select('*')
      .single();
    if (error) throw httpError(400, error.message);

    if (stock_inicial && stock_inicial > 0) {
      const { error: movError } = await supabase.from('inventory_movements').insert({
        product_id: product.id,
        user_id: userId,
        quantity: stock_inicial,
        reason: 'stock_inicial',
      });
      if (movError) throw httpError(400, movError.message);

      // Releer para devolver el stock ya actualizado por el trigger
      const { data: refreshed } = await supabase
        .from('products')
        .select('*')
        .eq('id', product.id)
        .single();
      return refreshed || product;
    }

    return product;
  },

  async update(userId, productId, data) {
    // Verifica propiedad
    await this.getOwned(userId, productId);

    const payload = { ...data, updated_at: new Date().toISOString() };
    delete payload.stock; // nunca actualizar stock directo

    const { data: updated, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', productId)
      .select('*')
      .single();
    if (error) throw httpError(400, error.message);
    return updated;
  },

  async remove(userId, productId) {
    await this.getOwned(userId, productId);
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) throw httpError(400, error.message);
    return true;
  },
};
