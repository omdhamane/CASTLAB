const FALLBACK_IMAGE = "https://via.placeholder.com/400x400?text=CASTLAB";

const FEATURED_SECTIONS = [
  { id: "newArrivalsRow", featured: "new-arrival", fallback: "recent" },
  { id: "limitedEditionsRow", featured: "limited", fallback: null }
];

async function fetchFeatured(featured) {
  const res = await fetch(
    `${API_BASE}/api/products?featured=${encodeURIComponent(featured)}`
  );
  if (!res.ok) return [];

  const data = await res.json();
  return Array.isArray(data) ? data : data.products || [];
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

  let products = await fetchFeatured(featured);

  if (products.length === 0 && fallback === "recent") {
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
        const res = await fetch(`${API_BASE}/api/auth/subscribe`, {
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
        showToast("Network error. Please try again later.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    });
  }
});
