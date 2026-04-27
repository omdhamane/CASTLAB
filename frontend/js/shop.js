const API_BASE = "http://127.0.0.1:5000";

const grid = document.getElementById("productGrid");
const buttons = document.querySelectorAll(".filter-btn");

const params = new URLSearchParams(window.location.search);
const urlScale = params.get("scale");
const urlSearch = params.get("search");

/* ---------- FETCH PRODUCTS ---------- */
async function fetchProducts({ scale, search }) {
  let url;

  if (search) {
    url = `${API_BASE}/api/products/search?q=${encodeURIComponent(search)}`;
  } else if (scale) {
    url = `${API_BASE}/api/products?scale=${encodeURIComponent(scale)}`;
  } else {
    url = `${API_BASE}/api/products`;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch products");

  const data = await res.json();

  // normalize response (VERY IMPORTANT)
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.products)) return data.products;

  return [];
}

/* ---------- LOAD PRODUCTS ---------- */
async function loadProducts({ scale = null, search = null } = {}) {
  if (!grid) return;

  grid.innerHTML = "";

  const products = await fetchProducts({ scale, search });

  console.log("LOAD PRODUCTS", { scale, search });
  console.log("PRODUCTS RECEIVED", products);

  if (!Array.isArray(products) || products.length === 0) {
    grid.innerHTML = "<p style='opacity:.6'>No products found</p>";
    return;
  }

  products.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.dataset.id = product._id || product.id;


    const imageSrc =
      product.images && product.images.length
        ? product.images[0]
        : product.image || "";

    card.innerHTML = `
        <div class="product-image">
          <button class="like-btn" aria-label="Add to wishlist">
            ♥
          </button>

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

  markWishlistItems();
}

/* ---------- CART ---------- */
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

/* ---------- WISHLIST ---------- */
  function getWishlist() {
  return JSON.parse(localStorage.getItem("wishlist")) || [];
}

function saveWishlist(wishlist) {
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
}

function addToWishlist(product) {
  let wishlist = getWishlist();

  const exists = wishlist.some(item => item.id === product.id);
  if (exists) return;

  wishlist.push(product);
  saveWishlist(wishlist);
  console.log("❤️ Wishlist updated:", wishlist);
}

function removeFromWishlist(id) {
  let wishlist = getWishlist().filter(item => item.id !== id);
  saveWishlist(wishlist);
}

function markWishlistItems() {
  const wishlist = getWishlist();

  wishlist.forEach(item => {
    const card = document.querySelector(
      `.product-card[data-id="${item.id}"]`
    );
    if (!card) return;

    const btn = card.querySelector(".like-btn");
    btn.classList.add("active");
    btn.textContent = "♥";
  });
}

/* ---------- EVENTS ---------- */
  grid.addEventListener("click", e => {
  const card = e.target.closest(".product-card");
  if (!card) return;

  const productId = card.dataset.id;

  if (!productId) {
  console.error("Product ID missing", card);
  return;
  }


  // ❤️ WISHLIST
  if (e.target.classList.contains("like-btn")) {
    const btn = e.target;
    const active = btn.classList.toggle("active");
    btn.textContent = active ? "♥" : "♡";

    const product = {
      id: productId,
      name: card.querySelector("h3").innerText,
      price: card.querySelector(".price").innerText.replace("₹", ""),
      image: card.querySelector("img").src
    };

    active ? addToWishlist(product) : removeFromWishlist(productId);
    return;
  }

  // 🛒 CART
  if (e.target.classList.contains("add-btn")) {
    addToCart(productId);
    return;
  }

  // 🔍 PRODUCT PAGE
  window.location.href = `product.html?id=${productId}`;
});

/* ---------- FILTER BUTTONS ---------- */
buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    buttons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    loadProducts({ scale: btn.dataset.scale });
  });
});

/* ---------- INIT ---------- */
  document.addEventListener("DOMContentLoaded", () => {
  // priority: search > scale > default
  if (urlSearch) {
    loadProducts({ search: urlSearch });
    return;
  }

  if (urlScale) {
    loadProducts({ scale: urlScale });

    buttons.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.scale === urlScale);
    });
    return;
  }

  loadProducts({ scale: "1:64" });
});
