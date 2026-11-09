const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const { createCartRouter } = require('../cart');

test('cart endpoints require authentication before reading or writing', async () => {
    const app = express();
    app.use(express.json(), createCartRouter({ query: async () => ({ rows: [] }) }));
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    try {
        for (const cookie of ['', 'beet_session=expired']) {
            const response = await fetch(`http://127.0.0.1:${server.address().port}/`, { headers: { cookie } });
            assert.equal(response.status, 401);
            assert.equal(response.headers.get('cache-control'), 'no-store');
        }
    } finally { await new Promise(resolve => server.close(resolve)); }
});

// Se ejecuta a propósito sobre un esquema temporal aislado; nunca modifica datos de la aplicación.
test('PostgreSQL persists isolated carts, merges once, validates and deletes',
    { skip: process.env.CART_DB_TEST !== '1' }, async () => {
    const { pool } = require('../db');
    const db = await pool.connect();
    const schema = 'cart_test_' + crypto.randomBytes(8).toString('hex');
    let server;
    try {
        await db.query(`CREATE SCHEMA ${schema}`);
        await db.query(`SET search_path TO ${schema}`);
        await db.query(fs.readFileSync(path.join(__dirname, '../db/001_initial.sql'), 'utf8'));
        const { rows: users } = await db.query(`INSERT INTO users (name,email,password_hash)
            VALUES ('Ana','ana@test.invalid','unused'),('Beto','beto@test.invalid','unused') RETURNING id`);
        await db.query(`INSERT INTO products (id,name,price,image_url) VALUES (1,'Remera',300,'/remera.png'),(2,'Buzo',500,'/buzo.png')`);
        for (const [index, token] of ['ana', 'beto', 'expired'].entries()) {
            await db.query(`INSERT INTO sessions (token_hash,user_id,expires_at) VALUES ($1,$2,$3)`,
                [crypto.createHash('sha256').update(token).digest('hex'), users[index % 2].id,
                    new Date(Date.now() + (token === 'expired' ? -60000 : 60000))]);
        }
        const app = express();
        app.use(express.json());
        app.use('/api/cart', createCartRouter({ query: (...args) => db.query(...args),
            connect: async () => ({ query: (...args) => db.query(...args), release() {} }) }));
        server = app.listen(0, '127.0.0.1');
        await new Promise(resolve => server.once('listening', resolve));
        const call = async (token, method = 'GET', body, suffix = '') => {
            const r = await fetch(`http://127.0.0.1:${server.address().port}/api/cart${suffix}`, {
                method, headers: { cookie: `beet_session=${token}`, 'Content-Type': 'application/json' },
                body: body === undefined ? undefined : JSON.stringify(body),
            });
            return { status: r.status, data: await r.json() };
        };
        assert.equal((await call('expired')).status, 401);
        assert.equal((await call('ana', 'PUT', { items: [{ id: 1, quantity: 2 }], user_id: users[1].id })).status, 200);
        assert.deepEqual((await call('beto')).data.items, []);
        assert.equal((await call('ana')).data.items[0].quanty, 2);
        assert.equal((await call('ana')).data.items[0].price, 300);
        const merge = { mergeId: crypto.randomUUID(), items: [{ id: 1, quantity: 3 }, { id: 2, quantity: 1 }] };
        assert.equal((await call('ana', 'POST', merge, '/merge')).data.items[0].quanty, 5);
        assert.equal((await call('ana', 'POST', merge, '/merge')).data.items[0].quanty, 5);
        assert.equal((await call('ana', 'PUT', { items: [{ id: 999, quantity: 1 }] })).status, 400);
        assert.equal((await call('ana', 'PUT', { items: [{ id: 1, quantity: 100 }] })).status, 400);
        assert.equal((await call('ana')).data.items.length, 2);
        assert.equal((await call('ana', 'PUT', { items: [{ id: 2, quantity: 4 }] })).data.items.length, 1);
        assert.equal((await call('ana')).data.items[0].quanty, 4);
        assert.deepEqual((await call('ana', 'PUT', { items: [] })).data.items, []);
    } finally {
        if (server) await new Promise(resolve => server.close(resolve));
        await db.query('RESET search_path');
        await db.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
        db.release();
        await pool.end();
    }
});
