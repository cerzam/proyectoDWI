import { Router } from 'express';
import { categoryController } from '../controllers/categoryController.js';
import { verifyJWT } from '../middleware/verifyJWT.js';

const router = Router();

router.use(verifyJWT);

router.get('/', categoryController.list);
router.post('/', categoryController.create);
router.put('/:id', categoryController.update);
router.delete('/:id', categoryController.remove);

export default router;
