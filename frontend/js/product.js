const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

const container = document.getElementById("productDetail");

async function loadProduct() {
  const res = await fetch(`http://localhost:5000/api/products/${productId}`);
  const product = await res.json();

  container.innerHTML = `
    <div style="background:var(--bg-surface); padding:32px;">
      <img src="${product.image}" style="width:100%; height:300px; object-fit:contain;" />
    </div>

    <div>
      <h2>${product.name}</h2>
      <p style="color:var(--text-secondary);">${product.brand} · ${product.scale}</p>
      <h3 style="margin:16px 0;">₹${product.price}</h3>
      <p>${product.description}</p>

      <button onclick="addToCart('${product._id}')" style="margin-top:24px;">
        Add to Cart
      </button>
    </div>
  `;
}

loadProduct();
