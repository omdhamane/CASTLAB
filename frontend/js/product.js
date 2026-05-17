const FALLBACK_IMAGE = "https://via.placeholder.com/400x250?text=CASTLAB";

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");
const container = document.getElementById("productDetail");

function isInWishlist(id) {
  return getWishlist().some((item) => item.id === id);
}

function toggleWishlist(product) {
  let wishlist = getWishlist();
  const exists = wishlist.some((item) => item.id === product.id);

  if (exists) {
    wishlist = wishlist.filter((item) => item.id !== product.id);
  } else {
    wishlist.push(product);
  }

  saveWishlist(wishlist);
  return !exists;
}

/* ---------- LOAD PRODUCT ---------- */
async function loadProduct() {
  if (!productId) {
    container.innerHTML = `
      <p style="text-align:center; opacity:0.6;">
        No product selected. 
        <a href="shop.html" style="color:#ff4d4d;">Go to Shop</a>
      </p>`;
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/products/${productId}`);

    if (!res.ok) {
      throw new Error("Product not found");
    }

    const product = await res.json();

    // ✅ Handle single image or multiple images
    const images =
      product.images && product.images.length > 0
        ? product.images
        : product.image && product.image.trim() !== ""
        ? [product.image]
        : [FALLBACK_IMAGE];

    const inWishlist = isInWishlist(product._id);
    const oos = isOutOfStock(product);

    container.innerHTML = `
      <div class="product-detail${oos ? " out-of-stock" : ""}">

        <!-- LEFT: Image -->
        <div class="product-detail-image">
          <img 
            id="mainImage" 
            src="${images[0]}" 
            alt="${product.name}"
            onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'"
          />
          <div class="thumbnail-row" id="thumbnails"></div>
        </div>

        <!-- RIGHT: Info -->
        <div class="product-detail-info">
          <p class="meta">${product.brand} · ${product.scale}</p>
          <h1>${product.name}</h1>
          <h2 class="price">₹${product.price.toLocaleString("en-IN")}</h2>

          <p class="description">
            ${product.description || "No description available."}
          </p>

          <p class="stock-info" style="opacity:0.7; font-size:0.9rem; margin-top:0.5rem;">
            ${product.stock > 0
              ? `✅ In Stock (${product.stock} available)`
              : `❌ Out of Stock`}
          </p>

          <div class="product-actions">
            <button 
              id="wishlistBtn" 
              class="wishlist-btn ${inWishlist ? "active" : ""}"
            >
              ${inWishlist ? "♥ Wishlisted" : "Wishlist"}
            </button>

            <button 
              id="addToCartBtn" 
              class="primary-btn"
              ${oos ? "disabled" : ""}
            >
              ${oos ? "Out of Stock" : "Add to Cart"}
            </button>
          </div>

        </div>
      </div>
    `;

    /* ---------- THUMBNAILS ---------- */
    const thumbContainer = document.getElementById("thumbnails");
    const mainImage = document.getElementById("mainImage");

    if (images.length > 1) {
      images.forEach((img, index) => {
        const t = document.createElement("img");
        t.src = img;
        t.className = `thumbnail ${index === 0 ? "active" : ""}`;
        t.alt = `${product.name} view ${index + 1}`;
        t.onerror = () => { t.src = FALLBACK_IMAGE; };

        t.addEventListener("click", () => {
          mainImage.src = img;
          document.querySelectorAll(".thumbnail")
            .forEach(el => el.classList.remove("active"));
          t.classList.add("active");
        });

        thumbContainer.appendChild(t);
      });
    }

    /* ---------- ADD TO CART ---------- */
    const cartBtn = document.getElementById("addToCartBtn");
    if (cartBtn && !oos) {
      cartBtn.addEventListener("click", () => {
        addToCartById(product._id);

        cartBtn.textContent = "✅ Added!";
        cartBtn.style.background = "linear-gradient(135deg, #22c55e, #16a34a)";

        setTimeout(() => {
          cartBtn.textContent = "Add to Cart";
          cartBtn.style.background = "";
        }, 1500);
      });
    }

    /* ---------- WISHLIST BUTTON ---------- */
    const wishlistBtn = document.getElementById("wishlistBtn");
    if (wishlistBtn) {
     wishlistBtn.addEventListener("click", () => {
  const wishlistProduct = {
    id: product._id,
    name: product.name,
    price: product.price,
    image: images[0]
  };

  const added = toggleWishlist(wishlistProduct);

  if (added) {
    wishlistBtn.textContent = "♥ Wishlisted";
    wishlistBtn.classList.add("active");
  } else {
    wishlistBtn.textContent = "Wishlist";
    wishlistBtn.classList.remove("active");
  }
});
    }

  } catch (error) {
    console.error("Load product error:", error);
    container.innerHTML = `
      <div style="text-align:center; padding:4rem; opacity:0.7;">
        <h2>Product not found</h2>
        <p>The product you are looking for does not exist.</p>
        <a href="shop.html" style="color:#ff4d4d;">← Back to Shop</a>
      </div>
    `;
  }
}

/* ---------- INIT ---------- */
document.addEventListener("DOMContentLoaded", loadProduct);