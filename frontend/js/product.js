const API_BASE = "http://127.0.0.1:5000";

const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

const container = document.getElementById("productDetail");

async function loadProduct() {
  const res = await fetch(`${API_BASE}/api/products/${productId}`);
  const product = await res.json();

  const images = product.images && product.images.length
    ? product.images
    : [product.image]; // fallback for old data

  container.innerHTML = `
    <div class="product-detail">
      <div class="product-detail-image">
        <img id="mainImage" src="${images[0]}" alt="${product.name}">

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

  // Render thumbnails
  const thumbsContainer = document.getElementById("thumbnails");
  const mainImage = document.getElementById("mainImage");

  images.forEach((img, index) => {
    const thumb = document.createElement("img");
    thumb.src = img;
    thumb.className = "thumbnail";
    if (index === 0) thumb.classList.add("active");

    thumb.addEventListener("click", () => {
      mainImage.src = img;
      document
        .querySelectorAll(".thumbnail")
        .forEach(t => t.classList.remove("active"));
      thumb.classList.add("active");
    });

    thumbsContainer.appendChild(thumb);
  });

  // Add to cart
  document.getElementById("addToCartBtn").addEventListener("click", () => {
    addToCart(product._id);
  });
}

function addToCart(productId) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const item = cart.find(i => i.productId === productId);

  if (item) {
    item.quantity += 1;
  } else {
    cart.push({ productId, quantity: 1 });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Added to cart");
}

loadProduct();
