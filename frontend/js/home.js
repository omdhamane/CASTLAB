const API_BASE = "https://castlab-i3hm.onrender.com";
const FALLBACK_IMAGE = "https://via.placeholder.com/400x400?text=CASTLAB";

const FEATURED_SECTIONS = [
  { id: "bestSellersRow", featured: "best-seller", fallback: null },
  { id: "newArrivalsRow", featured: "new-arrival", fallback: "recent" },
  { id: "limitedEditionsRow", featured: "limited", fallback: null }
];

async function fetchFeatured(featured) {
  const res = await fetch(
    `${API_BASE}/api/products?featured=${encodeURIComponent(featured)}`
  );
  if (!res.ok) return [];

  const data = await res.json();
  const list = Array.isArray(data) ? data : data.products || [];
  return list;
}

async function fetchRecent(limit = 8) {
  const res = await fetch(`${API_BASE}/api/products`);
  if (!res.ok) return [];

  const data = await res.json();
  const list = Array.isArray(data) ? data : data.products || [];
  return list.slice(0, limit);
}

function renderPedestalCard(product) {
  const id = product._id || product.id;
  const imageSrc =
    product.image && product.image.trim() !== ""
      ? product.image
      : FALLBACK_IMAGE;

  const card = document.createElement("a");
  card.href = `product.html?id=${id}`;
  card.className = "pedestal-card product-card";
  card.innerHTML = `
    <div class="product-stage pedestal-stage">
      <img src="${imageSrc}" alt="${product.name}" loading="lazy"
        onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'" />
    </div>
    <div class="pedestal-hover">
      <h3>${product.name}</h3>
      <p>${product.brand} · ₹${product.price}</p>
      <span class="btn outline btn-ripple">View Model</span>
    </div>
  `;
  return card;
}

async function loadFeaturedRow({ id, featured, fallback }) {
  const row = document.getElementById(id);
  if (!row) return;

  row.innerHTML = `<p class="pedestal-loading">Loading…</p>`;

  let products = await fetchFeatured(featured);

  if (products.length === 0 && fallback === "recent") {
    products = await fetchRecent();
  }

  row.innerHTML = "";

  if (products.length === 0) {
    row.innerHTML = `<p class="pedestal-empty">Coming soon — tag products in admin.</p>`;
    return;
  }

  products.forEach((product) => {
    row.appendChild(renderPedestalCard(product));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  FEATURED_SECTIONS.forEach(loadFeaturedRow);
});
