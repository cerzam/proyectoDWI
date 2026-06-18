import { categoryService } from '../services/categoryService.js';
import { validateCreateCategory, validateUpdateCategory } from '../validators/category.js';

export const categoryController = {
  async list(req, res, next) {
    try {
      const { catalog_id } = req.query;
      if (!catalog_id) return res.status(400).json({ error: 'catalog_id es requerido' });
      const categories = await categoryService.listByCatalog(req.user.id, catalog_id);
      return res.status(200).json(categories);
    } catch (err) {
      return next(err);
    }
  },

  async create(req, res, next) {
    try {
      const { valid, errors, data } = validateCreateCategory(req.body || {});
      if (!valid) return res.status(400).json({ error: errors.join('. ') });
      const category = await categoryService.create(req.user.id, data);
      return res.status(201).json({ category });
    } catch (err) {
      return next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { valid, errors, data } = validateUpdateCategory(req.body || {});
      if (!valid) return res.status(400).json({ error: errors.join('. ') });
      const category = await categoryService.update(req.user.id, req.params.id, data);
      return res.status(200).json({ category });
    } catch (err) {
      return next(err);
    }
  },

  async remove(req, res, next) {
    try {
      await categoryService.remove(req.user.id, req.params.id);
      return res.status(204).send();
    } catch (err) {
      return next(err);
    }
  },
};
