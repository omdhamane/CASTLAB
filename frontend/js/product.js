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

    // Handle multiple images (array of objects), single object, or single legacy image
    const images =
      product.images && product.images.length > 0 && product.images[0].url
        ? product.images.map(img => img.url)
        : product.image && typeof product.image === "object" && product.image.url
        ? [product.image.url]
        : product.image && typeof product.image === "string" && product.image.trim() !== ""
        ? [product.image]
        : [FALLBACK_IMAGE];

    const inWishlist = isInWishlist(product._id);
    const oos = isOutOfStock(product);

    container.innerHTML = `
      <div class="product-detail${oos ? " out-of-stock" : ""}">

        <!-- LEFT: Image Gallery -->
        <div class="product-gallery">
          <div class="main-image-container">
            <img 
              id="mainImage" 
              src="${images[0]}" 
              alt="${product.name}"
              onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'"
            />
          </div>
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
        const tWrapper = document.createElement("div");
        tWrapper.className = `thumbnail-item ${index === 0 ? "active" : ""}`;
        
        const t = document.createElement("img");
        t.src = img;
        t.alt = `${product.name} view ${index + 1}`;
        t.onerror = () => { t.src = FALLBACK_IMAGE; };

        tWrapper.appendChild(t);

        tWrapper.addEventListener("click", () => {
          mainImage.src = img;
          document.querySelectorAll(".thumbnail-item")
            .forEach(el => el.classList.remove("active"));
          tWrapper.classList.add("active");
        });

        thumbContainer.appendChild(tWrapper);
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
document.addEventListener("DOMContentLoaded", () => {
  loadProduct();
  loadReviews();
  setupReviewForm();
});

/* ======================================================
   REVIEWS SYSTEM
   ====================================================== */

let allReviews = [];

async function loadReviews() {
  if (!productId) return;
  const section = document.getElementById("reviewsSection");
  
  try {
    const res = await fetch(`${API_BASE}/api/reviews/${productId}`);
    if (!res.ok) throw new Error("Failed to load reviews");
    allReviews = await res.json();
    
    section.classList.remove("hidden");
    renderReviews();
    updateReviewStats();
  } catch (err) {
    console.error(err);
  }
}

function getStarsHtml(rating) {
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    stars += i <= rating ? "★" : "☆";
  }
  return stars;
}

function updateReviewStats() {
  const avgDisplay = document.getElementById("avgRatingDisplay");
  const starsDisplay = document.getElementById("avgStarsDisplay");
  const countDisplay = document.getElementById("totalReviewsDisplay");
  
  if (allReviews.length === 0) {
    avgDisplay.textContent = "0.0";
    starsDisplay.textContent = getStarsHtml(0);
    countDisplay.textContent = "0 reviews";
    return;
  }
  
  const total = allReviews.reduce((sum, r) => sum + r.rating, 0);
  const avg = (total / allReviews.length).toFixed(1);
  
  avgDisplay.textContent = avg;
  starsDisplay.textContent = getStarsHtml(Math.round(avg));
  countDisplay.textContent = `${allReviews.length} review${allReviews.length > 1 ? 's' : ''}`;
}

function renderReviews() {
  const list = document.getElementById("reviewsList");
  const sort = document.getElementById("reviewSort").value;
  
  let sorted = [...allReviews];
  if (sort === "highest") sorted.sort((a, b) => b.rating - a.rating);
  else if (sort === "lowest") sorted.sort((a, b) => a.rating - b.rating);
  // newest is default from backend
  
  if (sorted.length === 0) {
    list.innerHTML = "<p style='opacity:0.6; text-align:center;'>No reviews yet. Be the first to review!</p>";
    return;
  }
  
  list.innerHTML = sorted.map(r => `
    <div class="review-card">
      <div class="review-header">
        <div class="review-meta">
          <strong>${r.user?.name || "Anonymous"}</strong>
          <span>${new Date(r.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="stars-display">${getStarsHtml(r.rating)}</div>
      </div>
      <p class="review-text">${r.comment}</p>
      <div class="review-footer">
        <button class="helpful-btn" onclick="voteHelpful('${r._id}')">Helpful (${r.helpfulVotes || 0})</button>
      </div>
    </div>
  `).join("");
}

document.getElementById("reviewSort")?.addEventListener("change", renderReviews);

// Helpful vote logic
window.voteHelpful = async (reviewId) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) return alert("Please login to vote.");
  
  try {
    const res = await fetch(`${API_BASE}/api/reviews/${reviewId}/helpful`, {
      method: "PUT",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) {
      loadReviews();
    }
  } catch (err) {
    console.error("Vote failed");
  }
};

// Form logic
function setupReviewForm() {
  const writeBtn = document.getElementById("writeReviewBtn");
  const cancelBtn = document.getElementById("cancelReviewBtn");
  const formContainer = document.getElementById("reviewFormContainer");
  const form = document.getElementById("reviewForm");
  const stars = document.querySelectorAll("#starRatingInput span");
  const ratingInput = document.getElementById("reviewRating");
  
  writeBtn?.addEventListener("click", () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      alert("Please login to write a review.");
      window.location.href = "login.html";
      return;
    }
    formContainer.classList.remove("hidden");
    writeBtn.classList.add("hidden");
  });
  
  cancelBtn?.addEventListener("click", () => {
    formContainer.classList.add("hidden");
    writeBtn.classList.remove("hidden");
    form.reset();
    ratingInput.value = "0";
    stars.forEach(s => s.classList.remove("active"));
  });
  
  // Interactive stars
  stars.forEach(star => {
    star.addEventListener("click", () => {
      const val = parseInt(star.getAttribute("data-value"));
      ratingInput.value = val;
      stars.forEach(s => {
        if (parseInt(s.getAttribute("data-value")) <= val) {
          s.classList.add("active");
        } else {
          s.classList.remove("active");
        }
      });
    });
  });
  
  // Submit
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const rating = ratingInput.value;
    const comment = document.getElementById("reviewComment").value;
    
    if (rating === "0") return alert("Please select a star rating.");
    
    const submitBtn = document.getElementById("submitReviewBtn");
    submitBtn.disabled = true;
    submitBtn.innerText = "Submitting...";
    
    try {
      const res = await fetch(`${API_BASE}/api/reviews/${productId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ rating, comment })
      });
      
      const data = await res.json();
      if (res.ok) {
        formContainer.classList.add("hidden");
        writeBtn.classList.remove("hidden");
        form.reset();
        ratingInput.value = "0";
        stars.forEach(s => s.classList.remove("active"));
        loadReviews();
      } else {
        alert(data.message || "Failed to submit review");
      }
    } catch (err) {
      alert("Network error.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = "Submit Review";
    }
  });
}