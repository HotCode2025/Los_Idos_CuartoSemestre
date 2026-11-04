const cart = [];
const catalogReady = (async () => {
    const response = await fetch('/api/products');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'No se pudo cargar el catalogo.');
    productos = data;
})();
