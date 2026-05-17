const wishlistContainer = document.getElementById("wishlistContainer");
const wishlistToolbar = document.getElementById("wishlistToolbar");

function removeFromWishlist(id) {
  saveWishlist(getWishlist().filter((item) => item.id !== id));
  renderWishlist();
}

function moveToCart(item) {
  addToCartById(item.id, 1);
  removeFromWishlist(item.id);
  showToast("Moved to cart");
}

function removeAllWishlist() {
  if (!getWishlist().length) return;
  if (!confirm("Remove all items from wishlist?")) return;
  saveWishlist([]);
  renderWishlist();
}

function moveAllToCart() {
  const list = getWishlist();
  if (!list.length) return;

  list.forEach((item) => addToCartById(item.id, 1));
  saveWishlist([]);
  renderWishlist();
  showToast("All items moved to cart");
}

function renderWishlist() {
  if (!wishlistContainer) return;

  const wishlist = getWishlist();
  wishlistContainer.innerHTML = "";

  if (wishlistToolbar) {
    wishlistToolbar.style.display = wishlist.length ? "flex" : "none";
  }

  if (!wishlist.length) {
    wishlistContainer.innerHTML =
      "<p class='empty'>Your wishlist is empty 💔</p>";
    return;
  }

  wishlist.forEach((item) => {
    const card = document.createElement("div");
    card.className = "wishlist-card glass";
    card.dataset.id = item.id;

    card.innerHTML = `
      <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/200?text=CASTLAB'">
      <h3>${item.name}</h3>
      <p class="price">₹${item.price}</p>
      <div class="wishlist-actions">
        <button type="button" class="move-btn">Move to Cart</button>
        <button type="button" class="remove-btn">Remove</button>
      </div>
    `;

    wishlistContainer.appendChild(card);
  });
}

wishlistContainer?.addEventListener("click", (e) => {
  const card = e.target.closest(".wishlist-card");
  if (!card) return;

  const productId = card.dataset.id;
  const wishlist = getWishlist();
  const product = wishlist.find((p) => p.id === productId);

  if (e.target.classList.contains("move-btn")) {
    e.stopPropagation();
    if (product) moveToCart(product);
    return;
  }

  if (e.target.classList.contains("remove-btn")) {
    e.stopPropagation();
    removeFromWishlist(productId);
    return;
  }

  window.location.href = `product.html?id=${productId}`;
});

document.getElementById("removeAllWishlist")?.addEventListener("click", removeAllWishlist);
document.getElementById("moveAllToCart")?.addEventListener("click", moveAllToCart);

function showToast(msg) {
  const toast = document.createElement("div");
  toast.className = "cart-toast";
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

renderWishlist();
