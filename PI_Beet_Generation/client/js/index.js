const shopContent = document.getElementById("shopContent");
const cart = []; // Este es nuestro carrito, un array vacío.

const cartToast = document.getElementById("cart-toast");
const cartToastMessage = document.getElementById("cart-toast-message");
let cartToastTimer;

const hideCartToast = () => {
    clearTimeout(cartToastTimer);
    cartToast.classList.remove("is-visible");
};

const showCartToast = (productName) => {
    clearTimeout(cartToastTimer);
    cartToastMessage.textContent = `${productName} se agregó al carrito.`;
    cartToast.classList.add("is-visible");
    cartToastTimer = setTimeout(hideCartToast, 3500);
};

document.getElementById("cart-toast-close").addEventListener("click", hideCartToast);

// Back from Mercado Pago: it appends the payment result to the home URL.
const paymentParams = new URLSearchParams(location.search);
if (paymentParams.has("collection_status") || paymentParams.has("payment_id")) {
    const paymentMessages = {
        approved: "¡Pago aprobado! Gracias por tu compra.",
        pending: "Tu pago quedó pendiente. Se acreditará en breve.",
        in_process: "Tu pago está en proceso. Se acreditará en breve.",
        rejected: "El pago fue rechazado. Probá con otro medio de pago.",
    };
    const status = paymentParams.get("collection_status") || paymentParams.get("status");
    cartToastMessage.textContent = paymentMessages[status] || "No se completó el pago. Podés intentarlo de nuevo.";
    cartToast.classList.add("is-visible");
    cartToastTimer = setTimeout(hideCartToast, 8000);
    history.replaceState(null, "", "/");
}

const addToCart = (product) => {
    CartStore.change(product, 1)
        .then(() => showCartToast(product.productName))
        .catch(() => {});
};

const productDialog = document.getElementById("product-dialog");
const detailImage = document.getElementById("detail-image");
const detailTitle = document.getElementById("detail-title");
const detailDescription = document.getElementById("detail-description");
const detailPrice = document.getElementById("detail-price");
const detailAdd = document.getElementById("detail-add");
let selectedProduct;

const showProduct = (product) => {
    selectedProduct = product;
    detailImage.src = product.img;
    detailImage.alt = product.productName;
    detailTitle.textContent = product.productName;
    detailDescription.textContent = product.description || "Pronto agregaremos mas informacion de este producto.";
    detailPrice.textContent = formatPrice(product.price);
    productDialog.showModal();
};

document.getElementById("detail-close").addEventListener("click", () => productDialog.close());
productDialog.addEventListener("click", (event) => {
    const bounds = productDialog.getBoundingClientRect();
    if (event.target === productDialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) productDialog.close();
});
detailAdd.addEventListener("click", () => {
    addToCart(selectedProduct);
    productDialog.close();
});

let selectedStyle = "ALL";
let catalogAvailable = false;
let appliedSearch = "";
let selectedDepartment = "all";
let selectedSubcategory = "";
const catalogSearch = document.getElementById("catalog-search");
const catalogCategory = document.getElementById("catalog-category");
const catalogPriceOrder = document.getElementById("catalog-price-order");
const normalizeSearch = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").trim();
const renderProducts = (style = selectedStyle) => {
    if (!catalogAvailable) return;
    const terms = normalizeSearch(appliedSearch).split(/\s+/).filter(Boolean);
    const filteredProducts = productos.filter((product) => {
        const text = normalizeSearch(`${product.productName} ${product.description || ""}`);
        return (style === "ALL" || product.styles?.includes(style)) &&
            (catalogCategory.value === "all" || product.category === catalogCategory.value ||
                (["mujer", "hombre"].includes(catalogCategory.value) && product.category === "unisex")) &&
            (selectedDepartment === "all" || product.department === selectedDepartment) &&
            (!selectedSubcategory || product.subcategory === selectedSubcategory) &&
            terms.every(term => text.includes(term));
    });
    if (catalogPriceOrder.value === "asc") filteredProducts.sort((a, b) => a.price - b.price);
    if (catalogPriceOrder.value === "desc") filteredProducts.sort((a, b) => b.price - a.price);
    shopContent.replaceChildren();
    document.getElementById("product-count").textContent = `${filteredProducts.length} ${filteredProducts.length === 1 ? "producto" : "productos"}${style === "ALL" ? "" : ` / ${style}`}`;
    if (!filteredProducts.length) {
        const message = document.createElement("p");
        message.textContent = "No se encontraron productos con esta busqueda y los filtros seleccionados.";
        shopContent.append(message);
    }
    filteredProducts.forEach((product) => {
    const content = document.createElement("div");
    content.className = "card";
    const detailButton = document.createElement("button");
    detailButton.type = "button";
    detailButton.className = "product-details-trigger";
    detailButton.setAttribute("aria-label", `Ver detalles de ${product.productName}`);
    const image = document.createElement("img");
    image.src = product.img;
    image.alt = product.productName;
    const title = document.createElement("h3");
    title.textContent = product.productName;
    const label = document.createElement("span");
    label.className = "product-details-label";
    label.textContent = "Ver detalles";
    detailButton.append(image, title, label);
    detailButton.addEventListener("click", () => showProduct(product));
    const price = document.createElement("p");
    price.textContent = formatPrice(product.price);
    const buyButton = document.createElement("button");
    buyButton.type = "button";
    buyButton.innerText = "Comprar";
    buyButton.addEventListener("click", () => addToCart(product));
    content.append(detailButton, price, buyButton);
    shopContent.append(content);
});

};

