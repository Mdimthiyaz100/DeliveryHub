const { query } = require('../database/db');

async function getAllProducts() {
    return await query('SELECT * FROM products ORDER BY id ASC');
}

async function getProductById(id) {
    const rows = await query('SELECT * FROM products WHERE id = ?', [id]);
    return rows[0];
}

module.exports = { getAllProducts, getProductById };
