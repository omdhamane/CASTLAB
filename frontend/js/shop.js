const API_BASE = "http://127.0.0.1:5000";

const grid = document.getElementById("productGrid");
const buttons = document.querySelectorAll(".filter-btn");

/* ---------- FETCH PRODUCTS ---------- */

async function fetchProducts(scale) {
  const res = await fetch(`${API_BASE}/api/products?scale=${scale}`);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

/* ---------- LOAD PRODUCTS ---------- */

async function loadProducts(scale = "1:64") {
  if (!grid) return;

  grid.innerHTML = "";

  const products = await fetchProducts(scale);

  if (!products.length) {
    grid.innerHTML = "<p style='opacity:.6'>No products found</p>";
    return;
  }

  products.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.dataset.id = product._id;

    // ✅ FIX: decide image FIRST
    const imageSrc =
      product.images && product.images.length
        ? product.images[0]
        : product.image || "";

    // ✅ HTML ONLY inside template string
    card.innerHTML = `
      <button class="like-btn">♡</button>

      <div class="product-image">
        <img src="${imageSrc}" alt="${product.name}">
      </div>

      <div class="product-info">
        <h3>${product.name}</h3>
        <p class="subtitle">${product.brand}</p>

        <div class="price-row">
          <span class="price">₹${product.price}</span>
          <button class="add-btn">+</button>
        </div>
      </div>
    `;
 
    grid.appendChild(card);
  });
}


/* ---------- CART (CORRECT FORMAT) ---------- */

function addToCart(productId) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  const existing = cart.find(item => item.productId === productId);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ productId, quantity: 1 });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  console.log("🛒 Cart updated:", cart);
}

/* ---------- EVENTS ---------- */

grid.addEventListener("click", e => {
  const card = e.target.closest(".product-card");
  if (!card) return;

  const productId = card.dataset.id;

  // LIKE
  if (e.target.classList.contains("like-btn")) {
    e.target.classList.toggle("active");
    e.target.textContent =
      e.target.classList.contains("active") ? "♥" : "♡";
    return;
  }

  // ADD TO CART
  if (e.target.classList.contains("add-btn")) {
    addToCart(productId);
    return;
  }

  // OPEN PRODUCT PAGE (default click)
  window.location.href = `product.html?id=${productId}`;
});


/* ---------- FILTERS ---------- */

buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    buttons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    loadProducts(btn.dataset.scale);
  });
});

/* ---------- INIT ---------- */

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
});
