function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart(productId) {
  let cart = getCart();
  const item = cart.find(i => i.productId === productId);

  if (item) {
    item.quantity += 1;
  } else {
    cart.push({ productId, quantity: 1 });
  }

  saveCart(cart);
  alert("Added to cart");
}

/* ---------- CART PAGE ---------- */

async function loadCart() {
  const cart = getCart();
  const container = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");

  if (!container) return;

  container.innerHTML = "";
  let total = 0;

  for (let item of cart) {
    const res = await fetch(`http://localhost:5000/api/products/${item.productId}`);
    const product = await res.json();

    total += product.price * item.quantity;

    const div = document.createElement("div");
    div.style.background = "var(--bg-surface)";
    div.style.padding = "16px";
    div.style.marginBottom = "12px";
    div.style.display = "grid";
    div.style.gridTemplateColumns = "1fr 100px 40px";
    div.style.gap = "16px";

    div.innerHTML = `
      <div>
        <h4>${product.name}</h4>
        <p>${product.scale} · ${product.brand}</p>
        <p>₹${product.price}</p>
      </div>

      <div>
        <button onclick="updateQty('${item.productId}', -1)">−</button>
        <span>${item.quantity}</span>
        <button onclick="updateQty('${item.productId}', 1)">+</button>
      </div>

      <span onclick="removeItem('${item.productId}')" style="cursor:pointer;">✕</span>
    `;

    container.appendChild(div);
  }

  totalEl.innerText = total;
}

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

document.addEventListener("DOMContentLoaded", loadCart);

async function checkout() {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login first");
    window.location.href = "login.html";
    return;
  }

  const cart = getCart();

  const res = await fetch("http://localhost:5000/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ items: cart })
  });

  const data = await res.json();

  if (res.ok) {
    localStorage.removeItem("cart");
    window.location.href = `invoice.html?file=${data.invoice}`;
  } else {
    alert(data.message);
  }
}

document
  .getElementById("checkoutBtn")
  ?.addEventListener("click", checkout);
