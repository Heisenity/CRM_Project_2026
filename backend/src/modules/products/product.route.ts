import { Router } from 'express';
import { generateLabels, createProduct, getProducts, getProduct, updateProduct, deleteProduct, getBarcodeHistory, getBarcodePrefixes, addBarcodePrefix } from './product.controller';

const router = Router();

// Product CRUD routes
router.post('/', createProduct);
router.get('/', getProducts);
router.get('/:id', getProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

// Barcode prefix management routes
router.get('/barcode-prefixes/list', getBarcodePrefixes);
router.post('/barcode-prefixes/add', addBarcodePrefix);

// Barcode history route
router.get('/:productId/barcode-history', getBarcodeHistory);

// Label generation route
router.post('/:productId/generate-labels', generateLabels);

export default router;