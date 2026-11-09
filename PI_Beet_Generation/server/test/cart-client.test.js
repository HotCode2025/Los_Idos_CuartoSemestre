const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const source = fs.readFileSync(path.join(__dirname, '../../client/js/cart-store.js'), 'utf8');
const products = [{ id: 1, productName: 'Remera', price: 300 }, { id: 2, productName: 'Buzo', price: 500 }];
function browser(storage, backend) {
    const context = vm.createContext({ crypto, cart: [], productos: products, catalogReady: Promise.resolve(),
        cartToastTimer: null, cartToastMessage: {}, cartToast: { classList: { add() {} } }, clearTimeout,
        displayCartCounter() {}, displayCart() {}, modalContainer: { style: {} },
        localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value),
            removeItem: key => storage.delete(key) }, fetch: backend.fetch });
    vm.runInContext(source, context);
    return { store: vm.runInContext('CartStore', context), cart: context.cart };
}
function backend() {
    const carts = new Map([[1, [{ ...products[0], quanty: 2 }]], [2, []]]);
    let user = null;
    let fail = false;
    const merges = new Set();
    return { carts, login(id) { user = id ? { id } : null; return Promise.resolve({ user }); },
        failNext() { fail = true; },
        async fetch(url, options = {}) {
            if (fail) { fail = false; throw new Error('Sin conexion'); }
            let data;
            if (url === '/api/auth/me') data = { user };
            else if (!user) return { ok: false, json: async () => ({ error: 'Sesion vencida' }) };
            else {
                const body = options.body && JSON.parse(options.body);
                if (options.method === 'PUT') carts.set(user.id, body.items.map(item => ({ ...products.find(p => p.id === item.id), quanty: item.quantity })));
                if (url.endsWith('/merge') && !merges.has(body.mergeId)) {
                    merges.add(body.mergeId);
                    const items = carts.get(user.id);
                    for (const item of body.items) {
                        const found = items.find(p => p.id === item.id);
                        if (found) found.quanty += item.quantity;
                        else items.push({ ...products.find(p => p.id === item.id), quanty: item.quantity });
                    }
                }
                data = { items: structuredClone(carts.get(user.id)) };
            }
            return { ok: true, json: async () => data };
        } };
}
test('guest survives reload, login combines carts, logout separates accounts, login restores', async () => {
    const storage = new Map();
    const api = backend();
    let page = browser(storage, api);
    await page.store.ready;
    await page.store.change(products[0], 1);
    await page.store.change(products[1], 1);
    page = browser(storage, api);
    await page.store.ready;
    assert.equal(page.cart.length, 2);
    await page.store.authenticate(() => api.login(1));
    assert.equal(page.cart[0].quanty, 3);
    assert.equal(storage.size, 0);
    // Los cambios rápidos se ejecutan en orden, después se cierra sesión y luego entra otra cuenta.
    await Promise.all([page.store.change(products[0], 1), page.store.change(products[0], 1),
        page.store.authenticate(() => api.login(null)), page.store.authenticate(() => api.login(2))]);
    assert.equal(page.cart.length, 0);
    await page.store.authenticate(() => api.login(1));
    assert.equal(page.cart[0].quanty, 5);
    await page.store.change(products[1], null);
    page = browser(storage, api);
    await page.store.ready;
    assert.equal(page.cart.length, 1);
    assert.equal(page.cart[0].quanty, 5);
});
test('failed save preserves the displayed cart and can be retried', async () => {
    const api = backend();
    await api.login(1);
    const page = browser(new Map(), api);
    await page.store.ready;
    api.failNext();
    await assert.rejects(page.store.change(products[0], 1), /Sin conexion/);
    assert.equal(page.cart[0].quanty, 2);
    await page.store.change(products[0], 1);
    assert.equal(page.cart[0].quanty, 3);
});

test('minus removes the last unit, persists removal and tolerates repeated clicks', async () => {
    for (const loggedIn of [false, true]) {
        const api = backend();
        const storage = new Map();
        if (loggedIn) await api.login(1);
        let page = browser(storage, api);
        await page.store.ready;
        if (!loggedIn) await page.store.change(products[0], 1);
        await page.store.change(products[1], 1);
        // Un segundo "menos" en cola después de eliminar no debe recrear el producto ni borrar otro.
        await Promise.all([page.store.change(products[1], -1), page.store.change(products[1], -1)]);
        assert.ok(!page.cart.some(item => item.id === products[1].id));
        assert.ok(page.cart.some(item => item.id === products[0].id));
        page = browser(storage, api);
        await page.store.ready;
        assert.ok(!page.cart.some(item => item.id === products[1].id));
        assert.ok(page.cart.some(item => item.id === products[0].id));
    }
});
