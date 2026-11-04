const { test } = require('node:test');
const assert = require('node:assert/strict');
const products = require('../db/products.json');
const { setupDatabase } = require('../db/setup');

test('seeds the initial catalog without overwriting existing products', async () => {
    const queries = [];
    let released = false;
    const client = {
        async query(query, values) {
            queries.push({ query, values });
            if (query.includes('RETURNING id')) return { rowCount: 1 };
            return { rowCount: 0 };
        },
        release() {
            released = true;
        },
    };

    await setupDatabase({ connect: async () => client });

    const inserts = queries.filter(({ query }) => query.includes('INSERT INTO products'));
    assert.equal(inserts.length, products.length);
    assert.ok(inserts.every(({ query }) => query.includes('ON CONFLICT (id) DO NOTHING')));
    assert.deepEqual(inserts.map(({ values }) => values[0]), products.map(({ id }) => id));
    assert.ok(queries.some(({ query }) => query === 'COMMIT'));
    assert.equal(released, true);
});

test('does not re-seed deleted products after the initial catalog load', async () => {
    const queries = [];
    const client = {
        async query(query) {
            queries.push(query);
            return { rowCount: 0 };
        },
        release() {},
    };

    await setupDatabase({ connect: async () => client });

    assert.equal(queries.some((query) => query.includes('INSERT INTO products')), false);
    assert.ok(queries.some((query) => query.includes("SELECT 'product:' || id::text FROM products")));
});
