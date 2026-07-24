import { supabase } from '../lib/supabase.js';
import { withPrimaryProductImages } from '../utils/productImage.js';

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const publicService = {
  /**
   * Catálogo público por slug. Solo expone datos no sensibles:
   * NO incluye user_id, email ni nada privado del dueño.
   */
  async getCatalogBySlug(slug, category = null) {
    const { data: catalog, error } = await supabase
      .from('catalogs')
      .select('id, name, slug, description, whatsapp, is_active, owner:users!inner(status)')
      .eq('slug', slug)
      .eq('is_active', true)
      .eq('owner.status', 'active')
      .maybeSingle();
    if (error) throw httpError(500, error.message);
    if (!catalog) throw httpError(404, 'Catálogo no encontrado');

    let productsQuery = supabase
      .from('products')
      .select('id, name, description, price, stock, image_url, images, category_id, position')
      .eq('catalog_id', catalog.id)
      .eq('is_visible', true);

    if (category && UUID_RE.test(category)) {
      productsQuery = productsQuery.eq('category_id', category);
    }

    const { data: products, error: prodError } = await productsQuery.order('position', {
      ascending: true,
    });
    if (prodError) throw httpError(500, prodError.message);
    const visibleProducts = withPrimaryProductImages(products || []);
    const totalProducts = visibleProducts.length;

    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name, position')
      .eq('catalog_id', catalog.id)
      .order('position', { ascending: true });
    if (catError) throw httpError(500, catError.message);

    return {
      catalog: {
        name: catalog.name,
        slug: catalog.slug,
        description: catalog.description,
        whatsapp: catalog.whatsapp,
      },
      categories: categories || [],
      products: visibleProducts,
      totalProducts,
      hasProducts: totalProducts > 0,
    };
  },
};
