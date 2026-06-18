import { catalogService } from '../services/catalogService.js';

export const catalogController = {
  async getMine(req, res, next) {
    try {
      const catalog = await catalogService.getMine(req.user.id);
      return res.status(200).json(catalog);
    } catch (err) {
      return next(err);
    }
  },

  async create(req, res, next) {
    try {
      const { name, slug, description, whatsapp } = req.body || {};
      if (!name || !slug) {
        return res.status(400).json({ error: 'name y slug son requeridos' });
      }
      const catalog = await catalogService.create(req.user.id, { name, slug, description, whatsapp });
      return res.status(201).json({ catalog });
    } catch (err) {
      return next(err);
    }
  },

  async update(req, res, next) {
    try {
      const catalog = await catalogService.update(req.user.id, req.params.id, req.body || {});
      return res.status(200).json({ catalog });
    } catch (err) {
      return next(err);
    }
  },
};
