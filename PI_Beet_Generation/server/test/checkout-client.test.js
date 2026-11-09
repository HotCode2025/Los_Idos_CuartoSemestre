const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

test('three-step checkout retains the cart, validates address, allows back navigation and starts payment only on confirmation', async () => {
    class Element {
        constructor() { this.listeners = {}; this.children = []; this.value = ''; this.style = {}; this.elements = {}; this.dataset = {}; this.hidden = false; }
        addEventListener(name, callback) { this.listeners[name] = callback; }
        append(...children) { this.children.push(...children); }
        replaceChildren(...children) { this.children = children; }
        setAttribute() {}
        removeAttribute() {}
        focus() {}
        scrollIntoView() {}
        reportValidity() { return true; }
    }
    const nodes = new Map();
    const get = id => {
        if (!nodes.has(id)) nodes.set(id, new Element());
        return nodes.get(id);
    };
    const backButtons = [1, 2, 1].map(step => { const e = new Element(); e.dataset.back = String(step); return e; });
    const cart = [{ id: 1, productName: 'Buzo', price: 300, quanty: 2, img: '/test.png' }];
    const calls = [];
    let redirected;
    let context;
    const form = get('checkout-address');
    form.elements = { name: {}, email: {} };
    form.values = { name: 'Ana Test', email: 'ana@example.test', phone: '1112345678', street: 'Prueba',
        number: '123', city: 'La Plata', province: 'Buenos Aires', postalCode: '1900', floor: '', apartment: '' };
    context = vm.createContext({ cart, formatPrice: value => '$' + value,
        document: { getElementById: get, createElement: () => new Element(), querySelectorAll: () => backButtons },
        FormData: class { constructor(element) { return Object.entries(element.values)[Symbol.iterator](); } },
        location: { assign: value => { redirected = value; }, reload() {} },
        CartStore: { ready: Promise.resolve({ name: 'Ana', email: 'ana@example.test' }), flush: async () => cart,
            change: async (product, delta) => { product.quanty += delta; context.onCartUpdated(); } },
        fetch: async (url, options) => {
            calls.push({ url, body: JSON.parse(options.body) });
            return { ok: true, json: async () => url === '/api/checkout/review'
                ? { items: cart.map(p => ({ ...p })), total: cart[0].price * cart[0].quanty }
                : { id: 'test', init_point: 'https://www.mercadopago.com.ar/checkout/test' } };
        },
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../../client/js/checkout.js'), 'utf8'), context);
    await new Promise(setImmediate);
    assert.equal(get('confirm-cart').disabled, false);
    // Cambia la cantidad usando el botón "más" que se dibuja en la página.
    const controls = get('checkout-items').children[0].children[2];
    const plus = controls.children.find(child => child.textContent === '+');
    await plus.listeners.click();
    assert.equal(cart[0].quanty, 3);
    await get('confirm-cart').listeners.click();
    assert.equal(get('checkout-step-2').hidden, false);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, '/api/checkout/review');
    form.values.phone = 'invalid';
    form.listeners.submit({ preventDefault() {} });
    assert.equal(get('checkout-step-3').hidden, true);
    form.values.phone = '1112345678';
    form.listeners.submit({ preventDefault() {} });
    assert.equal(get('checkout-step-3').hidden, false);
    assert.ok(get('checkout-delivery').textContent.includes('Prueba 123'));
    assert.equal(get('checkout-payment-total').textContent, '$900');
    assert.equal(calls.length, 1);
    backButtons[1].listeners.click();
    assert.equal(get('checkout-step-2').hidden, false);
    form.listeners.submit({ preventDefault() {} });
    await get('pay-order').listeners.click();
    assert.equal(calls.length, 2);
    assert.equal(calls[1].url, '/create_preference');
    assert.equal(calls[1].body.shipping.city, 'La Plata');
    assert.equal(calls[1].body.expectedTotal, 900);
    assert.equal(redirected, 'https://www.mercadopago.com.ar/checkout/test');
});
