const FALLBACK_IMAGE = "https://via.placeholder.com/400x400?text=CASTLAB";

const CATEGORY_LABELS = {
  "jdm-legends": "JDM Legends",
  motorsport: "Motorsport Collection",
  hypercars: "Hypercars",
  "muscle-cars": "Muscle Cars",
  suvs: "SUVs"
};

const VALID_SCALES = ["1:64", "1:32", "1:18"];
const VALID_CATEGORIES = ["jdm-legends", "motorsport", "hypercars", "muscle-cars", "suvs"];

const grid = document.getElementById("productGrid");
const buttons = document.querySelectorAll(".filter-btn[data-scale]");
const categoryLinks = document.querySelectorAll(".category-filters a");
const productCountLabel = document.getElementById("productCount");
const emptyState = document.getElementById("shopEmptyState");

// Filter State
let activeFilters = {
  scale: null,
  category: null,
  search: null,
  brands: [],
  minPrice: "",
  maxPrice: "",
  sort: "newest"
};

// INITIALIZE FILTER STATE FROM URL PARAMS
function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  activeFilters.scale = params.get("scale") || null;
  activeFilters.category = params.get("category") || null;
  activeFilters.search = params.get("search") || null;
  
  const brandParam = params.get("brand");
  activeFilters.brands = brandParam ? brandParam.split(",") : [];
  
  activeFilters.minPrice = params.get("minPrice") || "";
  activeFilters.maxPrice = params.get("maxPrice") || "";
  activeFilters.sort = params.get("sort") || "newest";
}

// SYNC URL PARAMS & TRIGGER FETCH
function syncUrlAndFetch() {
  const params = new URLSearchParams();
  if (activeFilters.scale) params.set("scale", activeFilters.scale);
  if (activeFilters.category) params.set("category", activeFilters.category);
  if (activeFilters.search) params.set("search", activeFilters.search);
  if (activeFilters.brands.length > 0) params.set("brand", activeFilters.brands.join(","));
  if (activeFilters.minPrice) params.set("minPrice", activeFilters.minPrice);
  if (activeFilters.maxPrice) params.set("maxPrice", activeFilters.maxPrice);
  if (activeFilters.sort !== "newest") params.set("sort", activeFilters.sort);

  const queryStr = params.toString();
  const newUrl = window.location.pathname + (queryStr ? `?${queryStr}` : "");
  window.history.replaceState({}, "", newUrl);

  loadProducts();
}

async function fetchProducts() {
  const qs = new URLSearchParams();
  if (activeFilters.scale) qs.set("scale", activeFilters.scale);
  if (activeFilters.category) qs.set("category", activeFilters.category);
  if (activeFilters.brands.length > 0) qs.set("brand", activeFilters.brands.join(","));
  if (activeFilters.minPrice) qs.set("minPrice", activeFilters.minPrice);
  if (activeFilters.maxPrice) qs.set("maxPrice", activeFilters.maxPrice);
  if (activeFilters.sort) qs.set("sort", activeFilters.sort);

  let url;
  if (activeFilters.search) {
    qs.set("q", activeFilters.search);
    url = `${API_BASE}/api/products/search?${qs.toString()}`;
  } else {
    url = `${API_BASE}/api/products?${qs.toString()}`;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch products");

  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.products)) return data.products;
  return [];
}

async function loadBrandsList() {
  const qs = new URLSearchParams();
  if (activeFilters.scale) qs.set("scale", activeFilters.scale);
  if (activeFilters.category) qs.set("category", activeFilters.category);

  try {
    const res = await fetch(`${API_BASE}/api/products/brands?${qs.toString()}`);
    if (!res.ok) throw new Error("Failed to load brands");
    const brands = await res.json();
    renderBrandFilters(brands);
  } catch (err) {
    console.error(err);
    const brandContainer = document.getElementById("brandFilters");
    if (brandContainer) {
      brandContainer.innerHTML = "<p style='color:#ef4444; font-size:0.85rem;'>Failed to load brands</p>";
    }
  }
}

function renderBrandFilters(brands) {
  const container = document.getElementById("brandFilters");
  if (!container) return;
  container.innerHTML = "";

  if (brands.length === 0) {
    container.innerHTML = "<p style='opacity:0.5; font-size:0.85rem;'>No brands available</p>";
    return;
  }

  brands.forEach(b => {
    const isChecked = activeFilters.brands.includes(b.brand);
    const label = document.createElement("label");
    label.className = `brand-filter-item ${isChecked ? "active" : ""}`;
    label.innerHTML = `
      <input type="checkbox" value="${b.brand}" ${isChecked ? "checked" : ""} />
      <span class="custom-checkbox"></span>
      <span class="brand-name">${b.brand}</span>
      <span class="count">${b.count}</span>
    `;

    label.querySelector("input").addEventListener("change", (e) => {
      if (e.target.checked) {
        activeFilters.brands.push(b.brand);
        label.classList.add("active");
      } else {
        activeFilters.brands = activeFilters.brands.filter(item => item !== b.brand);
        label.classList.remove("active");
      }
      syncUrlAndFetch();
    });

    container.appendChild(label);
  });
}

function updateShopHeading() {
  const shopTitle = document.querySelector(".shop-title");
  const categoryLabel = document.getElementById("shopCategoryLabel");
  const { scale, category, search } = activeFilters;

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

function setActiveCategoryLink() {
  const { category } = activeFilters;
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
    if (btn) {
      btn.classList.add("active");
      btn.textContent = "♥";
    }
  });
}

