import { Request, Response } from 'express';
import * as Product from '../models/product';

export async function getProducts(_req: Request, res: Response) {
    try {
        const products = await Product.getAllProducts();
        res.json(products);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export async function getProduct(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const product = await Product.getProductById(id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}
