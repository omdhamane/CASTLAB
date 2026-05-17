/* Shared cart & wishlist — load after config.js */

function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartBadge();
  window.dispatchEvent(new Event("cart-updated"));
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + (item.quantity || 0), 0);
}

function addToCartById(productId, qty = 1) {
  let cart = getCart();
  const existing = cart.find((item) => item.productId === productId);

  if (existing) {
    existing.quantity += qty;
  } else {
    cart.push({ productId, quantity: qty });
  }

  saveCart(cart);
}

function getWishlist() {
  return JSON.parse(localStorage.getItem("wishlist")) || [];
}

function saveWishlist(wishlist) {
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  updateWishlistBadge();
  window.dispatchEvent(new Event("wishlist-updated"));
}

function getWishlistCount() {
  return getWishlist().length;
}

function isOutOfStock(product) {
  return !product || product.stock === undefined || product.stock <= 0;
}

function updateCartBadge() {
  const count = getCartCount();
  const link = document.getElementById("cartNavLink");
  const legacyBadge = document.getElementById("cartBadge");

  if (link) {
    link.textContent = count > 0 ? `Cart (${count})` : "Cart";
    link.classList.remove("bump");
    if (count > 0) {
      void link.offsetWidth;
      link.classList.add("bump");
    }
  }

  if (legacyBadge) {
    if (count === 0) {
      legacyBadge.classList.add("hidden");
      legacyBadge.textContent = "0";
    } else {
      legacyBadge.classList.remove("hidden");
      legacyBadge.textContent = count;
      legacyBadge.classList.remove("bump");
      void legacyBadge.offsetWidth;
      legacyBadge.classList.add("bump");
    }
  }
}

function updateWishlistBadge() {
  const count = getWishlistCount();
  const link = document.getElementById("wishlistNavLink");

  if (link) {
    link.textContent = count > 0 ? `Wishlist (${count})` : "Wishlist";
  }
}

function updateAuthNav() {
  const token = localStorage.getItem("token");
  const authLink = document.getElementById("authNavLink");
  const ordersLink = document.getElementById("ordersNavLink");

  if (ordersLink) {
    ordersLink.classList.toggle("hidden", !token);
  }

  if (authLink) {
    if (token) {
      authLink.textContent = "Logout";
      authLink.href = "#";
      authLink.onclick = (e) => {
        e.preventDefault();
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "login.html";
      };
    } else {
      authLink.textContent = "Login";
      authLink.href = "login.html";
      authLink.onclick = null;
    }
  }
}

function initNavBadges() {
  updateCartBadge();
  updateWishlistBadge();
  updateAuthNav();
}

document.addEventListener("DOMContentLoaded", initNavBadges);
window.addEventListener("storage", initNavBadges);
window.addEventListener("cart-updated", updateCartBadge);
window.addEventListener("wishlist-updated", updateWishlistBadge);
