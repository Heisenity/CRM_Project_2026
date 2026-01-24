import { Router } from 'express';
import { generateLabels, createProduct, getProducts } from './product.controller';

const router = Router();

// Product CRUD routes
router.post('/', createProduct);
router.get('/', getProducts);

// Label generation route
router.post('/:productId/generate-labels', generateLabels);

export default router;