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
        CartStore.change(product, -1).catch(() => {});
      });

      const increase = modalBody.querySelector(".quantity-btn-increase");
      increase.addEventListener("click", () => {
        CartStore.change(product, 1).catch(() => {});
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

    checkoutButton.addEventListener("click", async () => {
      checkoutButton.disabled = true;
      try {
        await CartStore.flush();
        location.assign("/checkout");
      } catch (error) {
        checkoutButton.disabled = false;
        alert(error.message || "No se pudo abrir el checkout.");
      }
    });
  } else {
    const modalText = document.createElement("h2");
    modalText.className = "modal-body";
    modalText.innerText = "Tu carrito está vacío.";
    modalContainer.append(modalText);
  }
};

cartBtn.addEventListener("click", displayCart);
const deleteCartProduct = (id) => {
  const product = cart.find((item) => item.id === id);
  if (product) CartStore.change(product, null).catch(() => {});
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