async function loadProducts() {
  if (!grid) return;

  grid.innerHTML = "<div class='shop-loading'><span class='spinner'></span> Loading models...</div>";
  if (emptyState) emptyState.classList.add("hidden");
  
  updateShopHeading();
  setActiveCategoryLink();

  try {
    const products = await fetchProducts();

    grid.innerHTML = "";
    if (productCountLabel) {
      productCountLabel.textContent = `Showing ${products.length} model${products.length !== 1 ? 's' : ''}`;
    }

    if (!Array.isArray(products) || products.length === 0) {
      if (emptyState) emptyState.classList.remove("hidden");
      return;
    }

    products.forEach((product) => {
      const id = product._id || product.id;
      const oos = isOutOfStock(product);
      const imageSrc =
        product.image && typeof product.image === "object" && product.image.url
          ? product.image.url
          : product.images && product.images.length > 0 && product.images[0].url
          ? product.images[0].url
          : product.image && typeof product.image === "string" && product.image.trim() !== ""
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
          <img src="${imageSrc}" alt="${product.name}" loading="lazy"
            onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'" />
        </div>
        <div class="product-info">
          <h3>${product.name}</h3>
          <p class="subtitle">${product.brand}</p>
          <div class="price-row">
            <span class="price">₹${product.price.toLocaleString("en-IN")}</span>
            <button class="add-btn btn-ripple" type="button" ${oos ? "disabled" : ""}>+</button>
          </div>
        </div>
      `;

      grid.appendChild(card);
    });

    markWishlistItems();
  } catch (err) {
    console.error(err);
    grid.innerHTML = "<p style='color:#ef4444; text-align:center;'>Failed to load products.</p>";
  }
}

grid.addEventListener("click", async (e) => {
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
      price: card.querySelector(".price").innerText.replace("₹", "").replace(/,/g, ""),
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

    // Call backend to update wishlistCount in DB (non-blocking)
    try {
      fetch(`${API_BASE}/api/products/${productId}/wishlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: active ? "add" : "remove" })
      });
    } catch (err) {
      console.error("Failed to sync wishlist count with server:", err.message);
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

// INITIALIZE SORT SELECTOR
function initSortSelector() {
  const sortSelect = document.getElementById("sortBy");
  if (sortSelect) {
    sortSelect.value = activeFilters.sort;
    sortSelect.addEventListener("change", (e) => {
      activeFilters.sort = e.target.value;
      syncUrlAndFetch();
    });
  }
}

// INITIALIZE PRICE RANGE INPUTS
function initPriceFilters() {
  const minInput = document.getElementById("minPriceInput");
  const maxInput = document.getElementById("maxPriceInput");
  const applyBtn = document.getElementById("applyPriceFilter");

  if (minInput) minInput.value = activeFilters.minPrice;
  if (maxInput) maxInput.value = activeFilters.maxPrice;

  applyBtn?.addEventListener("click", () => {
    activeFilters.minPrice = minInput.value;
    activeFilters.maxPrice = maxInput.value;
    syncUrlAndFetch();
  });
}

// RESET ALL FILTERS
function resetAllFilters() {
  activeFilters.brands = [];
  activeFilters.minPrice = "";
  activeFilters.maxPrice = "";
  activeFilters.sort = "newest";

  const minInput = document.getElementById("minPriceInput");
  const maxInput = document.getElementById("maxPriceInput");
  if (minInput) minInput.value = "";
  if (maxInput) maxInput.value = "";

  const sortSelect = document.getElementById("sortBy");
  if (sortSelect) sortSelect.value = "newest";

  loadBrandsList();
  syncUrlAndFetch();
}

// MOBILE SLIDE-OUT FILTERS
function initMobileFilters() {
  const sidebar = document.getElementById("shopSidebar");
  const toggleBtn = document.getElementById("mobileFilterToggle");
  const closeBtn = document.getElementById("sidebarClose");

  toggleBtn?.addEventListener("click", () => {
    sidebar?.classList.add("open");
    document.body.style.overflow = "hidden"; // Prevent background scroll
  });

  const closeSidebar = () => {
    sidebar?.classList.remove("open");
    document.body.style.overflow = "";
  };

  closeBtn?.addEventListener("click", closeSidebar);

  // Close sidebar if user clicks outside of it on mobile
  document.addEventListener("click", (e) => {
    if (sidebar && sidebar.classList.contains("open")) {
      if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
        closeSidebar();
      }
    }
  });
}

// SETUP SCALE BUTTON CLICK HANDLERS
function initScaleButtons() {
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const scale = btn.dataset.scale;
      activeFilters.scale = scale;
      loadBrandsList();
      syncUrlAndFetch();
    });
  });

  // Highlight initial active scale button
  if (activeFilters.scale) {
    buttons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.scale === activeFilters.scale);
    });
  } else {
    // Default default active 1:64
    buttons.forEach((btn) => {
      if (btn.dataset.scale === "1:64") {
        btn.classList.add("active");
        activeFilters.scale = "1:64";
      } else {
        btn.classList.remove("active");
      }
    });
  }
}

// SETUP RESET BUTTONS
function initResetButtons() {
  document.getElementById("resetFiltersSidebar")?.addEventListener("click", resetAllFilters);
  document.getElementById("resetFiltersEmpty")?.addEventListener("click", resetAllFilters);
}

document.addEventListener("DOMContentLoaded", () => {
  parseUrlParams();
  initScaleButtons();
  initSortSelector();
  initPriceFilters();
  initMobileFilters();
  initResetButtons();
  loadBrandsList();
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
