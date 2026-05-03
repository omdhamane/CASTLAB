document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.querySelector(".page-transition");
  if (!wrapper) return;

  setTimeout(() => {
    wrapper.classList.add("active");
  }, 50);
});

/* Smooth navigation */
document.addEventListener("click", function(e) {
  const link = e.target.closest("a");

  if (!link) return;
  if (link.target === "_blank") return;
  if (link.href.includes("#")) return;

  const wrapper = document.querySelector(".page-transition");
  if (!wrapper) return;

  e.preventDefault();

  wrapper.classList.remove("active");

  setTimeout(() => {
    window.location = link.href;
  }, 400);
});

document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.querySelector(".page-transition");
  if (!wrapper) return;
  setTimeout(() => wrapper.classList.add("active"), 50);
});