import { inventoryService } from '../services/inventoryService.js';
import { validateCreateMovement } from '../validators/inventory.js';

export const inventoryController = {
  async create(req, res, next) {
    try {
      const { valid, errors, data } = validateCreateMovement(req.body || {});
      if (!valid) return res.status(400).json({ error: errors.join('. ') });
      const result = await inventoryService.createMovement(req.user.id, data);
      return res.status(201).json(result);
    } catch (err) {
      return next(err);
    }
  },

  async listByProduct(req, res, next) {
    try {
      const movements = await inventoryService.listByProduct(req.user.id, req.params.product_id);
      return res.status(200).json(movements);
    } catch (err) {
      return next(err);
    }
  },
};
