import { publicService } from '../services/publicService.js';

export const publicController = {
  async getCatalogBySlug(req, res, next) {
    try {
      const data = await publicService.getCatalogBySlug(req.params.slug);
      return res.status(200).json(data);
    } catch (err) {
      return next(err);
    }
  },
};
