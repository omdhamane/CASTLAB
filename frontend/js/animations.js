/* Ripple effect for .btn-ripple elements */
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-ripple, .btn.solid, .filter-btn, .add-btn, button.hero-btn");
  if (!btn) return;

  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const ripple = document.createElement("span");
  ripple.className = "ripple";
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
  ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

  btn.classList.add("btn-ripple");
  btn.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove());
});
