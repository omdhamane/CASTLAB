fetch("https://castlab-i3hm.onrender.com/api/products")
  .then(res => res.text())
  .then(data => console.log(data));

const API_BASE = "https://castlab-i3hm.onrender.com/api";

async function fetchProducts(scale = "") {
  const url = scale
    ? `${API_BASE}/products?scale=${scale}`
    : `${API_BASE}/products`;

  const res = await fetch(url);
  return res.json();
}

