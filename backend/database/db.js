const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function query(sql, params) {
    const [rows] = await pool.execute(sql, params);
    return rows;
}

module.exports = { pool, query };