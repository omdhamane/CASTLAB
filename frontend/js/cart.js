async function loadCart() {
  const cart = getCart();
  const container = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");

  if (!container) return;

  container.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    container.innerHTML = "<p>Your cart is empty</p>";
    if (totalEl) totalEl.textContent = "0";
    return;
  }

  for (const item of cart) {
    try {
      const res = await fetch(`${API_BASE}/api/products/${item.productId}`);
      if (!res.ok) continue;

      const product = await res.json();
      if (!product || !product.price) continue;

      const oos = isOutOfStock(product);
      const itemTotal = Number(product.price) * Number(item.quantity);
      total += itemTotal;

      const div = document.createElement("div");
      div.className = `cart-item${oos ? " out-of-stock" : ""}`;

      div.innerHTML = `
        <div class="cart-info">
          <h4>${product.name}</h4>
          <p>${product.scale} · ${product.brand}</p>
          <p class="price">₹${product.price}</p>
          ${oos ? '<span class="stock-label">Out of Stock</span>' : ""}
        </div>
        <div class="cart-qty">
          <button type="button" onclick="updateQty('${item.productId}', -1)">−</button>
          <span>${item.quantity}</span>
          <button type="button" onclick="updateQty('${item.productId}', 1)" ${oos ? "disabled" : ""}>+</button>
        </div>
        <button type="button" class="remove-btn" onclick="removeItem('${item.productId}')">✕</button>
      `;

      container.appendChild(div);
    } catch (err) {
      console.error("Cart load error:", err);
    }
  }

  if (totalEl) totalEl.textContent = total.toFixed(2);
}

function updateQty(productId, change) {
  let cart = getCart();
  const item = cart.find((i) => i.productId === productId);
  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    cart = cart.filter((i) => i.productId !== productId);
  }

  saveCart(cart);
  loadCart();
}

function removeItem(productId) {
  saveCart(getCart().filter((i) => i.productId !== productId));
  loadCart();
}

async function checkout() {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login first");
    window.location.href = "login.html";
    return;
  }

  const cart = getCart();

  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }

  const orderData = {
    items: cart.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity)
    }))
  };

  try {
    const res = await fetch(`${API_BASE}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.removeItem("cart");
      updateCartBadge();
      alert("Order placed successfully ✅");
      if (data.invoice) {
        window.location.href = `invoice.html?file=${encodeURIComponent(data.invoice)}`;
      } else {
        window.location.href = "orders.html";
      }
    } else {
      alert(data.errors ? data.errors.join("\n") : data.message);
    }
  } catch (err) {
    console.error("Checkout error:", err);
    alert("Checkout failed");
  }
}

document.addEventListener("DOMContentLoaded", loadCart);
document.getElementById("checkoutBtn")?.addEventListener("click", checkout);
