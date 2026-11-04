const express = require('express');
const { createProductAdminRouter } = require('./admin-products');
const crypto = require('node:crypto');
const path = require('node:path');
const { readSessionToken } = require('./auth');
const { DEFAULT_ADMIN_EMAIL, publicUser } = require('./permissions');

function requireAdmin(pool, { page = false } = {}) {
    return async (req, res, next) => {
        res.set('Cache-Control', 'no-store');
        try {
            const token = readSessionToken(req);
            const { rows } = token ? await pool.query(`SELECT u.id, u.name, u.email, u.approved_admin
                FROM sessions s JOIN users u ON u.id = s.user_id
                WHERE s.token_hash = $1 AND s.expires_at > now()`,
                [crypto.createHash('sha256').update(token).digest('hex')]) : { rows: [] };
            if (!rows[0]) return page ? res.redirect('/?login=1')
                : res.status(401).json({ error: 'Inicia sesion para ingresar al panel.' });
            req.admin = publicUser(rows[0]);
            if (!req.admin.isAdmin) return page
                ? res.status(403).sendFile(path.join(__dirname, 'views/admin-denied.html'))
                : res.status(403).json({ error: 'Tu cuenta no tiene acceso aprobado al panel.' });
            next();
        } catch { res.status(503).json({ error: 'No se pudo verificar el acceso. Intenta nuevamente.' }); }
    };
}
function createAdminRouter(pool) {
    const router = express.Router();
    router.use(requireAdmin(pool));
    router.use((req, res, next) => {
        if (req.method !== 'GET' && !req.is('application/json')) return res.status(415).json({ error: 'Se esperaba JSON.' });
        next();
    });
    router.use('/products', createProductAdminRouter(pool));
    router.get('/', async (req, res) => {
        try {
            const { rows: users } = await pool.query('SELECT id, name, email, approved_admin, created_at FROM users ORDER BY id');
            const { rows } = await pool.query(`SELECT count(*)::int AS total,
                count(*) FILTER (WHERE active)::int AS active FROM products`);
            res.json({ user: req.admin, users: users.map(u => ({ ...publicUser(u), createdAt: u.created_at,
                protected: u.email.toLowerCase() === DEFAULT_ADMIN_EMAIL || u.id === req.admin.id })), products: rows[0] });
        } catch { res.status(503).json({ error: 'No se pudo cargar el panel.' }); }
    });
    router.patch('/users/:id', async (req, res) => {
        const id = Number(req.params.id);
        if (!Number.isSafeInteger(id) || id < 1 || id > 2147483647 || typeof req.body?.approved !== 'boolean') {
            return res.status(400).json({ error: 'Usuario o permiso invalido.' });
        }
        try {
            if (!req.body.approved && id === req.admin.id) return res.status(400).json({ error: 'No podes quitar tu propio acceso.' });
            const { rows } = await pool.query(`UPDATE users SET approved_admin = $1
                WHERE id = $2 AND lower(email) <> $3 RETURNING id, name, email, approved_admin`,
                [req.body.approved, id, DEFAULT_ADMIN_EMAIL]);
            if (!rows[0]) return res.status(404).json({ error: 'Usuario inexistente o cuenta administradora principal protegida.' });
            res.json({ user: publicUser(rows[0]) });
        } catch { res.status(503).json({ error: 'No se pudo actualizar el acceso.' }); }
    });
    return router;
}
module.exports = { requireAdmin, createAdminRouter };
