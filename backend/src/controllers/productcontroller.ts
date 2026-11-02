import { Request, Response } from 'express';
import * as Product from '../models/product';

export async function getProducts(req: Request, res: Response) {
    try {
        const {
            category,
            brand,
            minPrice,
            maxPrice,
            rating,
            search,
            sortBy,
            featured,
            bestseller,
            newArrival
        } = req.query;

        const products = await Product.getAllProducts({
            category: category ? String(category) : undefined,
            brand: brand ? String(brand) : undefined,
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
            rating: rating ? Number(rating) : undefined,
            search: search ? String(search) : undefined,
            sortBy: sortBy ? String(sortBy) : undefined,
            featured: featured === 'true' || featured === '1',
            bestseller: bestseller === 'true' || bestseller === '1',
            newArrival: newArrival === 'true' || newArrival === '1'
        });

        res.json(products);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export async function getCategories(_req: Request, res: Response) {
    try {
        const categories = await Product.getCategories();
        res.json(categories);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export async function getBrands(_req: Request, res: Response) {
    try {
        const brands = await Product.getBrands();
        res.json(brands);
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
