import { Router } from 'express';
import * as productController from '../controllers/productcontroller';

const router = Router();

router.get('/categories', productController.getCategories);
router.get('/brands', productController.getBrands);
router.get('/', productController.getProducts);
router.get('/:id', productController.getProduct);

export default router;

