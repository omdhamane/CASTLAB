/* ================= NAVBAR CART BADGE ================= */

function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  // ✅ Total quantity of all items
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);

  const badge = document.getElementById("cartBadge");
  if (!badge) return;

  if (totalQty === 0) {
    badge.classList.add("hidden");
  } else {
    badge.classList.remove("hidden");
    badge.textContent = totalQty;

    // ✅ Bump animation
    badge.classList.remove("bump");
    void badge.offsetWidth; // force reflow
    badge.classList.add("bump");
  }
}

/* ================= ACTIVE NAV LINK ================= */

function setActiveNavLink() {
  const currentPage = window.location.pathname.split("/").pop();

  document.querySelectorAll(".nav-right a").forEach(link => {
    link.classList.remove("active");

    const href = link.getAttribute("href");
    if (href === currentPage) {
      link.classList.add("active");
    }
  });
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  setActiveNavLink();
});

// ✅ Listen for cart changes across tabs
window.addEventListener("storage", updateCartBadge);