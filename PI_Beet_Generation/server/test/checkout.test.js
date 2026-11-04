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

const { parseShipping, shippingPreference, reviewCart } = require('../checkout');
const address = { name: ' Ana Test ', email: 'ana@example.test', phone: '+54 11 12345678',
    street: 'Calle de prueba', number: '123', city: 'La Plata', province: 'Buenos Aires', postalCode: '1900', floor: '2', apartment: 'B' };
test('validates delivery details and forwards the normalized address to Mercado Pago', () => {
    const parsed = parseShipping(address);
    assert.equal(parsed.name, 'Ana Test');
    const preference = shippingPreference(parsed);
    assert.equal(preference.payer.email, address.email);
    assert.equal(preference.shipments.receiver_address.street_number, 123);
    assert.equal(preference.shipments.receiver_address.city_name, 'La Plata');
    assert.equal(preference.shipments.receiver_address.apartment, 'B');
    for (const body of [undefined, {}, { ...address, email: 'invalid' }, { ...address, phone: 'hola' },
        { ...address, street: '' }, { ...address, number: '0' }, { ...address, number: '12a' },
        { ...address, postalCode: '<script>' }, { ...address, city: 'a'.repeat(101) }]) {
        assert.throws(() => parseShipping(body));
    }
});
test('reviews current prices and totals without trusting browser totals', async () => {
    const result = await reviewCart([{ id: 1, quantity: 3, price: 0.01 }], async ids => {
        assert.deepEqual(ids, [1]);
        return [{ id: 1, productName: 'Buzo', price: 10.15 }];
    });
    assert.equal(result.total, 30.45);
    assert.equal(result.items[0].quanty, 3);
    await assert.rejects(reviewCart([{ id: 9, quantity: 1 }], async () => []), /disponible/);
});
