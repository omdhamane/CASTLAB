/* Navbar — uses store.js for cart/wishlist/auth */

function setActiveNavLink() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll(".nav-right a").forEach((link) => {
    link.classList.remove("active");
    const href = link.getAttribute("href");
    if (href && href.split("?")[0] === currentPage) {
      link.classList.add("active");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (typeof initNavBadges === "function") initNavBadges();
  setActiveNavLink();
});
