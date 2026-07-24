import { adminService } from '../services/adminService.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateTargetId(req, res) {
  if (!UUID_RE.test(req.params.id || '')) {
    res.status(400).json({ error: 'El id de usuario no es válido' });
    return false;
  }
  return true;
}

export const adminController = {
  async listUsers(_req, res, next) {
    try {
      return res.status(200).json({ users: await adminService.listUsers() });
    } catch (error) {
      return next(error);
    }
  },

  async changePlan(req, res, next) {
    try {
      if (!validateTargetId(req, res)) return undefined;
      const { plan } = req.body || {};
      if (!['free', 'pro'].includes(plan)) {
        return res.status(400).json({ error: 'plan debe ser free o pro' });
      }
      const user = await adminService.changePlan(req.account.id, req.params.id, plan);
      return res.status(200).json({ user });
    } catch (error) {
      return next(error);
    }
  },

  async changeStatus(req, res, next) {
    try {
      if (!validateTargetId(req, res)) return undefined;
      const { status, reason } = req.body || {};
      if (!['active', 'suspended'].includes(status)) {
        return res.status(400).json({ error: 'status debe ser active o suspended' });
      }
      if (reason !== undefined && typeof reason !== 'string') {
        return res.status(400).json({ error: 'reason debe ser texto' });
      }
      if (status === 'suspended' && !reason?.trim()) {
        return res.status(400).json({ error: 'reason es requerido al suspender' });
      }
      if (reason?.trim().length > 500) {
        return res.status(400).json({ error: 'reason no puede exceder 500 caracteres' });
      }

      const user = await adminService.changeStatus(
        req.account.id,
        req.params.id,
        status,
        reason?.trim()
      );
      return res.status(200).json({ user });
    } catch (error) {
      return next(error);
    }
  },

  async softDelete(req, res, next) {
    try {
      if (!validateTargetId(req, res)) return undefined;
      const user = await adminService.softDelete(req.account.id, req.params.id);
      return res.status(200).json({ user });
    } catch (error) {
      return next(error);
    }
  },
};

export default adminController;
