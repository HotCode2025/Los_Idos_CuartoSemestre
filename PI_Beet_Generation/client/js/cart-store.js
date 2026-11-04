// All cart edits and account changes share a queue: a late save cannot cross logout/login.
const CartStore = (() => {
    const guestKey = 'beet-guest-cart-v1';
    let user = null;
    let initialized = false;
    let tail = Promise.resolve();
    const notify = (message) => {
        if (typeof onCartError === 'function') { onCartError(message); return; }
        clearTimeout(cartToastTimer);
        cartToastMessage.textContent = message;
        cartToast.classList.add('is-visible');
    };
    const enqueue = (operation) => {
        const result = tail.then(operation);
        tail = result.catch((error) => notify(error.message));
        return result;
    };
    const request = async (path, options) => {
        const response = await fetch(path, options);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'No se pudo guardar el carrito. Reintenta.');
        return data;
    };
    const json = (method, body) => ({ method, keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const itemsOf = (items) => items.map((item) => ({ id: item.id, quantity: item.quanty }));
    const replace = (items) => {
        cart.splice(0, cart.length, ...items);
        if (typeof displayCartCounter === 'function') displayCartCounter();
        if (typeof modalContainer !== 'undefined' && modalContainer.style.display === 'block') displayCart();
        if (typeof onCartUpdated === 'function') onCartUpdated();
    };
    const readGuest = () => {
        const saved = JSON.parse(localStorage.getItem(guestKey) || 'null');
        if (!saved) return { mergeId: crypto.randomUUID(), items: [] };
        if (!Array.isArray(saved.items) || !/^[a-f0-9-]{36}$/i.test(saved.mergeId)) throw new Error('No se pudo leer el carrito de este navegador.');
        return saved;
    };
    const guestProducts = (guest) => guest.items.flatMap((item) => {
        const product = productos.find((p) => p.id === item.id);
        return product && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 99
            ? [{ ...product, quanty: item.quantity }] : [];
    });
    const loadAccount = async () => {
        initialized = false;
        if (user) {
            const guest = readGuest();
            // Prices, names and images always come from PostgreSQL for authenticated carts.
            const data = guest.items.length
                ? await request('/api/cart/merge', json('POST', guest))
                : await request('/api/cart');
            localStorage.removeItem(guestKey);
            replace(data.items);
        } else replace(guestProducts(readGuest()));
        initialized = true;
    };
    const initialize = async () => {
        await catalogReady;
        const data = await request('/api/auth/me');
        user = data.user || null;
        await loadAccount();
        return user;
    };
    const ready = enqueue(async () => {
        try { return await initialize(); }
        catch (error) { notify(error.message); return user; }
    });
    const change = (product, delta) => enqueue(async () => {
        if (!initialized) await initialize();
        const next = cart.map((item) => ({ ...item }));
        const existing = next.find((item) => item.id === product.id);
        const quantity = delta === null ? 0 : Math.max(0, (existing?.quanty || 0) + delta);
        if (quantity > 99) throw new Error('El maximo es 99 unidades por producto.');
        if (quantity <= 0) {
            if (existing) next.splice(next.findIndex((item) => item.id === product.id), 1);
        }
        else if (existing) existing.quanty = quantity;
        else next.push({ ...product, quanty: quantity });
        if (user) {
            const data = await request('/api/cart', json('PUT', { items: itemsOf(next) }));
            replace(data.items);
        } else {
            localStorage.setItem(guestKey, JSON.stringify({ mergeId: crypto.randomUUID(), items: itemsOf(next) }));
            replace(next);
        }
    });
    const authenticate = (operation) => enqueue(async () => {
        await catalogReady;
        const data = await operation();
        user = data.user || null;
        initialized = false;
        replace([]);
        // Login may succeed while cart loading fails. Keep the account state accurate,
        // show the error, and retry synchronization before accepting the next edit.
        try { await loadAccount(); } catch (error) { notify(error.message); }
        return data;
    });
    const flush = () => enqueue(async () => {
        if (!initialized) await initialize();
        return cart;
    });
    return { ready, change, authenticate, flush };
})();
