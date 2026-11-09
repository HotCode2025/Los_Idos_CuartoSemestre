require('../config');
const { Pool } = require('pg');

const pool = new Pool({
    // Acepta DATABASE_URL o las variables estándar PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE.
    connectionString: process.env.DATABASE_URL || undefined,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 5000,
    max: 5,
});
if (process.env.VERCEL) require('@vercel/functions').attachDatabasePool(pool);
pool.on('error', (error) => console.error('Conexion PostgreSQL interrumpida:', error.code));

const productColumns = `id, name AS "productName", description,
    price::float8 AS price, image_url AS img, styles, category, department, subcategory, 1 AS quanty`;

async function getProducts() {
    return (await pool.query(`SELECT ${productColumns} FROM products WHERE active ORDER BY id`)).rows;
}

async function getProductsByIds(ids) {
    return (await pool.query(`SELECT ${productColumns} FROM products WHERE active AND id = ANY($1::int[])`, [ids])).rows;
}

module.exports = { pool, getProducts, getProductsByIds };
