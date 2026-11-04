const crypto = require('node:crypto');
const express = require('express');
const { readSessionToken } = require('./auth');
const { parseCart } = require('./checkout');

function createCartRouter(pool) {
    const router = express.Router();
    router.use(async (req, res, next) => {
        res.set('Cache-Control', 'no-store');
        if (req.method !== 'GET' && !req.is('application/json')) {
            return res.status(415).json({ error: 'Se esperaba JSON.' });
        }
        const token = readSessionToken(req);
        if (!token) return res.status(401).json({ error: 'Inicia sesion para guardar el carrito.' });
        try {
            const { rows } = await pool.query(`SELECT user_id FROM sessions
                WHERE token_hash = $1 AND expires_at > now()`,
                [crypto.createHash('sha256').update(token).digest('hex')]);
            if (!rows[0]) return res.status(401).json({ error: 'La sesion vencio. Ingresa nuevamente.' });
            req.cartUserId = rows[0].user_id;
            next();
        } catch { res.status(503).json({ error: 'No se pudo verificar la sesion.' }); }
    });
    const readCart = async (db, userId) => (await db.query(`SELECT p.id, p.name AS "productName",
        p.description, p.price::float8 AS price, p.image_url AS img, p.styles, c.quantity AS quanty
        FROM cart_items c JOIN products p ON p.id = c.product_id
        WHERE c.user_id = $1 AND p.active ORDER BY p.id`, [userId])).rows;
    router.get('/', async (req, res) => {
        try { res.json({ items: await readCart(pool, req.cartUserId) }); }
        catch { res.status(503).json({ error: 'No se pudo recuperar tu carrito.' }); }
    });
    async function save(req, res, merge) {
        let quantities;
        try {
            quantities = Array.isArray(req.body?.items) && req.body.items.length === 0
                ? new Map() : parseCart(req.body?.items);
            if (merge && !/^[a-f0-9-]{36}$/i.test(req.body.mergeId || '')) throw new Error('Identificador de carrito invalido.');
        } catch (error) { return res.status(400).json({ error: error.message }); }
        let db;
        try {
            db = await pool.connect();
            await db.query('BEGIN');
            // Serialize writes for this account, including writes from another browser.
            await db.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [req.cartUserId]);
            let apply = true;
            if (merge) {
                const result = await db.query(`INSERT INTO cart_merges (user_id, merge_id) VALUES ($1, $2)
                    ON CONFLICT DO NOTHING RETURNING merge_id`, [req.cartUserId, req.body.mergeId]);
                apply = result.rowCount > 0;
            }
            if (apply) {
                const ids = [...quantities.keys()];
                const available = await db.query('SELECT id FROM products WHERE active AND id = ANY($1::int[])', [ids]);
                if (available.rows.length !== ids.length) {
                    await db.query('ROLLBACK');
                    return res.status(400).json({ error: 'Un producto ya no esta disponible. Actualiza el catalogo.' });
                }
                if (!merge) await db.query('DELETE FROM cart_items WHERE user_id = $1', [req.cartUserId]);
                for (const [id, quantity] of quantities) {
                    await db.query(`INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)
                        ON CONFLICT (user_id, product_id) DO UPDATE SET
                        quantity = LEAST(99, cart_items.quantity + EXCLUDED.quantity), updated_at = now()`,
                        [req.cartUserId, id, quantity]);
                }
            }
            const items = await readCart(db, req.cartUserId);
            await db.query('COMMIT');
            res.json({ items });
        } catch {
            await db?.query('ROLLBACK').catch(() => {});
            res.status(503).json({ error: 'No se pudo guardar el carrito. Reintenta antes de salir.' });
        } finally { db?.release(); }
    }
    router.put('/', (req, res) => save(req, res, false));
    router.post('/merge', (req, res) => save(req, res, true));
    return router;
}
module.exports = { createCartRouter };
