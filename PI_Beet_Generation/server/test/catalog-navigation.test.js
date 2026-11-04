const { test } = require('node:test');
const assert = require('node:assert/strict');
const { availableCatalogFamilies } = require('../../client/js/catalog-navigation');
const taxonomy = require('../../client/js/catalog-taxonomy');
test('menu includes only families and subcategories with active products', () => {
    const result = availableCatalogFamilies([
        { department: 'calzado', subcategory: 'zapatillas', active: true },
        { department: 'calzado', subcategory: 'sandalias', active: false },
        { department: 'accesorios', subcategory: 'mochilas' },
        { department: 'indumentaria', subcategory: 'remeras', active: false },
    ], taxonomy);
    assert.deepEqual(Object.keys(result), ['calzado', 'accesorios']);
    assert.deepEqual(Object.keys(result.calzado.items), ['zapatillas']);
    assert.deepEqual(Object.keys(result.accesorios.items), ['mochilas']);
    assert.deepEqual(availableCatalogFamilies([], taxonomy), {});
});
test('a family can have active products without a classified subcategory', () => {
    const result = availableCatalogFamilies([{ department: 'calzado', subcategory: '' }], taxonomy);
    assert.deepEqual(result.calzado.items, {});
    assert.equal(result.calzado.label, 'Calzado');
});
