const mysql = require('mysql2/promise');

const pool = mysql.createPool(process.env.DATABASE_URL);

async function query(sql, params) {
    const [rows] = await pool.execute(sql, params);
    return rows;
}

module.exports = { pool, query };