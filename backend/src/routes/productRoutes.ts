import { Router } from 'express';
import * as productController from '../controllers/productcontroller';

const router = Router();

router.get('/categories', productController.getCategories);
router.get('/brands', productController.getBrands);
router.get('/related/:id', productController.getRelatedProducts);
router.get('/', productController.getProducts);
router.post('/', productController.createProduct);
router.get('/:id', productController.getProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);
router.get('/:id/images', productController.getProductImages);
router.get('/:id/specifications', productController.getProductSpecifications);
router.get('/:id/variants', productController.getProductVariants);
router.get('/:id/related', productController.getRelatedProducts);

export default router;

