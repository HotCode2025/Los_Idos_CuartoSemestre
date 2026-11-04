const modalContainer = document.getElementById("modal-container");
const modalOverlay = document.getElementById("modal-overlay");
const cartBtn = document.getElementById("cart-btn");
const cartCounter = document.getElementById("cart-counter");

let walletController;
let cartRevision = 0;

const displayCart = () => {
    const revision = ++cartRevision;
    if (walletController) {
        walletController.unmount();
        walletController = null;
    }
    modalContainer.innerHTML = "";
    modalContainer.style.display = "block";
    modalOverlay.style.display = "block";
    //Modal Header
    const modalHeader = document.createElement("div");

    const modalClose = document.createElement("div");
    modalClose.innerText = "❌";
    modalClose.className = "modal-close";
    modalHeader.append(modalClose);

    modalClose.addEventListener("click", () => {
        modalContainer.style.display = "none";
        modalOverlay.style.display = "none";
    });

    const modalTitle = document.createElement("div");
    modalTitle.innerText = "Carrito";
    modalTitle.className = "modal-title";
    modalHeader.append(modalTitle);

    modalContainer.append(modalHeader);

    //Modal Body
    if (cart.length > 0){
        cart.forEach((product) => {
            const modalBody = document.createElement("div");
            modalBody.className = "modal-body";
            modalBody.innerHTML = `
            <div class="product">
                <img class="product-img" src="${product.img}" />
                <div class="product-info">
                    <h4>${product.productName}</h4>
                </div>
                <div class="quantity">
                    <span class="quantity-btn-decrease">-</span>
                    <span class="quantity-input">${product.quanty}</span>
                    <span class="quantity-btn-increase">+</span>
                </div>
                <div class="price">${product.price * product.quanty} $</div>
                <div class="delete-product">❌</div>
            </div>
            `;
            modalContainer.append(modalBody);

            const decrease = modalBody.querySelector(".quantity-btn-decrease");
            decrease.addEventListener("click", () => {
                if (product.quanty !== 1) {
                    product.quanty--;
                    displayCart();
                    displayCartCounter();
                }
            });

            const increase = modalBody.querySelector(".quantity-btn-increase");
            increase.addEventListener("click", () => {
                product.quanty++;
                displayCart();
                displayCartCounter();
            });

            const deleteProduct = modalBody.querySelector(".delete-product");
            deleteProduct.addEventListener("click", () => {
                deleteCartProduct(product.id);
            });    
        });

        //Modal Footer
        const total = cart.reduce((acc, el) => acc + el.price * el.quanty, 0);
        const modalFooter = document.createElement("div");
        modalFooter.className = "modal-footer";
        modalFooter.innerHTML = 
            `<div class="total-price">Total: ${total}</div>
            <button class="btn-primary" id="checkout-btn"> Continuar al Pago</button>
            <div id="button-checkout"></div>
            `;
        modalContainer.append(modalFooter);       
        const checkoutButton = modalFooter.querySelector("#checkout-btn");
        const checkoutMessage = document.createElement("p");
        checkoutMessage.setAttribute("role", "status");
        modalFooter.append(checkoutMessage);

        checkoutButton.addEventListener("click", async () => {
            if (walletController) {
                walletController.unmount();
                walletController = null;
            }
            checkoutButton.disabled = true;
            checkoutMessage.innerText = "Preparando el pago...";
            try {
                const configResponse = await fetch("/config");
                if (!configResponse.ok) throw new Error("No se pudo cargar la configuracion de pago.");
                const config = await configResponse.json();
                if (!config.publicKey) throw new Error("Falta configurar MP_PUBLIC_KEY en server/.env.");
                if (typeof MercadoPago === "undefined") {
                    throw new Error("No se pudo cargar Mercado Pago. Revisa tu conexion y reintenta.");
                }
                const response = await fetch("/create_preference", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ quantity: 1, description: "Compra de ecommerce", price: total }),
                });
                const preference = await response.json();
                if (!response.ok) throw new Error(preference.error || "No se pudo iniciar el pago.");
                if (revision !== cartRevision) return;
                const mercadopago = new MercadoPago(config.publicKey, { locale: "es-AR" });
                const controller = await mercadopago.bricks().create("wallet", "button-checkout", {
                    initialization: { preferenceId: preference.id },
                    callbacks: {
                        onError: () => {
                            checkoutMessage.innerText = "Mercado Pago no pudo cargar el pago. Reintenta.";
                            checkoutButton.disabled = false;
                            checkoutButton.style.display = "";
                        },
                        onReady: () => { checkoutMessage.innerText = ""; },
                    },
                });
                if (revision !== cartRevision) { controller.unmount(); return; }
                walletController = controller;
                checkoutButton.style.display = "none";
            } catch (error) {
                if (revision !== cartRevision) return;
                checkoutMessage.innerText = error.message;
                checkoutButton.disabled = false;
            }
        });
    } else {
        const modalText = document.createElement("h2");
        modalText.className= "modal-body";
        modalText.innerText = "Tu carrito está vacío.";
        modalContainer.append(modalText);
    }
};

cartBtn.addEventListener("click", displayCart);
const deleteCartProduct = (id) => {
    const foundId = cart.findIndex((element) => element.id === id);
    cart.splice(foundId, 1);
    displayCart();
    displayCartCounter();
};

const displayCartCounter = () =>{
    const cartLength = cart.reduce((acc, el) => acc + el.quanty, 0);
    if(cartLength > 0){
        cartCounter.style.display = "block";
        cartCounter.innerText = cartLength;
    }else{
        cartCounter.style.display = "none";
    }
}