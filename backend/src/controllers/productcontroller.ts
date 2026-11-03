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

export async function getProductImages(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const images = await Product.getProductImages(id);
        res.json(images);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export async function getProductSpecifications(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const specs = await Product.getProductSpecifications(id);
        res.json(specs);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export async function getProductVariants(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const variants = await Product.getProductVariants(id);
        res.json(variants);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export async function getRelatedProducts(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        let category = String(req.query.category || '');
        if (!category) {
            const currentProd = await Product.getProductById(id);
            if (currentProd && currentProd.category) {
                category = currentProd.category;
            }
        }
        const related = await Product.getRelatedProducts(id, category);
        res.json(related);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export async function createProduct(req: Request, res: Response) {
    try {
        const { name, price, category, image_url } = req.body;
        if (!name || !price || !category || !image_url) {
            return res.status(400).json({ error: 'name, price, category, and image_url are required fields.' });
        }
        const created = await Product.createProduct(req.body);
        res.status(201).json(created);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export async function updateProduct(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const updated = await Product.updateProduct(id, req.body);
        if (!updated) return res.status(404).json({ error: 'Product not found or no update values provided.' });
        res.json(updated);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export async function deleteProduct(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const deleted = await Product.deleteProduct(id);
        if (!deleted) return res.status(404).json({ error: 'Product not found' });
        res.json({ message: 'Product deleted successfully', id });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}
