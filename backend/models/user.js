const { query } = require('../database/db');

async function getAllUsers() {
    const sql = `
        SELECT u.id, u.name, u.email, u.role, u.created_at, COUNT(o.id) as total_orders
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        GROUP BY u.id, u.name, u.email, u.role, u.created_at
        ORDER BY u.id ASC
    `;
    return await query(sql);
}

async function getUserById(id) {
    const rows = await query('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [id]);
    return rows[0];
}

async function getUserByEmail(email) {
    const rows = await query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
}

async function createUser(name, email, password, role = 'user') {
    const result = await query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, password, role]
    );
    return result.insertId;
}

async function checkPassword(plain, stored) {
    return plain === stored;
}

module.exports = {
    getAllUsers, getUserById, getUserByEmail,
    createUser, checkPassword
};