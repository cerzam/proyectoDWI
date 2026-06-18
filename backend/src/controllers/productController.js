import { productService } from '../services/productService.js';
import { validateCreateProduct, validateUpdateProduct } from '../validators/product.js';

export const productController = {
  async list(req, res, next) {
    try {
      const { catalog_id } = req.query;
      if (!catalog_id) return res.status(400).json({ error: 'catalog_id es requerido' });
      const products = await productService.listByCatalog(req.user.id, catalog_id);
      return res.status(200).json(products);
    } catch (err) {
      return next(err);
    }
  },

  async getOne(req, res, next) {
    try {
      const product = await productService.getOwned(req.user.id, req.params.id);
      return res.status(200).json({ product });
    } catch (err) {
      return next(err);
    }
  },

  async create(req, res, next) {
    try {
      const { valid, errors, data } = validateCreateProduct(req.body || {});
      if (!valid) return res.status(400).json({ error: errors.join('. ') });
      const product = await productService.create(req.user.id, data);
      return res.status(201).json({ product });
    } catch (err) {
      return next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { valid, errors, data } = validateUpdateProduct(req.body || {});
      if (!valid) return res.status(400).json({ error: errors.join('. ') });
      const product = await productService.update(req.user.id, req.params.id, data);
      return res.status(200).json({ product });
    } catch (err) {
      return next(err);
    }
  },

  async remove(req, res, next) {
    try {
      await productService.remove(req.user.id, req.params.id);
      return res.status(204).send();
    } catch (err) {
      return next(err);
    }
  },
};
