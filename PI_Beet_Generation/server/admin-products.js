const express = require('express');
const taxonomy = require('../client/js/catalog-taxonomy');
const columns = 'id, name, description, price::float8 AS price, image_url AS img, styles, active, category, department, subcategory';
const stylesAllowed = new Set(['Y2K', 'STREET', 'RETRO', 'OVERSIZE']);
function parseProduct(body) {
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const description = typeof body?.description === 'string' ? body.description.trim() : '';
    const img = typeof body?.img === 'string' ? body.img.trim() : '';
    const price = body?.price;
    const department = body?.department === undefined ? 'sin-clasificar' : body.department;
    const subcategory = body?.subcategory === undefined ? '' : body.subcategory;
    if (typeof department !== 'string' || (department !== 'sin-clasificar' && !Object.hasOwn(taxonomy, department))) throw new Error('Selecciona una familia de productos valida.');
    if (typeof subcategory !== 'string' || (subcategory && !Object.hasOwn(taxonomy[department]?.items || {}, subcategory))) throw new Error('La subcategoria no pertenece a esa familia de productos.');
    const category = body?.category === undefined ? 'sin-categoria' : body.category;
    if (!['mujer', 'hombre', 'unisex', 'sin-categoria'].includes(category)) throw new Error('Selecciona una categoria valida.');
    if (!name || name.length > 150) throw new Error('El nombre debe tener entre 1 y 150 caracteres.');
    if (description.length > 5000) throw new Error('La descripcion no puede superar 5000 caracteres.');
    if (typeof price !== 'number' || !Number.isFinite(price) || price < 0.01 || price > 9999999999.99 ||
        Math.abs(price * 100 - Math.round(price * 100)) > 0.0001) throw new Error('Ingresa un precio positivo con hasta dos decimales.');
    let validImage = /^\/assets\/images\/products\/[a-zA-Z0-9_%. -]+\.(png|jpe?g|webp|gif|avif)$/i.test(img);
    try { const url = new URL(img); validImage = url.protocol === 'https:' && !url.username && !url.password; } catch {}
    if (!validImage || img.length > 2000) throw new Error('Usa una imagen HTTPS o una ruta /assets/images/products/archivo.png.');
    if (!Array.isArray(body.styles) || body.styles.length > 4 || body.styles.some(s => !stylesAllowed.has(s))) throw new Error('Los estilos seleccionados no son validos.');
    if (typeof body.active !== 'boolean') throw new Error('Indica si el producto esta activo.');
    return { name, description, img, price, category, department, subcategory, styles: [...new Set(body.styles)], active: body.active };
}
function createProductAdminRouter(pool) {
    const router = express.Router();
    router.param('id', (req, res, next, value) => {
        const id = Number(value);
        if (!Number.isInteger(id) || id < 1 || id > 2147483647) return res.status(400).json({ error: 'Identificador de producto invalido.' });
        req.productId = id;
        next();
    });
    router.get('/', async (req, res) => {
        try { res.json({ items: (await pool.query(`SELECT ${columns} FROM products ORDER BY id DESC`)).rows }); }
        catch { res.status(503).json({ error: 'No se pudieron cargar los productos.' }); }
    });
    async function save(req, res, editing) {
        let product;
        try { product = parseProduct(req.body); }
        catch (error) { return res.status(400).json({ error: error.message }); }
        const values = [product.name, product.description, product.price, product.img, product.styles, product.active, product.category, product.department, product.subcategory];
        try {
            const query = editing
                ? `UPDATE products SET name=$1, description=$2, price=$3, image_url=$4, styles=$5, active=$6, category=$7, department=$8, subcategory=$9 WHERE id=$10 RETURNING ${columns}`
                : `INSERT INTO products (name,description,price,image_url,styles,active,category,department,subcategory) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING ${columns}`;
            if (editing) values.push(req.productId);
            const { rows } = await pool.query(query, values);
            if (!rows[0]) return res.status(404).json({ error: 'El producto no existe.' });
            res.status(editing ? 200 : 201).json({ product: rows[0] });
        } catch { res.status(503).json({ error: 'No se pudo guardar el producto.' }); }
    }
    router.post('/', (req, res) => save(req, res, false));
    router.put('/:id', (req, res) => save(req, res, true));
    // Preserve references in saved carts; inactive products are excluded from catalog and checkout.
    router.delete('/:id', async (req, res) => {
        try {
            const { rows } = await pool.query(`UPDATE products SET active=false WHERE id=$1 RETURNING ${columns}`, [req.productId]);
            if (!rows[0]) return res.status(404).json({ error: 'El producto no existe.' });
            res.json({ product: rows[0] });
        } catch { res.status(503).json({ error: 'No se pudo desactivar el producto.' }); }
    });
    return router;
}
module.exports = { parseProduct, createProductAdminRouter };
