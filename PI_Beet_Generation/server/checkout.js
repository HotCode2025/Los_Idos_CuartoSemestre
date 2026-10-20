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
module.exports = { parseCart, buildPaymentItems };
