const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseCart, buildPaymentItems } = require('../checkout');

test('rejects invalid carts and excessive cumulative quantities', () => {
    for (const items of [undefined, [], [null], [{ id: '1', quantity: 1 }],
        [{ id: 1, quantity: 0 }], [{ id: 1, quantity: 1.5 }],
        [{ id: 1, quantity: 99 }, { id: 1, quantity: 1 }]]) {
        assert.throws(() => parseCart(items));
    }
});

test('merges repeated items and uses database prices, ignoring browser prices', () => {
    const cart = parseCart([{ id: 1, quantity: 2, price: 0.01 }, { id: 1, quantity: 1 }]);
    const items = buildPaymentItems(cart, [{ id: 1, productName: 'Buzo', price: 40 }]);
    assert.deepEqual(items, [{ id: '1', title: 'Buzo', unit_price: 40, quantity: 3, currency_id: 'ARS' }]);
});

test('rejects products absent from active database products', () => {
    assert.throws(() => buildPaymentItems(parseCart([{ id: 1, quantity: 1 }]), []), /disponible/);
});
