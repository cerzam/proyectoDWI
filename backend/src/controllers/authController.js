import { authService } from '../services/authService.js';
import { validatePassword, buildPasswordError } from '../validators/auth.js';

export const authController = {
  async register(req, res, next) {
    try {
      const { email, password, full_name } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: 'email y password son requeridos' });
      }
      const { valid, errors } = validatePassword(password);
      if (!valid) {
        return res.status(400).json({ error: buildPasswordError(errors) });
      }
      const result = await authService.register({ email, password, full_name });
      return res.status(201).json(result);
    } catch (err) {
      return next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: 'email y password son requeridos' });
      }
      const result = await authService.login({ email, password });
      return res.status(200).json(result);
    } catch (err) {
      return next(err);
    }
  },

  async logout(req, res, next) {
    try {
      const authHeader = req.headers.authorization || '';
      const [, token] = authHeader.split(' ');
      await authService.logout(token);
      return res.status(204).send();
    } catch (err) {
      return next(err);
    }
  },
};
