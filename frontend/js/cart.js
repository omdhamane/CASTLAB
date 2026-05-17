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

  // Show Modal
  const modal = document.getElementById("checkoutModal");
  if (modal) {
    modal.classList.remove("hidden");
    
    // Fetch profile to prefill
    try {
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const user = await res.json();
        document.getElementById("chkPhone").value = user.phone || "";
        document.getElementById("chkAddress").value = user.address || "";
        document.getElementById("chkCity").value = user.city || "";
        document.getElementById("chkState").value = user.state || "";
        document.getElementById("chkZip").value = user.zipCode || "";
        document.getElementById("chkCountry").value = user.country || "";
      }
    } catch (e) {
      console.error("Failed to load profile for checkout");
    }
  }
}

async function submitOrder(e) {
  e.preventDefault();
  
  const token = localStorage.getItem("token");
  const cart = getCart();
  const btn = document.getElementById("confirmOrderBtn");
  
  btn.disabled = true;
  btn.textContent = "Processing...";

  const orderData = {
    items: cart.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity)
    })),
    contactNumber: document.getElementById("chkPhone").value,
    shippingAddress: {
      address: document.getElementById("chkAddress").value,
      city: document.getElementById("chkCity").value,
      state: document.getElementById("chkState").value,
      zipCode: document.getElementById("chkZip").value,
      country: document.getElementById("chkCountry").value,
    }
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
  } finally {
    btn.disabled = false;
    btn.textContent = "Place Order";
    document.getElementById("checkoutModal")?.classList.add("hidden");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadCart();
  document.getElementById("checkoutBtn")?.addEventListener("click", checkout);
  document.getElementById("closeModalBtn")?.addEventListener("click", () => {
    document.getElementById("checkoutModal")?.classList.add("hidden");
  });
  document.getElementById("checkoutForm")?.addEventListener("submit", submitOrder);
});
