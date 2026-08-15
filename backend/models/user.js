const { query } = require('../database/db');

async function getAllUsers() {
    return await query('SELECT id, name, email, role, created_at FROM users');
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