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
    const existing = cart.find((item) => item.id === product.id);
    if (existing) existing.quanty++;
    else cart.push({ ...product, quanty: 1 });
    displayCartCounter();
    showCartToast(product.productName);
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
const renderProducts = (style = selectedStyle) => {
    const filteredProducts = style === "ALL" ? productos : productos.filter((product) => product.styles?.includes(style));
    shopContent.replaceChildren();
    document.getElementById("product-count").textContent = `${filteredProducts.length} ${filteredProducts.length === 1 ? "producto" : "productos"}${style === "ALL" ? "" : ` / ${style}`}`;
    if (!filteredProducts.length) {
        const message = document.createElement("p");
        message.textContent = "No hay prendas de este estilo por ahora.";
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
        renderProducts();
    } catch (error) {
        document.getElementById("product-count").textContent = "Catalogo no disponible";
        const message = document.createElement("p");
        message.textContent = error.message;
        const retry = document.createElement("button");
        retry.type = "button";
        retry.textContent = "Reintentar";
        retry.addEventListener("click", loadProducts);
        shopContent.replaceChildren(message, retry);
    }
}
loadProducts();
