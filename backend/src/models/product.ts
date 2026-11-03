import { query } from '../database/db';

export interface ProductFilterOptions {
    category?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    search?: string;
    sortBy?: string;
    featured?: boolean;
    bestseller?: boolean;
    newArrival?: boolean;
    limit?: number;
    offset?: number;
}

export async function getAllProducts(options: ProductFilterOptions = {}) {
    const conditions: string[] = ['is_active = 1'];
    const params: any[] = [];

    if (options.category && options.category !== 'All') {
        conditions.push('(category = ? OR category_id = (SELECT id FROM categories WHERE name = ? OR slug = ? LIMIT 1))');
        params.push(options.category, options.category, options.category);
    }

    if (options.brand && options.brand !== 'All') {
        conditions.push('brand = ?');
        params.push(options.brand);
    }

    if (options.minPrice !== undefined && !isNaN(options.minPrice)) {
        conditions.push('price >= ?');
        params.push(options.minPrice);
    }

    if (options.maxPrice !== undefined && !isNaN(options.maxPrice)) {
        conditions.push('price <= ?');
        params.push(options.maxPrice);
    }

    if (options.rating !== undefined && !isNaN(options.rating)) {
        conditions.push('rating >= ?');
        params.push(options.rating);
    }

    if (options.search && options.search.trim()) {
        const term = `%${options.search.trim()}%`;
        conditions.push('(name LIKE ? OR description LIKE ? OR brand LIKE ? OR category LIKE ?)');
        params.push(term, term, term, term);
    }

    if (options.featured) {
        conditions.push('is_featured = 1');
    }

    if (options.bestseller) {
        conditions.push('is_bestseller = 1');
    }

    if (options.newArrival) {
        conditions.push('is_new_arrival = 1');
    }

    let orderBy = 'id DESC';
    switch (options.sortBy) {
        case 'price-low':
            orderBy = 'price ASC';
            break;
        case 'price-high':
            orderBy = 'price DESC';
            break;
        case 'rating':
            orderBy = 'rating DESC, review_count DESC';
            break;
        case 'newest':
            orderBy = 'created_at DESC, id DESC';
            break;
        case 'popularity':
        default:
            orderBy = 'is_featured DESC, is_bestseller DESC, rating DESC, id DESC';
            break;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM products ${whereClause} ORDER BY ${orderBy}`;

    return await query<any[]>(sql, params);
}

export async function getProductById(id: number | string) {
    const rows = await query<any[]>('SELECT * FROM products WHERE id = ? OR slug = ?', [id, id]);
    if (!rows[0]) return null;
    const product = rows[0];

    // Fetch product images
    const images = await getProductImages(product.id);
    // Fetch product specifications
    const specifications = await getProductSpecifications(product.id);
    // Fetch product variants
    const variants = await getProductVariants(product.id);

    return {
        ...product,
        images,
        specifications,
        variants
    };
}

export async function getProductImages(productId: number | string) {
    return await query<any[]>(
        'SELECT id, product_id, image_url, is_primary, display_order, color_name FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, display_order ASC, id ASC',
        [productId]
    );
}

export async function getProductSpecifications(productId: number | string) {
    return await query<any[]>(
        'SELECT id, product_id, specification_name, specification_value, display_order FROM product_specifications WHERE product_id = ? ORDER BY display_order ASC, id ASC',
        [productId]
    );
}

export async function getProductVariants(productId: number | string) {
    return await query<any[]>(
        'SELECT id, product_id, variant_name, color_code, color_name, sku, price, stock, image_url FROM product_variants WHERE product_id = ? ORDER BY id ASC',
        [productId]
    );
}

export async function getRelatedProducts(productId: number | string, category: string, limit = 4) {
    const safeLimit = Math.max(1, Math.min(20, Number(limit) || 4));
    return await query<any[]>(
        `SELECT * FROM products 
         WHERE id != ? 
           AND (category = ? OR category_id = (SELECT id FROM categories WHERE name = ? OR slug = ? LIMIT 1)) 
           AND is_active = 1 
         ORDER BY rating DESC, is_featured DESC 
         LIMIT ${safeLimit}`,
        [productId, category, category, category]
    );
}

export async function getCategories() {
    return await query<any[]>('SELECT * FROM categories WHERE is_active = 1 ORDER BY display_order ASC, name ASC');
}

export async function getBrands() {
    const rows = await query<any[]>(`
        SELECT brand, COUNT(*) as count 
        FROM products 
        WHERE is_active = 1 AND brand IS NOT NULL AND brand != ''
        GROUP BY brand 
        ORDER BY count DESC, brand ASC
    `);
    return rows;
}

export async function createProduct(data: {
    name: string;
    description: string;
    price: number;
    image_url: string;
    category: string;
    stock?: number;
    brand?: string;
    sku?: string;
}) {
    const sql = `
        INSERT INTO products (name, description, price, image_url, category, stock, brand, sku, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `;
    const result = await query<any>(sql, [
        data.name,
        data.description || '',
        data.price,
        data.image_url,
        data.category,
        data.stock ?? 10,
        data.brand || null,
        data.sku || null
    ]);
    return { id: result.insertId, ...data };
}

export async function updateProduct(id: number | string, data: Partial<{
    name: string;
    description: string;
    price: number;
    image_url: string;
    category: string;
    stock: number;
    brand: string;
    sku: string;
    is_active: number;
}>) {
    const fields: string[] = [];
    const values: any[] = [];

    for (const [key, val] of Object.entries(data)) {
        if (val !== undefined) {
            fields.push(`${key} = ?`);
            values.push(val);
        }
    }

    if (fields.length === 0) return null;

    values.push(id);
    await query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
    return await getProductById(id);
}

export async function deleteProduct(id: number | string) {
    // Cascades delete related images, specs, variants
    const result = await query<any>('DELETE FROM products WHERE id = ?', [id]);
    return result.affectedRows > 0;
}



