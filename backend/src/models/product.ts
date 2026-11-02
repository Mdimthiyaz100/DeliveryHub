import { query } from '../database/db';

export async function getAllProducts() {
    return await query<any[]>('SELECT * FROM products ORDER BY id ASC');
}

export async function getProductById(id: number | string) {
    const rows = await query<any[]>('SELECT * FROM products WHERE id = ?', [id]);
    return rows[0];
}

