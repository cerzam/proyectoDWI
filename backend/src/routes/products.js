import { Router } from 'express';
import { productController } from '../controllers/productController.js';
import { verifyJWT } from '../middleware/verifyJWT.js';

const router = Router();

router.use(verifyJWT);

router.get('/', productController.list);
router.get('/:id', productController.getOne);
router.post('/', productController.create);
router.put('/:id', productController.update);
router.delete('/:id', productController.remove);

export default router;
