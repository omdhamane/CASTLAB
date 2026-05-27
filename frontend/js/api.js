// Safe local check to prevent duplicate declaration crashes
if (typeof API_BASE === "undefined") {
  window.API_BASE = (window.location.hostname === "localhost" || 
                     window.location.hostname === "127.0.0.1" || 
                     window.location.hostname === "")
    ? "http://localhost:5000"
    : "https://castlab-i3hm.onrender.com";
}

async function fetchProducts(scale = "") {
  const base = `${API_BASE}/api`;
  const url = scale
    ? `${base}/products?scale=${scale}`
    : `${base}/products`;

  const res = await fetch(url);
  return res.json();
}

