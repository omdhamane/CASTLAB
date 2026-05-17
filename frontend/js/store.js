/* Shared cart, wishlist & nav — load after config.js */

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

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

function updateCartBadge() {
  const count = getCartCount();
  const link = document.getElementById("cartNavLink");
  const homeCart = document.getElementById("homeCartLink");
  const legacyBadge = document.getElementById("cartBadge");

  const label = count > 0 ? `Cart (${count})` : "Cart";

  [link, homeCart].forEach((el) => {
    if (!el) return;
    el.textContent = el.id === "homeCartLink" ? `🛒${count > 0 ? ` (${count})` : ""}` : label;
    el.classList.remove("bump");
    if (count > 0) {
      void el.offsetWidth;
      el.classList.add("bump");
    }
  });

  if (legacyBadge) {
    if (count === 0) {
      legacyBadge.classList.add("hidden");
      legacyBadge.textContent = "0";
    } else {
      legacyBadge.classList.remove("hidden");
      legacyBadge.textContent = count;
    }
  }
}

function updateWishlistBadge() {
  const count = getWishlistCount();
  const link = document.getElementById("wishlistNavLink");
  const homeWish = document.getElementById("homeWishlistLink");

  if (link) {
    link.textContent = count > 0 ? `Wishlist (${count})` : "Wishlist";
  }
  if (homeWish) {
    homeWish.textContent = count > 0 ? `♡ (${count})` : "♡";
  }
}

function closeUserMenu() {
  document.getElementById("userMenuDropdown")?.classList.add("hidden");
  document.getElementById("userMenu")?.classList.remove("open");
}

function toggleUserMenu(e) {
  e?.preventDefault();
  e?.stopPropagation();
  const menu = document.getElementById("userMenu");
  const dropdown = document.getElementById("userMenuDropdown");
  if (!menu || !dropdown) return;
  const open = dropdown.classList.toggle("hidden");
  menu.classList.toggle("open", !open);
}

function updateAuthNav() {
  const token = localStorage.getItem("token");
  const user = getStoredUser();
  const authLink = document.getElementById("authNavLink");
  const ordersLink = document.getElementById("ordersNavLink");
  const userMenu = document.getElementById("userMenu");

  if (ordersLink) {
    ordersLink.classList.toggle("hidden", !token);
  }

  if (token && user) {
    if (authLink) authLink.classList.add("hidden");

    if (userMenu) {
      userMenu.classList.remove("hidden");
      const initials = getUserInitials(user.name);
      const avatar = document.getElementById("userAvatar");
      const menuName = document.getElementById("userMenuName");
      const dropName = document.getElementById("userDropdownName");
      const dropEmail = document.getElementById("userDropdownEmail");

      if (avatar) avatar.textContent = initials;
      if (menuName) menuName.textContent = user.name?.split(" ")[0] || "Account";
      if (dropName) dropName.textContent = user.name || "Collector";
      if (dropEmail) dropEmail.textContent = user.email || "";
    }
  } else {
    if (userMenu) {
      userMenu.classList.add("hidden");
      userMenu.classList.remove("open");
    }
    if (authLink) {
      authLink.classList.remove("hidden");
      authLink.textContent = "Login";
      authLink.href = "login.html";
      authLink.onclick = null;
    }
    closeUserMenu();
  }
}

function initUserMenuEvents() {
  document.getElementById("userMenuTrigger")?.addEventListener("click", toggleUserMenu);

  document.getElementById("logoutBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    logoutUser();
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#userMenu")) {
      closeUserMenu();
    }
  });
}

function initNavBadges() {
  updateCartBadge();
  updateWishlistBadge();
  updateAuthNav();
}

document.addEventListener("DOMContentLoaded", () => {
  initNavBadges();
  initUserMenuEvents();
});

window.addEventListener("storage", initNavBadges);
window.addEventListener("cart-updated", updateCartBadge);
window.addEventListener("wishlist-updated", updateWishlistBadge);
