const fs = require('node:fs');
const path = require('node:path');
require('../config');
// Use the direct cloud connection for administration, if provided.
if (process.env.DATABASE_URL_DIRECT) process.env.DATABASE_URL = process.env.DATABASE_URL_DIRECT;
const { pool } = require('../db');
const products = require('../db/products.json');
const updateCatalog = process.argv.includes('--update-catalog');

async function setup() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query("SELECT pg_advisory_xact_lock(420180)");
        await client.query(fs.readFileSync(path.join(__dirname, '../db/001_initial.sql'), 'utf8'));
        // Re-running setup never overwrites edited products or prices,
        // unless --update-catalog is passed to replace them with products.json.
        const onConflict = updateCatalog
            ? `DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, price = EXCLUDED.price,
                image_url = EXCLUDED.image_url, styles = EXCLUDED.styles, active = true`
            : 'DO NOTHING';
        for (const p of products) {
            await client.query(`INSERT INTO products (id, name, description, price, image_url, styles)
                VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) ${onConflict}`,
            [p.id, p.productName, p.description, p.price, p.img, p.styles]);
        }
        await client.query("SELECT setval(pg_get_serial_sequence('products','id'), GREATEST((SELECT COALESCE(MAX(id),1) FROM products), (SELECT last_value FROM products_id_seq)))");
        await client.query('COMMIT');
        console.log(updateCatalog ? 'Base lista: catalogo actualizado desde products.json.' : 'Base lista: tablas creadas y catalogo inicial cargado.');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}
setup().catch((error) => {
    console.error('No se pudo preparar PostgreSQL. Revisa la conexion y los permisos. Codigo:', error.code || error.name);
    process.exitCode = 1;
}).finally(() => pool.end());
