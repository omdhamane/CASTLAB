fetch("http://localhost:5000/")
  .then(res => res.text())
  .then(data => console.log(data));

const API_BASE = "http://localhost:5000/api";

async function fetchProducts(scale = "") {
  const url = scale
    ? `${API_BASE}/products?scale=${scale}`
    : `${API_BASE}/products`;

  const res = await fetch(url);
  return res.json();
}

