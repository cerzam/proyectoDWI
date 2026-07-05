import { Router } from 'express';
import { publicController } from '../controllers/publicController.js';

const router = Router();

// Sin JWT: endpoint público para el catálogo (?category=uuid opcional)
router.get('/catalogs/:slug', publicController.getCatalogBySlug);

export default router;
