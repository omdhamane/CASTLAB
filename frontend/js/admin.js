const adminGate = document.getElementById("adminGate");
const adminPanel = document.getElementById("adminPanel");
const productForm = document.getElementById("productForm");
const productList = document.getElementById("adminProductList");
const editId = document.getElementById("editId");
const formTitle = document.getElementById("formTitle");
const imageFile = document.getElementById("imageFile");
const imagePreview = document.getElementById("imagePreview");

function getAdminKey() {
  return sessionStorage.getItem("adminKey") || "";
}

function adminHeaders(json = true) {
  const h = { "x-admin-key": getAdminKey() };
  if (json) h["Content-Type"] = "application/json";
  return h;
}

function unlockAdmin() {
  const key = document.getElementById("adminKeyInput").value.trim();
  if (!key) return alert("Enter admin key");
  sessionStorage.setItem("adminKey", key);
  adminGate.classList.add("hidden");
  adminPanel.classList.remove("hidden");
  loadAdminProducts();
}

function logoutAdmin() {
  sessionStorage.removeItem("adminKey");
  adminPanel.classList.add("hidden");
  adminGate.classList.remove("hidden");
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

imageFile?.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 3 * 1024 * 1024) {
    alert("Image must be under 3MB");
    e.target.value = "";
    return;
  }
  const dataUrl = await readFileAsDataUrl(file);
  document.getElementById("image").value = dataUrl;
  imagePreview.src = dataUrl;
  imagePreview.classList.remove("hidden");
});

async function loadAdminProducts() {
  productList.innerHTML = "<p>Loading…</p>";

  try {
    const res = await fetch(`${API_BASE}/api/products`);
    const data = await res.json();
    const products = data.products || data || [];

    productList.innerHTML = "";

    products.forEach((p) => {
      const row = document.createElement("div");
      row.className = "admin-product-row";
      row.innerHTML = `
        <img src="${p.image || "https://via.placeholder.com/80"}" alt="" />
        <div class="admin-product-meta">
          <strong>${p.name}</strong>
          <span>${p.brand} · ${p.scale} · Stock: ${p.stock} · ₹${p.price}</span>
        </div>
        <div class="admin-product-btns">
          <button type="button" class="btn outline" data-edit="${p._id}">Edit</button>
          <button type="button" class="btn danger" data-delete="${p._id}">Delete</button>
        </div>
      `;
      productList.appendChild(row);
    });
  } catch (err) {
    productList.innerHTML = "<p>Failed to load products</p>";
  }
}

productList?.addEventListener("click", async (e) => {
  const editBtn = e.target.closest("[data-edit]");
  const delBtn = e.target.closest("[data-delete]");

  if (editBtn) {
    const id = editBtn.dataset.edit;
    const res = await fetch(`${API_BASE}/api/products/${id}`);
    const p = await res.json();
    editId.value = p._id;
    formTitle.textContent = "Edit Product";
    document.getElementById("name").value = p.name;
    document.getElementById("brand").value = p.brand;
    document.getElementById("scale").value = p.scale;
    document.getElementById("price").value = p.price;
    document.getElementById("stock").value = p.stock;
    document.getElementById("category").value = p.category || "";
    document.getElementById("description").value = p.description || "";
    document.getElementById("image").value = p.image || "";
    document.getElementById("isBestSeller").checked = p.isBestSeller;
    document.getElementById("isNewArrival").checked = p.isNewArrival;
    document.getElementById("isLimitedEdition").checked = p.isLimitedEdition;
    if (p.image) {
      imagePreview.src = p.image;
      imagePreview.classList.remove("hidden");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (delBtn) {
    if (!confirm("Delete this product?")) return;
    const id = delBtn.dataset.delete;
    const res = await fetch(`${API_BASE}/api/products/${id}`, {
      method: "DELETE",
      headers: adminHeaders()
    });
    const data = await res.json();
    if (res.ok) {
      loadAdminProducts();
    } else {
      alert(data.message || "Delete failed");
    }
  }
});

function resetForm() {
  productForm.reset();
  editId.value = "";
  formTitle.textContent = "Add Product";
  imagePreview.classList.add("hidden");
}

document.getElementById("resetForm")?.addEventListener("click", resetForm);

productForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    name: document.getElementById("name").value.trim(),
    brand: document.getElementById("brand").value.trim(),
    scale: document.getElementById("scale").value,
    price: Number(document.getElementById("price").value),
    stock: Number(document.getElementById("stock").value),
    category: document.getElementById("category").value,
    description: document.getElementById("description").value.trim(),
    image: document.getElementById("image").value.trim(),
    isBestSeller: document.getElementById("isBestSeller").checked,
    isNewArrival: document.getElementById("isNewArrival").checked,
    isLimitedEdition: document.getElementById("isLimitedEdition").checked
  };

  const id = editId.value;
  const url = id ? `${API_BASE}/api/products/${id}` : `${API_BASE}/api/products`;
  const method = id ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: adminHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (res.ok) {
      alert(id ? "Product updated" : "Product created");
      resetForm();
      loadAdminProducts();
    } else {
      alert(data.message || "Save failed");
    }
  } catch (err) {
    alert("Request failed");
  }
});

document.getElementById("adminUnlock")?.addEventListener("click", unlockAdmin);
document.getElementById("adminLogout")?.addEventListener("click", logoutAdmin);

if (getAdminKey()) {
  adminGate.classList.add("hidden");
  adminPanel.classList.remove("hidden");
  loadAdminProducts();
}
