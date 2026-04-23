fetch("https://castlab-i3hm.onrender.com")
  .then(res => res.text())
  .then(data => console.log(data));

const API_BASE = "https://your-backend-url.onrender.com/api";

async function fetchProducts(scale = "") {
  const url = scale
    ? `${API_BASE}/products?scale=${scale}`
    : `${API_BASE}/products`;

  const res = await fetch(url);
  return res.json();
}