const subnav = document.getElementById("shop-subnav");
const storeHeader = document.querySelector('.site-header');
const storeSubnav = subnav.closest('.shop-subnav');
const updateStickyNavigation = () => {
    const headerHeight = Math.ceil(storeHeader.getBoundingClientRect().height);
    const subnavHeight = Math.ceil(storeSubnav.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--store-header-height', `${headerHeight}px`);
    document.documentElement.style.setProperty('--catalog-anchor-offset', `${headerHeight + subnavHeight + 16}px`);
};
const stickyNavigationObserver = new ResizeObserver(updateStickyNavigation);
stickyNavigationObserver.observe(storeHeader);
stickyNavigationObserver.observe(storeSubnav);
updateStickyNavigation();

const familySummary = document.getElementById("catalog-family-summary");
const menuDetails = [];
function selectProductFamily(department, subcategory = '') {
    selectedDepartment = department;
    selectedSubcategory = subcategory;
    menuDetails.forEach(details => { details.open = false; });
    familySummary.hidden = department === 'all';
    const family = CatalogTaxonomy[department];
    document.getElementById('catalog-family-text').textContent = family
        ? `${family.label}${subcategory ? ' / ' + family.items[subcategory] : ''}` : '';
    subnav.querySelectorAll('[data-department]').forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.department === department && (button.dataset.subcategory || '') === subcategory));
    });
    renderProducts();
    document.getElementById('marketplace').scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start',
    });
}
function familyButton(label, department, subcategory = '') {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.dataset.department = department;
    button.dataset.subcategory = subcategory;
    button.setAttribute('aria-pressed', String(department === selectedDepartment && subcategory === selectedSubcategory));
    button.addEventListener('click', () => selectProductFamily(department, subcategory));
    return button;
}
function renderSubnav() {
    const available = availableCatalogFamilies(productos, CatalogTaxonomy);
    subnav.replaceChildren();
    menuDetails.length = 0;
    if (selectedDepartment !== 'all' && (!available[selectedDepartment] ||
        (selectedSubcategory && !Object.hasOwn(available[selectedDepartment].items, selectedSubcategory)))) {
        selectedDepartment = 'all';
        selectedSubcategory = '';
        familySummary.hidden = true;
    }
subnav.append(familyButton('Ver todo', 'all'));
for (const [department, family] of Object.entries(available)) {
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = family.label;
    const panel = document.createElement('div');
    panel.className = 'shop-submenu';
    panel.append(familyButton(`Ver todo ${family.label.toLowerCase()}`, department));
    for (const [key, label] of Object.entries(family.items)) panel.append(familyButton(label, department, key));
    details.append(summary, panel);
    details.addEventListener('toggle', () => {
        if (details.open) menuDetails.forEach(other => { if (other !== details) other.open = false; });
    });
    details.addEventListener('keydown', event => {
        if (event.key === 'Escape') { details.open = false; summary.focus({ preventScroll: true }); }
    });
    menuDetails.push(details);
    subnav.append(details);
}
    updateStickyNavigation();
}

document.addEventListener('click', event => {
    if (!subnav.contains(event.target)) menuDetails.forEach(details => { details.open = false; });
});
document.getElementById('catalog-family-clear').addEventListener('click', () => selectProductFamily('all'));

const searchSummary = document.getElementById("catalog-search-summary");
const updateSearchSummary = () => {
    searchSummary.hidden = !appliedSearch;
    document.getElementById("catalog-search-summary-text").textContent = appliedSearch
        ? `Resultados para: "${appliedSearch}"` : "";
};
document.getElementById("catalog-search-clear").addEventListener("click", () => {
    appliedSearch = "";
    updateSearchSummary();
    renderProducts();
    catalogSearch.focus({ preventScroll: true });
});
catalogPriceOrder.addEventListener("change", () => renderProducts());
catalogCategory.addEventListener("change", () => {
    renderProducts();
    document.getElementById("marketplace").scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start",
    });
});
document.getElementById("product-search-form").addEventListener("submit", (event) => {
    event.preventDefault();
    appliedSearch = catalogSearch.value.trim().replace(/\s+/g, " ");
    catalogSearch.value = "";
    updateSearchSummary();
    renderProducts();
    document.getElementById("marketplace").scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start",
    });
});

const styleButtons = document.querySelectorAll(".style-tags button[data-style]");
styleButtons.forEach((button) => {
    button.addEventListener("click", () => {
        styleButtons.forEach((option) => option.setAttribute("aria-pressed", String(option === button)));
        selectedStyle = button.dataset.style;
        renderProducts();
        document.getElementById("marketplace").scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
    });
});
async function loadProducts() {
    document.getElementById("product-count").textContent = "Cargando catalogo...";
    try {
        const response = await fetch("/api/products");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "No se pudo cargar el catalogo.");
        productos = data;
        catalogAvailable = true;
        renderSubnav();
        renderProducts();
    } catch (error) {
        document.getElementById("product-count").textContent = "Catalogo no disponible";
        const message = document.createElement("p");
        message.textContent = error.message;
        const retry = document.createElement("button");
        retry.type = "button";
        retry.textContent = "Reintentar";
        retry.addEventListener("click", () => location.reload());
        shopContent.replaceChildren(message, retry);
        throw error;
    }
}
const catalogReady = loadProducts();
