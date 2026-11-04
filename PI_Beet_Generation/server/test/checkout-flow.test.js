const { test } = require('node:test');
const assert = require('node:assert/strict');

test('checkout serves all steps and validates the cart and address before contacting the payment provider', async () => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = 'TEST-private-token';
    const db = require('../db');
    const originalLoad = db.getProductsByIds;
    const originalFetch = global.fetch;
    let providerCalls = 0;
    let providerBody;
    let mode = 'ok';
    db.getProductsByIds = async ids => ids.includes(1) ? [{ id: 1, productName: 'Buzo', price: 300.5, img: '/test.png', quanty: 1 }] : [];
    global.fetch = async (url, options) => {
        if (String(url).startsWith('https://api.mercadopago.com/')) {
            providerCalls++;
            providerBody = JSON.parse(options.body);
            if (mode === 'failure') throw new Error('connection failed');
            return { ok: true, json: async () => ({ id: 'test-preference',
                init_point: mode === 'invalid-url' ? 'https://example.com/not-payment' : 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=test' }) };
        }
        return originalFetch(url, options);
    };
    const app = require('../server');
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const post = (url, body) => originalFetch(base + url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const shipping = { name: 'Ana Test', email: 'ana@example.test', phone: '1112345678', street: 'Prueba',
        number: '123', city: 'La Plata', province: 'Buenos Aires', postalCode: '1900' };
    try {
        const page = await originalFetch(base + '/checkout');
        assert.equal(page.status, 200);
        const html = await page.text();
        for (const [, resource] of html.matchAll(/(?:src|href)="(\/(?:js|css)\/[^"]+)"/g)) {
            assert.equal((await originalFetch(base + resource)).status, 200, resource);
        }
        assert.ok(html.includes('checkout-step-1') && html.includes('checkout-step-2') && html.includes('checkout-step-3'));
        assert.equal((await post('/api/checkout/review', { items: [] })).status, 400);
        assert.equal((await post('/api/checkout/review', { items: [{ id: 99, quantity: 1 }] })).status, 400);
        const body = { items: [{ id: 1, quantity: 2, price: 0.01 }], shipping, expectedTotal: 601 };
        const reviewed = await (await post('/api/checkout/review', body)).json();
        assert.equal(reviewed.total, 601);
        assert.equal(providerCalls, 0);
        assert.equal((await post('/create_preference', { ...body, shipping: undefined })).status, 400);
        assert.equal((await post('/create_preference', { ...body, expectedTotal: 1 })).status, 409);
        assert.equal(providerCalls, 0);
        const preference = await post('/create_preference', body);
        assert.equal(preference.status, 200);
        assert.equal((await preference.json()).id, 'test-preference');
        assert.equal(providerBody.items[0].unit_price, 300.5);
        assert.equal(providerBody.shipments.receiver_address.street_name, 'Prueba');
        assert.equal(providerBody.payer.email, shipping.email);
        mode = 'failure';
        assert.equal((await post('/create_preference', body)).status, 502);
        mode = 'invalid-url';
        assert.equal((await post('/create_preference', body)).status, 502);
        mode = 'ok';
        assert.equal((await post('/create_preference', body)).status, 200);
    } finally {
        global.fetch = originalFetch;
        db.getProductsByIds = originalLoad;
        await new Promise(resolve => server.close(resolve));
        await db.pool.end();
    }
});
