const wishlistContainer = document.getElementById("wishlistContainer");

function getWishlist() {
  return JSON.parse(localStorage.getItem("wishlist")) || [];
}

function saveWishlist(data) {
  localStorage.setItem("wishlist", JSON.stringify(data));
}

function removeFromWishlist(id) {
  const updated = getWishlist().filter(item => item.id !== id);
  saveWishlist(updated);
  renderWishlist();
}

function addToCart(item) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.push({ productId: item.id, quantity: 1 });
  localStorage.setItem("cart", JSON.stringify(cart));
  removeFromWishlist(item.id);
}

function renderWishlist() {
  const wishlist = getWishlist();
  wishlistContainer.innerHTML = "";

  if (!wishlist.length) {
    wishlistContainer.innerHTML =
      "<p class='empty'>Your wishlist is empty 💔</p>";
    return;
  }

  wishlist.forEach(item => {
    const card = document.createElement("div");
    card.className = "wishlist-card glass";
    card.dataset.id = item.id;

    card.innerHTML = `
      <img src="${item.image}" alt="${item.name}">
      <h3>${item.name}</h3>
      <p class="price">₹${item.price}</p>

      <div class="wishlist-actions">
        <button class="move-btn">Move to Cart</button>
        <button class="remove-btn">Remove</button>
      </div>
    `;

    wishlistContainer.appendChild(card);
  });
}

/* ---------- EVENTS ---------- */

wishlistContainer.addEventListener("click", e => {
  const card = e.target.closest(".wishlist-card");
  if (!card) return;

  const productId = card.dataset.id;

  // 🛒 Move to cart
  if (e.target.classList.contains("move-btn")) {
    const wishlist = getWishlist();
    const product = wishlist.find(p => p.id === productId);
    if (product) addToCart(product);
    e.stopPropagation(); // ❗ prevent navigation
    return;
  }

  // ❌ Remove
  if (e.target.classList.contains("remove-btn")) {
    removeFromWishlist(productId);
    e.stopPropagation(); // ❗ prevent navigation
    return;
  }

  // 🔍 Open product page (card click)
  window.location.href = `product.html?id=${productId}`;
});

/* ---------- INIT ---------- */

renderWishlist();
