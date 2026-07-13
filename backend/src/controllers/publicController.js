import { publicService } from '../services/publicService.js';

export const publicController = {
  async getCatalogBySlug(req, res, next) {
    try {
      const { category } = req.query;
      if (category !== undefined && typeof category !== 'string') {
        return res.status(400).json({ error: 'category debe ser un string' });
      }

      const data = await publicService.getCatalogBySlug(req.params.slug, category?.trim() || null);
      return res.status(200).json({
        catalog: data.catalog,
        products: data.products,
        categories: data.categories,
        totalProducts: data.totalProducts,
        hasProducts: data.hasProducts,
      });
    } catch (err) {
      return next(err);
    }
  },
};