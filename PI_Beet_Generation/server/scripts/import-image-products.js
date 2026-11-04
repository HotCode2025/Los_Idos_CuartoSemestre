require('../config');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { pool } = require('../db');
const { parseProduct } = require('../admin-products');
const batch = process.argv.find(arg => arg.startsWith('--batch='))?.slice(8) || 'products-2026-11-04.json';
if (!/^products-[a-zA-Z0-9-]+\.json$/.test(batch)) throw new Error('Nombre de lote invalido.');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '../db/imports', batch), 'utf8'));
const apply = process.argv.includes('--apply');

async function run() {
    const imageRoot = path.resolve(__dirname, '../../client');
    const products = manifest.map(item => {
        const product = parseProduct(item);
        const image = path.resolve(imageRoot, '.' + product.img);
        if (!image.startsWith(imageRoot + path.sep)) throw new Error('Ruta de imagen invalida.');
        const hash = crypto.createHash('sha256').update(fs.readFileSync(image)).digest('hex');
        if (hash !== item.hash) throw new Error('La imagen no coincide con el archivo revisado.');
        return product;
    });
    const db = await pool.connect();
    const created = [];
    const skipped = [];
    try {
        await db.query('BEGIN');
        await db.query('SELECT pg_advisory_xact_lock(420180)');
        for (const p of products) {
            const existing = await db.query('SELECT id FROM products WHERE image_url=$1', [p.img]);
            if (existing.rows.length) { skipped.push({ id: existing.rows[0].id, name: p.name }); continue; }
            if (apply) {
                const { rows } = await db.query(`INSERT INTO products
                    (name,description,price,image_url,styles,active,category,department,subcategory)
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
                    [p.name,p.description,p.price,p.img,p.styles,p.active,p.category,p.department,p.subcategory]);
                created.push({ id: rows[0].id, name: p.name, price: p.price, img: p.img });
            } else created.push({ name: p.name, price: p.price, img: p.img });
        }
        await db.query(apply ? 'COMMIT' : 'ROLLBACK');
    } catch (error) {
        await db.query('ROLLBACK');
        throw error;
    } finally { db.release(); }
    console.table(created.map(({ id, name, price }) => ({ id, name, price })));
    console.log(`${created.length} productos ${apply ? 'creados en PostgreSQL' : 'por crear (vista previa)'}. ${skipped.length} ya existentes, sin modificar.`);
    if (apply && created.length) {
        const receipt = path.join(__dirname, '../db/imports', batch.replace(/\.json$/, '-result.json'));
        if (!fs.existsSync(receipt)) fs.writeFileSync(receipt, JSON.stringify({ created, skipped }, null, 2) + '\n');
    }
}
run().catch(error => {
    console.error('No se pudo importar el catalogo:', error.code || error.message);
    process.exitCode = 1;
}).finally(() => pool.end());
