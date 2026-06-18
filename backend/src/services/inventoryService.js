import { supabase } from '../lib/supabase.js';
import { productService } from './productService.js';

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export const inventoryService = {
  /**
   * Crea un movimiento de inventario. Flujo obligatorio:
   *  1. Verificar que el producto pertenece al usuario (403 si no).
   *  2. Obtener stock actual.
   *  3. Si stock_actual + quantity < 0 → 400 stock insuficiente.
   *  4. INSERT en inventory_movements con user_id del dueño (trigger ajusta stock).
   *  5. Devolver { movement, new_stock }.
   */
  async createMovement(userId, { product_id, quantity, reason, notes }) {
    const product = await productService.getOwned(userId, product_id); // 403/404 si no es suyo

    const currentStock = product.stock ?? 0;
    if (currentStock + quantity < 0) {
      throw httpError(400, `Stock insuficiente. Stock actual: ${currentStock}`);
    }

    const { data: movement, error } = await supabase
      .from('inventory_movements')
      .insert({ product_id, user_id: userId, quantity, reason, notes })
      .select('*')
      .single();
    if (error) {
      // Capturar también el CHECK de PostgreSQL (stock >= 0) como 400 controlado
      if (error.code === '23514') {
        throw httpError(400, `Stock insuficiente. Stock actual: ${currentStock}`);
      }
      throw httpError(400, error.message);
    }

    const { data: refreshed } = await supabase
      .from('products')
      .select('stock')
      .eq('id', product_id)
      .single();

    return { movement, new_stock: refreshed ? refreshed.stock : currentStock + quantity };
  },

  /** Historial de movimientos de un producto del usuario. */
  async listByProduct(userId, productId) {
    await productService.getOwned(userId, productId); // verifica propiedad
    const { data, error } = await supabase
      .from('inventory_movements')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    if (error) throw httpError(500, error.message);
    return data;
  },
};
