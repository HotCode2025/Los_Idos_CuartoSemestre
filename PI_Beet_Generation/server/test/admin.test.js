const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const { publicUser, DEFAULT_ADMIN_EMAIL } = require('../permissions');
const { requireAdmin, createAdminRouter } = require('../admin');
const { createAuthRouter, hashPassword } = require('../auth');

test('only the initial account or approved users receive admin access', () => {
    assert.equal(publicUser({ id: 1, name: 'Owner', email: DEFAULT_ADMIN_EMAIL.toUpperCase() }).isAdmin, true);
    assert.equal(publicUser({ id: 2, name: 'User', email: 'user@test.invalid', approved_admin: false }).isAdmin, false);
    assert.equal(publicUser({ id: 2, name: 'User', email: 'user@test.invalid', approved_admin: true }).isAdmin, true);
    assert.equal(publicUser({ id: 2, name: 'User', email: 'user@test.invalid', isAdmin: true }).isAdmin, false);
});

test('PostgreSQL admin routes enforce login, approval, revocation and principal protection',
    { skip: process.env.CART_DB_TEST !== '1' }, async () => {
    const { pool } = require('../db');
    const db = await pool.connect();
    const schema = 'admin_test_' + crypto.randomBytes(8).toString('hex');
    let server;
    try {
        await db.query(`CREATE SCHEMA ${schema}`);
        await db.query(`SET search_path TO ${schema}`);
        await db.query(fs.readFileSync(path.join(__dirname, '../db/001_initial.sql'), 'utf8'));
        const passwordHash = await hashPassword('password123');
        const { rows: users } = await db.query(`INSERT INTO users (name,email,password_hash)
            VALUES ('Owner',$1,$2),('User','user@test.invalid',$2) RETURNING id`, [DEFAULT_ADMIN_EMAIL, passwordHash]);
        const connection = { query: (...args) => db.query(...args) };
        const app = express();
        app.use(express.json());
        app.use('/api/auth', createAuthRouter(connection, { appUrl: 'http://localhost' }));
        app.use('/api/admin', createAdminRouter(connection));
        app.get('/admin', requireAdmin(connection, { page: true }), (req, res) => res.send('panel'));
        server = app.listen(0, '127.0.0.1');
        await new Promise(resolve => server.once('listening', resolve));
        const base = `http://127.0.0.1:${server.address().port}`;
        const call = (url, cookie = '', method = 'GET', body) => fetch(base + url, {
            method, redirect: 'manual', headers: { cookie, 'Content-Type': 'application/json' },
            body: body === undefined ? undefined : JSON.stringify(body),
        });
        assert.equal((await call('/api/admin')).status, 401);
        const page = await call('/admin');
        assert.equal(page.status, 302);
        assert.equal(page.headers.get('location'), '/?login=1');
        const login = async (email) => {
            const response = await call('/api/auth/login', '', 'POST', { email, password: 'password123', isAdmin: true });
            assert.equal(response.status, 200);
            return { cookie: response.headers.get('set-cookie').split(';')[0], data: await response.json() };
        };
        const owner = await login(DEFAULT_ADMIN_EMAIL);
        const member = await login('user@test.invalid');
        assert.equal(owner.data.user.isAdmin, true);
        assert.equal(member.data.user.isAdmin, false);
        assert.equal((await call('/api/admin', member.cookie)).status, 403);
        assert.equal((await call('/admin', member.cookie)).status, 403);
        assert.equal((await call(`/api/admin/users/${users[0].id}`, member.cookie, 'PATCH', { approved: true })).status, 403);
        // El CRUD de productos usa la misma autorización de administrador que la gestión de permisos.
        const productBody = { name: 'Buzo de prueba', description: 'Algodon', price: 5500.25,
            img: '/assets/images/products/buzo_gris.png', styles: ['STREET'], active: true, category: 'unisex', department: 'indumentaria', subcategory: 'buzos' };
        assert.equal((await call('/api/admin/products')).status, 401);
        assert.equal((await call('/api/admin/products', member.cookie, 'POST', productBody)).status, 403);
        assert.equal((await call('/api/admin/products', owner.cookie, 'POST', { ...productBody, price: -1 })).status, 400);
        const created = await call('/api/admin/products', owner.cookie, 'POST', productBody);
        assert.equal(created.status, 201);
        const productId = (await created.json()).product.id;
        const list = await (await call('/api/admin/products', owner.cookie)).json();
        assert.equal(list.items[0].name, productBody.name);
        assert.equal(list.items[0].price, 5500.25);
        assert.equal(list.items[0].category, 'unisex');
        assert.equal(list.items[0].department, 'indumentaria');
        assert.equal(list.items[0].subcategory, 'buzos');
        const edited = await call(`/api/admin/products/${productId}`, owner.cookie, 'PUT', { ...productBody, name: 'Buzo editado', price: 6100, category: 'mujer' });
        assert.equal(edited.status, 200);
        const updatedProduct = (await edited.json()).product;
        assert.equal(updatedProduct.price, 6100);
        assert.equal(updatedProduct.category, 'mujer');
        await db.query('INSERT INTO cart_items (user_id,product_id,quantity) VALUES ($1,$2,2)', [users[1].id, productId]);
        assert.equal((await call(`/api/admin/products/${productId}`, member.cookie, 'DELETE', {})).status, 403);
        const removed = await call(`/api/admin/products/${productId}`, owner.cookie, 'DELETE', {});
        assert.equal(removed.status, 200);
        assert.equal((await removed.json()).product.active, false);
        assert.equal((await db.query('SELECT id FROM products WHERE active AND id=$1', [productId])).rows.length, 0);
        assert.equal((await db.query('SELECT quantity FROM cart_items WHERE product_id=$1', [productId])).rows[0].quantity, 2);
        const restored = await call(`/api/admin/products/${productId}`, owner.cookie, 'PUT', productBody);
        assert.equal((await restored.json()).product.active, true);
        assert.equal((await call('/api/admin/products/2147483647', owner.cookie, 'DELETE', {})).status, 404);
        assert.equal((await call('/api/admin/products/invalid', owner.cookie, 'PUT', productBody)).status, 400);
        const data = await (await call('/api/admin', owner.cookie)).json();
        assert.equal(data.users.length, 2);
        assert.ok(!JSON.stringify(data).includes(passwordHash));
        assert.equal((await call(`/api/admin/users/${users[1].id}`, owner.cookie, 'PATCH', { approved: 'true' })).status, 400);
        assert.equal((await call(`/api/admin/users/${users[1].id}`, owner.cookie, 'PATCH', { approved: true })).status, 200);
        assert.equal((await call('/api/admin', member.cookie)).status, 200);
        const me = await (await call('/api/auth/me', member.cookie)).json();
        assert.equal(me.user.isAdmin, true);
        assert.equal((await call(`/api/admin/users/${users[1].id}`, member.cookie, 'PATCH', { approved: false })).status, 400);
        assert.equal((await call(`/api/admin/users/${users[0].id}`, member.cookie, 'PATCH', { approved: false })).status, 404);
        assert.equal((await call(`/api/admin/users/${users[1].id}`, owner.cookie, 'PATCH', { approved: false })).status, 200);
        assert.equal((await call('/api/admin', member.cookie)).status, 403);
        const registered = await call('/api/auth/register', '', 'POST', {
            name: 'Other', email: 'other@test.invalid', password: 'password123', approved_admin: true, isAdmin: true,
        });
        assert.equal(registered.status, 201);
        assert.equal((await registered.json()).user.isAdmin, false);
        await call('/api/auth/logout', owner.cookie, 'POST', {});
        assert.equal((await call('/api/admin', owner.cookie)).status, 401);
    } finally {
        if (server) await new Promise(resolve => server.close(resolve));
        await db.query('RESET search_path');
        await db.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
        db.release();
        await pool.end();
    }
});
