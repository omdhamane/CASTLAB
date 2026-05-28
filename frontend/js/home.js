const FALLBACK_IMAGE = "https://via.placeholder.com/400x400?text=CASTLAB";

const FEATURED_SECTIONS = [
  { id: "newArrivalsRow", featured: "new-arrival", fallback: "recent" },
  { id: "limitedEditionsRow", featured: "limited", fallback: null }
];

async function fetchFeatured(featured) {
  try {
    const url = `${API_BASE}/api/products?featured=${encodeURIComponent(featured)}`;
    console.log(`[Home] Fetching featured products from: ${url}`);
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[Home] Failed to fetch featured: ${res.status} ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? data : data.products || [];
  } catch (err) {
    console.error(`[Home] Error fetching featured products (${featured}):`, err);
    return [];
  }
}

async function fetchRecent(limit = 8) {
  try {
    const url = `${API_BASE}/api/products`;
    console.log(`[Home] Fetching recent fallback products from: ${url}`);
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[Home] Failed to fetch recent: ${res.status} ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    const list = Array.isArray(data) ? data : data.products || [];
    return list.slice(0, limit);
  } catch (err) {
    console.error("[Home] Error fetching recent products:", err);
    return [];
  }
}

function renderPedestalCard(product) {
  const id = product._id || product.id;
  const imageSrc =
    product.image && typeof product.image === "object" && product.image.url
      ? product.image.url
      : product.images && product.images.length > 0 && product.images[0].url
      ? product.images[0].url
      : product.image && typeof product.image === "string" && product.image.trim() !== ""
      ? product.image
      : FALLBACK_IMAGE;

  const card = document.createElement("a");
  card.href = `product.html?id=${id}`;
  card.className = "pedestal-card";
  card.innerHTML = `
    <div class="product-stage pedestal-stage">
      <img src="${imageSrc}" alt="${product.name}" loading="lazy"
        onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'" />
    </div>
    <div class="pedestal-info">
      <h3>${product.name}</h3>
      <p>${product.brand} · ₹${product.price}</p>
      <span class="view-link">View Model →</span>
    </div>
  `;
  return card;
}

function initPedestalScroll(section) {
  const row = section.querySelector(".pedestal-row");
  if (!row) return;

  section.querySelectorAll(".pedestal-arrow").forEach((btn) => {
    btn.addEventListener("click", () => {
      const amount = row.clientWidth * 0.75;
      row.scrollBy({
        left: btn.dataset.scroll === "left" ? -amount : amount,
        behavior: "smooth"
      });
    });
  });
}

async function loadFeaturedRow({ id, featured, fallback }) {
  const row = document.getElementById(id);
  if (!row) return;

  const section = row.closest("[data-pedestal]");
  row.innerHTML = `<p class="pedestal-loading">Loading…</p>`;

  try {
    let products = await fetchFeatured(featured);

    if (products.length === 0 && fallback === "recent") {
      console.log(`[Home] No featured products for '${featured}'. Attempting fallback to recent products...`);
      products = await fetchRecent();
    }

    row.innerHTML = "";

    if (products.length === 0) {
      row.innerHTML = `<p class="pedestal-empty">Coming soon — tag products in admin.</p>`;
      if (section) initPedestalScroll(section);
      return;
    }

    products.forEach((product) => {
      row.appendChild(renderPedestalCard(product));
    });

    if (section) initPedestalScroll(section);
  } catch (err) {
    console.error(`[Home] Error rendering row '${id}':`, err);
    row.innerHTML = `<p class="pedestal-error" style="color: #ff4d4d; opacity: 0.8; text-align: center; width: 100%; padding: 2rem;">Failed to load products. Check connection or try reloading.</p>`;
  }
}

function showToast(msg) {
  const toast = document.createElement("div");
  toast.className = "cart-toast";
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

document.addEventListener("DOMContentLoaded", () => {
  // Load featured products sections
  FEATURED_SECTIONS.forEach(loadFeaturedRow);

  // Newsletter Subscription
  const newsletterForm = document.getElementById("newsletterForm");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById("newsletterEmail");
      const submitBtn = document.getElementById("newsletterBtn");
      const email = emailInput ? emailInput.value.trim() : "";

      if (!email) return;

      const originalBtnText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Subscribing...";

      try {
        const url = `${API_BASE}/api/auth/subscribe`;
        console.log(`[Home] Sending newsletter subscription request to: ${url}`);
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email })
        });

        const data = await res.json();

        if (res.ok) {
          showToast(data.message || "Successfully subscribed! 🧪");
          if (emailInput) emailInput.value = "";
        } else {
          showToast(data.message || "Already subscribed or invalid email.");
        }
      } catch (err) {
        console.error("[Home] Newsletter subscription error:", err);
        showToast("Network error. Please check your connection and try again.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    });
  }
});
