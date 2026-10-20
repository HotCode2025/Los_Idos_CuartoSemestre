const modalContainer = document.getElementById("modal-container");
const modalOverlay = document.getElementById("modal-overlay");
const cartBtn = document.getElementById("cart-btn");
const cartCounter = document.getElementById("cart-counter");

const displayCart = () => {
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
  if (cart.length > 0) {
    cart.forEach((product) => {
      const modalBody = document.createElement("div");
      modalBody.className = "modal-body";
      modalBody.innerHTML = `
            <div class="product">
                <img class="product-img" src="${escapeHtml(product.img)}" />
                <div class="product-info">
                    <h4>${escapeHtml(product.productName)}</h4>
                </div>
                <div class="quantity">
                    <span class="quantity-btn-decrease">-</span>
                    <span class="quantity-input">${product.quanty}</span>
                    <span class="quantity-btn-increase">+</span>
                </div>
                <div class="price">${formatPrice(product.price * product.quanty)}</div>
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
    modalFooter.innerHTML = `<div class="total-price">Total: ${formatPrice(total)}</div>
            <button class="btn-primary" id="checkout-btn"> Continuar al Pago</button>
            <div id="button-checkout"></div>
            `;
    modalContainer.append(modalFooter);
    const checkoutButton = modalFooter.querySelector("#checkout-btn");

    checkoutButton.addEventListener("click", function () {
      checkoutButton.disabled = true;

      const orderData = {
        items: cart.map((product) => ({ id: product.id, quantity: product.quanty })),
      };

      fetch("/create_preference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })
        .then(async function (response) {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || `Error ${response.status} al crear la preferencia`);
          return data;
        })
        .then(function (preference) {
          return createCheckoutButton(preference.id);
        })
        .catch(function (error) {
          console.error(error);
          checkoutButton.disabled = false;
          alert(error.message || "No se pudo iniciar el pago.");
        });
    });

    async function createCheckoutButton(preferenceId) {
      const response = await fetch("/payment-config");
      const config = await response.json();
      if (!response.ok) throw new Error(config.error);
      if (typeof MercadoPago === "undefined") throw new Error("No se pudo cargar Mercado Pago. Revisa tu conexion a Internet y los bloqueadores del navegador.");
      const mercadopago = new MercadoPago(config.publicKey, { locale: "es-AR" });
      //Initialize the checkout
      const bricksBuilder = mercadopago.bricks();

      const renderComponent = async (bricksBuilder) => {
        //if (window.checkoutButton) checkoutButton.unmount();

        await bricksBuilder.create(
          "wallet",
          "button-checkout", // Class/id where the payment button will be displayed
          {
            initialization: {
              preferenceId: preferenceId,
              redirectMode: 'blank',
            },
            callbacks: {
              onError: (error) => console.error(error),
              onReady: () => {},
            },
          },
        );
      };
      await renderComponent(bricksBuilder);
      checkoutButton.remove();
    }
  } else {
    const modalText = document.createElement("h2");
    modalText.className = "modal-body";
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

const displayCartCounter = () => {
  const cartLength = cart.reduce((acc, el) => acc + el.quanty, 0);
  if (cartLength > 0) {
    cartCounter.style.display = "block";
    cartCounter.innerText = cartLength;
  } else {
    cartCounter.style.display = "none";
  }
};
