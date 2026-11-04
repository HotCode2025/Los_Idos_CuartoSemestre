const checkoutStatus = document.getElementById('checkout-status');
const confirmCart = document.getElementById('confirm-cart');
const addressForm = document.getElementById('checkout-address');
const payOrder = document.getElementById('pay-order');
let currentStep = 1;
let busy = true;
let review = null;
let shipping = null;
function onCartError(message) {
    checkoutStatus.textContent = message;
}
function onCartUpdated() {
    review = null;
    renderCheckoutCart();
}
function lockCheckout(value) {
    busy = value;
    document.getElementById('address-fields').disabled = value;
    document.querySelectorAll('[data-back], #pay-order, #checkout-address button').forEach(button => { button.disabled = value; });
    renderCheckoutCart();
}
function showStep(step) {
    currentStep = step;
    for (let index = 1; index <= 3; index++) {
        document.getElementById(`checkout-step-${index}`).hidden = index !== step;
        const label = document.getElementById(`step-label-${index}`);
        if (index === step) label.setAttribute('aria-current', 'step');
        else label.removeAttribute('aria-current');
    }
    const heading = document.getElementById(['', 'cart-heading', 'address-heading', 'payment-heading'][step]);
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ block: 'center', behavior: 'instant' });
}
function renderCheckoutCart() {
    const container = document.getElementById('checkout-items');
    container.replaceChildren();
    document.getElementById('checkout-empty').hidden = cart.length > 0 || busy;
    confirmCart.disabled = busy || !cart.length;
    for (const product of cart) {
        const row = document.createElement('article');
        row.className = 'checkout-item';
        const image = document.createElement('img');
        image.src = product.img;
        image.alt = product.productName;
        const info = document.createElement('div');
        const title = document.createElement('h3');
        title.textContent = product.productName;
        const price = document.createElement('p');
        price.textContent = `${formatPrice(product.price)} por unidad / ${formatPrice(product.price * product.quanty)}`;
        info.append(title, price);
        const controls = document.createElement('div');
        controls.className = 'checkout-quantity';
        const quantity = document.createElement('span');
        quantity.textContent = product.quanty;
        for (const [label, delta] of [['-', -1], ['+', 1], ['Quitar', null]]) {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = label;
            button.disabled = busy || (delta === 1 && product.quanty >= 99);
            button.setAttribute('aria-label', `${label === '-' ? 'Reducir cantidad de' : label === '+' ? 'Aumentar cantidad de' : 'Quitar'} ${product.productName}`);
            button.addEventListener('click', async () => {
                lockCheckout(true);
                checkoutStatus.textContent = 'Actualizando carrito...';
                try { await CartStore.change(product, delta); checkoutStatus.textContent = 'Carrito actualizado.'; }
                catch (error) { onCartError(error.message); }
                finally { lockCheckout(false); }
            });
            controls.append(button);
            if (delta === -1) controls.append(quantity);
        }
        row.append(image, info, controls);
        container.append(row);
    }
    document.getElementById('checkout-cart-total').textContent = formatPrice(cart.reduce((sum, p) => sum + p.price * p.quanty, 0));
}
async function postCheckout(url, body) {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'No se pudo continuar. Intenta nuevamente.');
    return data;
}
confirmCart.addEventListener('click', async () => {
    if (busy) return;
    lockCheckout(true);
    checkoutStatus.textContent = 'Verificando productos y precios...';
    try {
        await CartStore.flush();
        review = await postCheckout('/api/checkout/review', { items: cart.map(p => ({ id: p.id, quantity: p.quanty })) });
        checkoutStatus.textContent = 'Productos confirmados. Completa tu direccion.';
        showStep(2);
    } catch (error) { onCartError(error.message); }
    finally { lockCheckout(false); }
});
addressForm.addEventListener('submit', event => {
    event.preventDefault();
    if (busy || !review || !addressForm.reportValidity()) return;
    shipping = Object.fromEntries([...new FormData(addressForm)].map(([key, value]) => [key, value.trim()]));
    if (!/^\d{1,8}$/.test(shipping.number) || Number(shipping.number) < 1 ||
        shipping.phone.replace(/\D/g, '').length < 8 || !/^[+\d\s()-]+$/.test(shipping.phone) ||
        !/^[a-zA-Z0-9 -]{3,12}$/.test(shipping.postalCode)) {
        onCartError('Revisa el telefono, la altura y el codigo postal antes de continuar.');
        return;
    }
    const list = document.getElementById('checkout-payment-items');
    list.replaceChildren();
    for (const product of review.items) {
        const item = document.createElement('li');
        item.textContent = `${product.quanty} x ${product.productName} - ${formatPrice(product.price * product.quanty)}`;
        list.append(item);
    }
    document.getElementById('checkout-payment-total').textContent = formatPrice(review.total);
    document.getElementById('checkout-delivery').textContent = [shipping.name, shipping.email, shipping.phone,
        `${shipping.street} ${shipping.number}${shipping.floor ? ', piso ' + shipping.floor : ''}${shipping.apartment ? ', departamento ' + shipping.apartment : ''}`,
        `${shipping.city}, ${shipping.province}, CP ${shipping.postalCode}`, 'Argentina'].join('\n');
    checkoutStatus.textContent = 'Direccion confirmada. Revisa el resumen antes de pagar.';
    showStep(3);
});
document.querySelectorAll('[data-back]').forEach(button => button.addEventListener('click', () => {
    if (busy) return;
    checkoutStatus.textContent = '';
    showStep(Number(button.dataset.back));
}));
payOrder.addEventListener('click', async () => {
    if (busy || currentStep !== 3 || !review || !shipping) return;
    lockCheckout(true);
    checkoutStatus.textContent = 'Preparando tu pago en Mercado Pago...';
    try {
        const preference = await postCheckout('/create_preference', {
            items: review.items.map(p => ({ id: p.id, quantity: p.quanty })), shipping, expectedTotal: review.total,
        });
        location.assign(preference.init_point);
    } catch (error) { onCartError(error.message); lockCheckout(false); }
});
document.getElementById('checkout-reload').addEventListener('click', () => location.reload());
CartStore.ready.then(async user => {
    await CartStore.flush();
    if (user) {
        addressForm.elements.name.value = user.name || '';
        addressForm.elements.email.value = user.email || '';
    }
    lockCheckout(false);
    checkoutStatus.textContent = '';
}).catch(error => {
    onCartError(error.message);
    document.getElementById('checkout-reload').hidden = false;
});
