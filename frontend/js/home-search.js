const searchInput = document.getElementById("navSearch");
const suggestionsBox = document.getElementById("searchSuggestions");

let debounceTimer = null;

searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim();

  clearTimeout(debounceTimer);

  if (query.length < 2) {
    suggestionsBox.style.display = "none";
    return;
  }

  debounceTimer = setTimeout(async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/products/search?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();

      renderSuggestions(data.products.slice(0, 5));
    } catch (err) {
      suggestionsBox.style.display = "none";
    }
  }, 300);
});

// Enter key → go to shop
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const q = searchInput.value.trim();
    if (q.length > 0) {
      window.location.href = `shop.html?search=${encodeURIComponent(q)}`;
    }
  }
});

function renderSuggestions(products) {
  suggestionsBox.innerHTML = "";

  if (!products || products.length === 0) {
    suggestionsBox.style.display = "none";
    return;
  }

  products.forEach(product => {
    const div = document.createElement("div");
    div.textContent = `${product.name} • ${product.brand} • ${product.scale}`;

    div.addEventListener("click", () => {
      window.location.href = `shop.html?search=${encodeURIComponent(product.name)}`;
    });

    suggestionsBox.appendChild(div);
  });

  suggestionsBox.style.display = "block";
}

// Hide suggestions when clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.closest(".nav-search")) {
    suggestionsBox.style.display = "none";
  }
});
