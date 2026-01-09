const grid = document.getElementById("productGrid");
const buttons = document.querySelectorAll(".filter-btn");

async function loadProducts(scale = "1:64") {
  grid.innerHTML = "";
  const products = await fetchProducts(scale);

  products.forEach(product => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}">
      </div>
      <div class="product-info">
        <h3 class="product-name">${product.name}</h3>
        <p class="product-meta">${product.scale} · ${product.brand}</p>
        <div class="product-footer">
          <span>₹${product.price}</span>
          <button>Add to Cart</button>
        </div>
      </div>
    `;
    card.addEventListener("click", () => {
        window.location.href = `product.html?id=${product._id}`;
        });

    


    grid.appendChild(card);
  });
}

// Filter buttons
buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    buttons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    loadProducts(btn.dataset.scale);
  });
});

// Initial load (1:64 priority)
loadProducts();
