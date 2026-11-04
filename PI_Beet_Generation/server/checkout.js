function parseCart(items) {
    if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
        throw new Error('El carrito debe contener entre 1 y 100 productos.');
    }
    const quantities = new Map();
    for (const item of items) {
        if (!item || !Number.isSafeInteger(item.id) || item.id < 1 || item.id > 2147483647 ||
            !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
            throw new Error('Producto o cantidad invalida (usa entre 1 y 99 unidades).');
        }
        const quantity = (quantities.get(item.id) || 0) + item.quantity;
        if (quantity > 99) throw new Error('El maximo es 99 unidades por producto.');
        quantities.set(item.id, quantity);
    }
    return quantities;
}

function buildPaymentItems(quantities, products) {
    const byId = new Map(products.map((product) => [product.id, product]));
    return [...quantities].map(([id, quantity]) => {
        const product = byId.get(id);
        if (!product) throw new Error('Un producto ya no esta disponible. Actualiza el catalogo.');
        return { id: String(id), title: product.productName, unit_price: Number(product.price), quantity, currency_id: 'ARS' };
    });
}
function parseShipping(input) {
    const text = (key, label, max = 100, optional = false) => {
        const value = typeof input?.[key] === 'string' ? input[key].trim() : '';
        if ((!optional && !value) || value.length > max) throw new Error(`Revisa ${label}.`);
        return value;
    };
    const shipping = {
        name: text('name', 'el nombre del destinatario'), email: text('email', 'el email', 254),
        phone: text('phone', 'el telefono', 30), street: text('street', 'la calle', 150),
        number: text('number', 'la altura', 8), city: text('city', 'la localidad'),
        province: text('province', 'la provincia'), postalCode: text('postalCode', 'el codigo postal', 12),
        floor: text('floor', 'el piso', 20, true), apartment: text('apartment', 'el departamento', 20, true),
    };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shipping.email)) throw new Error('Ingresa un email valido.');
    if (shipping.phone.replace(/\D/g, '').length < 8 || !/^[+\d\s()-]+$/.test(shipping.phone)) throw new Error('Ingresa un telefono valido.');
    if (!/^\d{1,8}$/.test(shipping.number) || Number(shipping.number) < 1) throw new Error('Ingresa una altura numerica valida.');
    if (!/^[a-zA-Z0-9 -]{3,12}$/.test(shipping.postalCode)) throw new Error('Ingresa un codigo postal valido.');
    return shipping;
}
function shippingPreference(shipping) {
    return {
        payer: { name: shipping.name, email: shipping.email, phone: { number: shipping.phone } },
        shipments: { receiver_address: {
            zip_code: shipping.postalCode, street_name: shipping.street, street_number: Number(shipping.number),
            city_name: shipping.city, state_name: shipping.province, country_name: 'Argentina', floor: shipping.floor, apartment: shipping.apartment,
        } },
    };
}
async function reviewCart(input, loadProducts) {
    const quantities = parseCart(input);
    const products = await loadProducts([...quantities.keys()]);
    const paymentItems = buildPaymentItems(quantities, products);
    const total = paymentItems.reduce((sum, item) => sum + Math.round(item.unit_price * 100) * item.quantity, 0) / 100;
    return { items: [...quantities].map(([id, quanty]) => ({ ...products.find(p => p.id === id), quanty })), total };
}
module.exports = { parseCart, buildPaymentItems, parseShipping, shippingPreference, reviewCart };
