import { Router } from 'express';
import { inventoryController } from '../controllers/inventoryController.js';
import { verifyJWT } from '../middleware/verifyJWT.js';

const router = Router();

router.use(verifyJWT);

router.post('/', inventoryController.create);
router.get('/:product_id', inventoryController.listByProduct);

export default router;
