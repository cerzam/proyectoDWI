import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { verifyJWT } from '../middleware/verifyJWT.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

router.use(verifyJWT, requireAdmin);

router.get('/users', adminController.listUsers);
router.patch('/users/:id/plan', adminController.changePlan);
router.patch('/users/:id/status', adminController.changeStatus);
router.delete('/users/:id', adminController.softDelete);

export default router;
