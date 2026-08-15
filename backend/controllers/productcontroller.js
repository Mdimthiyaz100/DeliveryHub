const Product = require('../models/product');

async function getProducts(req, res) {
    try {
        const products = await Product.getAllProducts();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getProduct(req, res) {
    try {
        const product = await Product.getProductById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { getProducts, getProduct };
