const API_BASE = "http://127.0.0.1:5000";

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");
const container = document.getElementById("productDetail");

async function loadProduct() {
  const res = await fetch(`${API_BASE}/api/products/${productId}`);
  const product = await res.json();

  // ✅ SUPPORT MULTIPLE IMAGES (with fallback)
  const images =
    product.images && product.images.length
      ? product.images
      : product.image
      ? [product.image]
      : [];

  container.innerHTML = `
    <div class="product-detail">
      <div class="product-detail-image">
        <img id="mainImage" src="${images[0] || ""}" alt="${product.name}" />
        <div class="thumbnail-row" id="thumbnails"></div>
      </div>

      <div class="product-detail-info">
        <h1>${product.name}</h1>
        <p class="meta">${product.brand} · ${product.scale}</p>
        <h2 class="price">₹${product.price}</h2>

        <p class="description">
          ${product.description || "No description available."}
        </p>

        <button class="primary-btn" id="addToCartBtn">
          Add to Cart
        </button>
      </div>
    </div>
  `;

  /* ---------- THUMBNAILS ---------- */
  const thumbContainer = document.getElementById("thumbnails");
  const mainImage = document.getElementById("mainImage");

  images.forEach((img, index) => {
    const t = document.createElement("img");
    t.src = img;
    t.className = "thumbnail";
    if (index === 0) t.classList.add("active");

    t.onclick = () => {
      mainImage.src = img;
      document
        .querySelectorAll(".thumbnail")
        .forEach(el => el.classList.remove("active"));
      t.classList.add("active");
    };

    thumbContainer.appendChild(t);
  });

  /* ---------- ADD TO CART ---------- */
  document.getElementById("addToCartBtn").onclick = () => {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    const existing = cart.find(i => i.productId === product._id);

    if (existing) existing.quantity += 1;
    else cart.push({ productId: product._id, quantity: 1 });

    localStorage.setItem("cart", JSON.stringify(cart));
  };
}

loadProduct();
