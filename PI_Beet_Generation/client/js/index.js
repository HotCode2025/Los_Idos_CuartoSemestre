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

const renderProducts = (style = "ALL") => {
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
    detailButton.innerHTML = `
        <img src="${product.img}" alt="${product.productName}">
        <h3>${product.productName}</h3>
        <span class="product-details-label">Ver detalles</span>
    `;
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
        renderProducts(button.dataset.style);
        document.getElementById("marketplace").scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
    });
});
renderProducts();
