import { Router } from 'express';
import { catalogController } from '../controllers/catalogController.js';
import { verifyJWT } from '../middleware/verifyJWT.js';

const router = Router();

router.use(verifyJWT);

router.get('/me', catalogController.getMine);
router.post('/', catalogController.create);
router.put('/:id', catalogController.update);

export default router;
