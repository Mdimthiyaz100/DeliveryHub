import { query } from '../database/db';

export interface CartItemRow {
    id: number;
    cart_id: number;
    product_id: number;
    variant_id: number | null;
    quantity: number;
    created_at: string;
    updated_at: string;
    // Product details joined from products table
    name?: string;
    price?: number | string;
    image_url?: string;
    category?: string;
    description?: string;
    stock?: number;
}

let tablesChecked = false;

export async function ensureCartTablesExist() {
    if (tablesChecked) return;
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS carts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_user_cart (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS cart_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                cart_id INT NOT NULL,
                product_id INT NOT NULL,
                variant_id INT NULL,
                quantity INT NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_cart_item (cart_id, product_id, variant_id),
                CONSTRAINT fk_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        tablesChecked = true;
    } catch (err: any) {
        console.error('Warning: ensureCartTablesExist:', err.message);
        // Continue gracefully even if table already exists or constraints slightly differ
        tablesChecked = true;
    }
}

export async function getOrCreateCart(userId: number | string): Promise<number> {
    await ensureCartTablesExist();
    const rows = await query<any[]>('SELECT id FROM carts WHERE user_id = ?', [userId]);
    if (rows && rows.length > 0) {
        return rows[0].id;
    }
    const result: any = await query('INSERT INTO carts (user_id) VALUES (?)', [userId]);
    return result.insertId;
}

export async function getCartItems(userId: number | string): Promise<CartItemRow[]> {
    await ensureCartTablesExist();
    const cartId = await getOrCreateCart(userId);
    const sql = `
        SELECT 
            ci.id,
            ci.cart_id,
            ci.product_id,
            ci.variant_id,
            ci.quantity,
            ci.created_at,
            ci.updated_at,
            p.name,
            p.price,
            p.image_url,
            p.category,
            p.description,
            COALESCE(p.stock, 50) as stock
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.cart_id = ?
        ORDER BY ci.created_at ASC
    `;
    return await query<CartItemRow[]>(sql, [cartId]);
}

export async function addOrUpdateItem(
    userId: number | string,
    productId: number | string,
    quantity: number = 1,
    variantId: number | null = null
) {
    await ensureCartTablesExist();
    const cartId = await getOrCreateCart(userId);

    // Validate product existence & current stock
    const prodRows = await query<any[]>('SELECT id, price, name, COALESCE(stock, 50) as stock FROM products WHERE id = ?', [productId]);
    if (!prodRows || prodRows.length === 0) {
        throw new Error('Product not found');
    }
    const product = prodRows[0];
    const maxStock = Number(product.stock) || 50;

    // Check if item already exists in this cart
    const existing = await query<any[]>(
        'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ? AND (variant_id = ? OR (variant_id IS NULL AND ? IS NULL))',
        [cartId, productId, variantId, variantId]
    );

    let finalQty = quantity;
    if (existing && existing.length > 0) {
        finalQty = existing[0].quantity + quantity;
        if (finalQty > maxStock) finalQty = maxStock;
        await query(
            'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [finalQty, existing[0].id]
        );
    } else {
        if (finalQty > maxStock) finalQty = maxStock;
        await query(
            'INSERT INTO cart_items (cart_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)',
            [cartId, productId, variantId, finalQty]
        );
    }

    return await getCartItems(userId);
}

export async function setItemQuantity(
    userId: number | string,
    productId: number | string,
    quantity: number,
    variantId: number | null = null
) {
    await ensureCartTablesExist();
    const cartId = await getOrCreateCart(userId);

    if (quantity <= 0) {
        return await removeItem(userId, productId, variantId);
    }

    // Validate stock
    const prodRows = await query<any[]>('SELECT id, COALESCE(stock, 50) as stock FROM products WHERE id = ?', [productId]);
    const maxStock = prodRows[0]?.stock ? Number(prodRows[0].stock) : 50;
    const validatedQty = Math.min(quantity, maxStock);

    await query(
        `UPDATE cart_items 
         SET quantity = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE cart_id = ? AND product_id = ? AND (variant_id = ? OR (variant_id IS NULL AND ? IS NULL))`,
        [validatedQty, cartId, productId, variantId, variantId]
    );

    return await getCartItems(userId);
}

export async function removeItem(
    userId: number | string,
    productId: number | string,
    variantId: number | null = null
) {
    await ensureCartTablesExist();
    const cartId = await getOrCreateCart(userId);

    await query(
        `DELETE FROM cart_items 
         WHERE cart_id = ? AND product_id = ? AND (variant_id = ? OR (variant_id IS NULL AND ? IS NULL))`,
        [cartId, productId, variantId, variantId]
    );

    return await getCartItems(userId);
}

export async function clearCart(userId: number | string) {
    await ensureCartTablesExist();
    const cartId = await getOrCreateCart(userId);
    await query('DELETE FROM cart_items WHERE cart_id = ?', [cartId]);
    return [];
}

export async function mergeGuestCart(userId: number | string, guestItems: { productId: number; quantity: number; variantId?: number | null }[]) {
    await ensureCartTablesExist();
    if (!Array.isArray(guestItems) || guestItems.length === 0) {
        return await getCartItems(userId);
    }

    for (const item of guestItems) {
        if (item.productId && item.quantity > 0) {
            try {
                await addOrUpdateItem(userId, item.productId, item.quantity, item.variantId || null);
            } catch (err: any) {
                console.warn(`Could not merge item ${item.productId}:`, err.message);
            }
        }
    }

    return await getCartItems(userId);
}

