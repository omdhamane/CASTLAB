const FALLBACK_IMAGE = "https://via.placeholder.com/400x400?text=CASTLAB";

const CATEGORY_LABELS = {
  "jdm-legends": "JDM Legends",
  motorsport: "Motorsport Collection",
  hypercars: "Hypercars",
  "muscle-cars": "Muscle Cars",
  suvs: "SUVs"
};

const grid = document.getElementById("productGrid");
const buttons = document.querySelectorAll(".filter-btn[data-scale]");
const categoryLinks = document.querySelectorAll(".category-filters a");

const params = new URLSearchParams(window.location.search);
const urlScale = params.get("scale");
const urlSearch = params.get("search");
const urlCategory = params.get("category");

const shopTitle = document.querySelector(".shop-title");
const categoryLabel = document.getElementById("shopCategoryLabel");

async function fetchProducts({ scale, search, category } = {}) {
  const qs = new URLSearchParams();
  if (scale) qs.set("scale", scale);
  if (category) qs.set("category", category);

  let url;
  if (search) {
    url = `${API_BASE}/api/products/search?q=${encodeURIComponent(search)}`;
  } else {
    url = `${API_BASE}/api/products${qs.toString() ? `?${qs}` : ""}`;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch products");

  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.products)) return data.products;
  return [];
}

function updateShopHeading({ scale, category, search }) {
  if (search) {
    if (shopTitle) shopTitle.textContent = `Results for “${search}”`;
    if (categoryLabel) categoryLabel.textContent = "";
    return;
  }

  if (category && CATEGORY_LABELS[category]) {
    if (shopTitle) shopTitle.textContent = CATEGORY_LABELS[category];
    if (categoryLabel) categoryLabel.textContent = "Collection";
    return;
  }

  if (shopTitle) shopTitle.textContent = "The Collection";
  if (categoryLabel) categoryLabel.textContent = scale ? `Scale ${scale}` : "";
}

function setActiveCategoryLink(category) {
  categoryLinks.forEach((link) => {
    const linkCat = new URL(link.href, window.location.origin).searchParams.get("category");
    link.classList.toggle("active", category && linkCat === category);
  });
}

function markWishlistItems() {
  getWishlist().forEach((item) => {
    const card = document.querySelector(`.product-card[data-id="${item.id}"]`);
    if (!card) return;
    const btn = card.querySelector(".like-btn");
    btn.classList.add("active");
    btn.textContent = "♥";
  });
}

async function loadProducts({ scale = null, search = null, category = null } = {}) {
  if (!grid) return;

  grid.innerHTML = "";
  updateShopHeading({ scale, category, search });
  setActiveCategoryLink(category);

  const products = await fetchProducts({ scale, search, category });

  if (!Array.isArray(products) || products.length === 0) {
    grid.innerHTML = "<p style='opacity:.6;text-align:center'>No products found</p>";
    return;
  }

  products.forEach((product) => {
    const id = product._id || product.id;
    const oos = isOutOfStock(product);
    const imageSrc =
      product.image && product.image.trim() !== ""
        ? product.image
        : FALLBACK_IMAGE;

    const card = document.createElement("div");
    card.className = `product-card${oos ? " out-of-stock" : ""}`;
    card.dataset.id = id;
    card.dataset.stock = String(product.stock ?? 0);

    card.innerHTML = `
      <div class="product-stage">
        ${oos ? '<span class="stock-label">Out of Stock</span>' : ""}
        <button class="like-btn btn-ripple" type="button" aria-label="Add to wishlist">♡</button>
        <img src="${imageSrc}" alt="${product.name}"
          onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'" />
      </div>
      <div class="product-info">
        <h3>${product.name}</h3>
        <p class="subtitle">${product.brand}</p>
        <div class="price-row">
          <span class="price">₹${product.price}</span>
          <button class="add-btn btn-ripple" type="button" ${oos ? "disabled" : ""}>+</button>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  markWishlistItems();
}

grid.addEventListener("click", (e) => {
  const card = e.target.closest(".product-card");
  if (!card) return;

  const productId = card.dataset.id;
  if (!productId) return;

  if (e.target.classList.contains("like-btn")) {
    e.stopPropagation();
    const btn = e.target;
    const active = btn.classList.toggle("active");
    btn.textContent = active ? "♥" : "♡";

    const product = {
      id: productId,
      name: card.querySelector("h3").innerText,
      price: card.querySelector(".price").innerText.replace("₹", ""),
      image: card.querySelector("img").src
    };

    if (active) {
      const list = getWishlist();
      if (!list.some((i) => i.id === productId)) {
        list.push(product);
        saveWishlist(list);
      }
    } else {
      saveWishlist(getWishlist().filter((i) => i.id !== productId));
    }
    return;
  }

  if (e.target.classList.contains("add-btn")) {
    e.stopPropagation();
    if (card.classList.contains("out-of-stock")) return;

    e.target.classList.add("pulse");
    setTimeout(() => e.target.classList.remove("pulse"), 350);
    addToCartById(productId);
    showAddedFeedback();
    return;
  }

  window.location.href = `product.html?id=${productId}`;
});

buttons.forEach((btn) => {
  btn.addEventListener("click", () => {
    buttons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const scale = btn.dataset.scale;
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete("category");
    newUrl.searchParams.set("scale", scale);
    window.history.replaceState({}, "", newUrl);

    loadProducts({ scale });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  if (urlSearch) {
    loadProducts({ search: urlSearch });
    return;
  }

  if (urlCategory) {
    loadProducts({ category: urlCategory, scale: urlScale || null });
    if (urlScale) {
      buttons.forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.scale === urlScale);
      });
    }
    return;
  }

  if (urlScale) {
    loadProducts({ scale: urlScale });
    buttons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.scale === urlScale);
    });
    return;
  }

  loadProducts();
});

function showAddedFeedback() {
  const toast = document.createElement("div");
  toast.className = "cart-toast";
  toast.textContent = "✅ Added to Cart";
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}
