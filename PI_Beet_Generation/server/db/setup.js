const fs = require('node:fs');
const path = require('node:path');
const products = require('./products.json');

async function setupDatabase(pool, { updateCatalog = false } = {}) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock(420180)');
        await client.query(fs.readFileSync(path.join(__dirname, '001_initial.sql'), 'utf8'));
        const initialSeed = await client.query(`INSERT INTO catalog_seed_state (id)
            VALUES ('initial-products') ON CONFLICT (id) DO NOTHING RETURNING id`);
        if (initialSeed.rowCount === 0) {
            await client.query(`INSERT INTO catalog_seed_state (id)
                SELECT 'product:' || id::text FROM products ON CONFLICT (id) DO NOTHING`);
        }
        const onConflict = updateCatalog
            ? `DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, price = EXCLUDED.price,
                image_url = EXCLUDED.image_url, styles = EXCLUDED.styles, active = true`
            : 'DO NOTHING';
        for (const product of products) {
            const seedState = await client.query(`INSERT INTO catalog_seed_state (id)
                VALUES ($1) ON CONFLICT (id) DO NOTHING RETURNING id`, [`product:${product.id}`]);
            if (updateCatalog || seedState.rowCount > 0) {
                await client.query(`INSERT INTO products (id, name, description, price, image_url, styles)
                    VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) ${onConflict}`,
                [product.id, product.productName, product.description, product.price, product.img, product.styles]);
            }
        }
        await client.query("SELECT setval(pg_get_serial_sequence('products','id'), GREATEST((SELECT COALESCE(MAX(id),1) FROM products), (SELECT last_value FROM products_id_seq)))");
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

module.exports = { setupDatabase };
