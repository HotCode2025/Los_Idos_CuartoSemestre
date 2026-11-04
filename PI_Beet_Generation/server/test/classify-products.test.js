const { test } = require('node:test');
const assert = require('node:assert/strict');
const { suggestClassification, missingClassification } = require('../classify-products');
test('classifies existing product names and uses descriptions when needed', () => {
    for (const [name, description, department, subcategory] of [
        ['Hoodie Bluffington', '', 'indumentaria', 'buzos'],
        ['Baggy Short Patti', 'Ideal con zapatillas skate', 'indumentaria', 'shorts'],
        ['Boxy Shirt Killer Tofu', '', 'indumentaria', 'camisas'],
        ['Cutoff Tee Honker Burger', '', 'indumentaria', 'musculosas'],
        ['Overshirt Beebe Bluff', '', 'indumentaria', 'camisas'],
        ['T-shirt Boxy Porkchop', '', 'indumentaria', 'remeras'],
        ['Pantalon oxford naranja', '', 'indumentaria', 'pantalones'],
        ['Cartera marron', '', 'accesorios', 'carteras'],
        ['Boonie Hat Skeeter', '', 'accesorios', 'gorras'],
        ['Modelo nuevo', 'Vestido corto negro', 'indumentaria', 'vestidos'],
    ]) assert.deepEqual(suggestClassification({ name, description }), { department, subcategory });
    assert.equal(suggestClassification({ name: 'Producto desconocido' }), null);
});
test('preserves manual classification and fills only missing fields', () => {
    assert.equal(missingClassification({ name: 'Buzo', department: 'accesorios', subcategory: 'mochilas' }), null);
    assert.deepEqual(missingClassification({ name: 'Buzo', department: 'sin-clasificar', subcategory: '' }),
        { department: 'indumentaria', subcategory: 'buzos' });
    assert.deepEqual(missingClassification({ name: 'Buzo', department: 'indumentaria', subcategory: '' }),
        { department: 'indumentaria', subcategory: 'buzos' });
    assert.equal(missingClassification({ name: 'Buzo', department: 'calzado', subcategory: '' }), null);
});
