const searchInput = document.getElementById("navSearch");
const suggestionsBox = document.getElementById("searchSuggestions");

let debounceTimer = null;

if (searchInput && suggestionsBox) {
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim();

    clearTimeout(debounceTimer);

    if (query.length < 2) {
      suggestionsBox.style.display = "none";
      suggestionsBox.innerHTML = "";
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/products/search?q=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        const products = data.products || [];
        renderSuggestions(products.slice(0, 5));
      } catch {
        suggestionsBox.style.display = "none";
      }
    }, 300);
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const q = searchInput.value.trim();
      if (q.length > 0) {
        window.location.href = `shop.html?search=${encodeURIComponent(q)}`;
      }
    }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".top-nav-search-wrap")) {
      suggestionsBox.style.display = "none";
    }
  });
}

function renderSuggestions(products) {
  if (!suggestionsBox) return;

  suggestionsBox.innerHTML = "";

  if (!products || products.length === 0) {
    suggestionsBox.style.display = "none";
    return;
  }

  products.forEach((product) => {
    const div = document.createElement("div");
    div.textContent = `${product.name} • ${product.brand} • ${product.scale}`;

    div.addEventListener("click", () => {
      window.location.href = `shop.html?search=${encodeURIComponent(product.name)}`;
    });

    suggestionsBox.appendChild(div);
  });

  suggestionsBox.style.display = "block";
}
