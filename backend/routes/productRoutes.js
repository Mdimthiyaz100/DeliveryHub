const express = require('express');
const router = express.Router();
const productController = require('../controllers/productcontroller');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, productController.getProducts);
router.get('/:id', verifyToken, productController.getProduct);

module.exports = router;
