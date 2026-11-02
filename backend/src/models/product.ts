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
    return rows[0];
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


