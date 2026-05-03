const API_BASE = "https://castlab-i3hm.onrender.com";

/* ---------- CART HELPERS ---------- */

function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartBadge(); // ✅ update badge instantly
}
/* ---------- LOAD CART ---------- */

async function loadCart() {
  const cart = getCart();
  const container = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");

  if (!container) return;

  container.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    container.innerHTML = "<p>Your cart is empty</p>";
    totalEl.textContent = "0";
    return;
  }

  for (const item of cart) {
    try {
      const res = await fetch(`${API_BASE}/api/products/${item.productId}`);
      if (!res.ok) continue;

      const product = await res.json();
      if (!product || !product.price) continue;

      const itemTotal = Number(product.price) * Number(item.quantity);
      total += itemTotal;

      const div = document.createElement("div");
      div.className = "cart-item";

      div.innerHTML = `
        <div class="cart-info">
          <h4>${product.name}</h4>
          <p>${product.scale} · ${product.brand}</p>
          <p class="price">₹${product.price}</p>
        </div>

        <div class="cart-qty">
          <button onclick="updateQty('${item.productId}', -1)">−</button>
          <span>${item.quantity}</span>
          <button onclick="updateQty('${item.productId}', 1)">+</button>
        </div>

        <button class="remove-btn" onclick="removeItem('${item.productId}')">✕</button>
      `;

      container.appendChild(div);
    } catch (err) {
      console.error("Cart load error:", err);
    }
  }

  totalEl.textContent = total.toFixed(2);
}

/* ---------- UPDATE QTY ---------- */

function updateQty(productId, change) {
  let cart = getCart();
  const item = cart.find(i => i.productId === productId);

  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    cart = cart.filter(i => i.productId !== productId);
  }

  saveCart(cart);
  loadCart();
}

function removeItem(productId) {
  const cart = getCart().filter(i => i.productId !== productId);
  saveCart(cart);
  loadCart();
}

/* ---------- CHECKOUT ---------- */

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

  // ✅ DEBUG: Check what cart contains
  console.log("🛒 Cart contents:", JSON.stringify(cart, null, 2));

  // ✅ FIXED: Correct payload
  const orderData = {
    items: cart.map(item => ({
      productId: item.productId,
      quantity: Number(item.quantity)
    }))
  };

  // ✅ DEBUG: Check what we are sending
  console.log("📦 Sending order:", JSON.stringify(orderData, null, 2));

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

    // ✅ DEBUG: Check response
    console.log("📬 Response:", JSON.stringify(data, null, 2));

    if (res.ok) {
      localStorage.removeItem("cart");
      alert("Order placed successfully ✅");
      window.location.href = `invoice.html?file=${encodeURIComponent(data.invoice)}`;
    } else {
      // ✅ Show detailed error
      console.error("❌ Order failed:", data);
      alert(data.errors ? data.errors.join("\n") : data.message);
    }
  } catch (err) {
    console.error("Checkout error:", err);
    alert("Checkout failed - check console");
  }
}

document.addEventListener("DOMContentLoaded", loadCart);

document
  .getElementById("checkoutBtn")
  ?.addEventListener("click", checkout);