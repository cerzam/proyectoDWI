import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { verifyJWT } from '../middleware/verifyJWT.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', verifyJWT, authController.logout);

export default router;
