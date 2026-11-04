const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseProduct } = require('../admin-products');
const valid = { name: ' Buzo ', description: ' Algodon ', price: 3500.5,
    img: '/assets/images/products/buzo_gris.png', styles: ['STREET'], active: true };
test('validates and normalizes product fields before storing', () => {
    const result = parseProduct(valid);
    assert.equal(result.name, 'Buzo');
    assert.equal(result.description, 'Algodon');
    assert.equal(result.price, 3500.5);
    assert.equal(parseProduct({ ...valid, img: 'https://example.com/photo.png' }).img, 'https://example.com/photo.png');
    for (const changes of [ { category: 'invalid' }, { category: 'accesorios' }, { name: '' }, { name: 'a'.repeat(151) }, { price: -1 }, { price: 0 },
        { price: NaN }, { price: '123' }, { price: 1.001 }, { price: 10000000000 },
        { img: 'javascript:alert(1)' }, { img: '//example.com/a.png' }, { img: '/assets/images/products/../file.png' },
        { img: 'http://example.com/a.png' }, { styles: ['INVALID'] }, { styles: 'STREET' },
        { active: 'true' }, { description: 'a'.repeat(5001) } ]) {
        assert.throws(() => parseProduct({ ...valid, ...changes }), JSON.stringify(changes));
    }
});

test('validates that subcategories belong to their product family', () => {
    const parsed = parseProduct({ ...valid, department: 'calzado', subcategory: 'zapatillas' });
    assert.equal(parsed.department, 'calzado');
    assert.equal(parsed.subcategory, 'zapatillas');
    for (const classification of [
        { department: 'calzado', subcategory: 'buzos' },
        { department: 'unknown', subcategory: '' },
        { department: 'sin-clasificar', subcategory: 'carteras' },
        { department: 'accesorios', subcategory: 123 },
        { department: 'toString', subcategory: '' },
    ]) assert.throws(() => parseProduct({ ...valid, ...classification }));
});
