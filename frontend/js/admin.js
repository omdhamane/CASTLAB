const adminGate = document.getElementById("adminGate");
const adminPanel = document.getElementById("adminPanel");
const productForm = document.getElementById("productForm");
const productList = document.getElementById("adminProductList");
const editId = document.getElementById("editId");
const formTitle = document.getElementById("formTitle");

const uploadZone = document.getElementById("uploadZone");
const imageFilesInput = document.getElementById("imageFiles");
const imagePreviewsGrid = document.getElementById("imagePreviews");

let selectedFiles = [];
let existingImages = []; // [{url, public_id}]

// ==========================================
// AUTHENTICATION
// ==========================================
function getAuthHeaders(json = true) {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const h = { "Authorization": `Bearer ${token}` };
  if (json) h["Content-Type"] = "application/json";
  return h;
}

async function checkAdminStatus() {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/api/auth/profile`, {
      headers: getAuthHeaders()
    });
    const user = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "login.html";
        return;
      }
      throw new Error(user.message || "Failed to fetch profile");
    }
    if (user.role === "admin" || user.role === "superadmin") {
      adminGate.classList.add("hidden");
      adminPanel.classList.remove("hidden");
      loadAdminProducts();
    } else {
      // User is logged in but not an admin -> show the unlock gate to let them upgrade
      adminGate.classList.remove("hidden");
      adminPanel.classList.add("hidden");
    }
  } catch (err) {
    window.location.href = "login.html";
  }
}

async function unlockAdmin() {
  const keyInput = document.getElementById("adminKeyInput");
  const key = keyInput.value.trim();
  if (!key) return alert("Enter admin key");

  const unlockBtn = document.getElementById("adminUnlock");
  const originalText = unlockBtn.textContent;
  unlockBtn.disabled = true;
  unlockBtn.textContent = "Verifying...";

  try {
    const res = await fetch(`${API_BASE}/api/auth/verify-admin-key`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ adminKey: key })
    });

    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      adminGate.classList.add("hidden");
      adminPanel.classList.remove("hidden");
      loadAdminProducts();
    } else {
      alert(data.message || "Failed to unlock admin panel");
    }
  } catch (err) {
    alert("Network error occurred.");
  } finally {
    unlockBtn.disabled = false;
    unlockBtn.textContent = originalText;
  }
}

document.getElementById("adminUnlock")?.addEventListener("click", unlockAdmin);
document.addEventListener("DOMContentLoaded", checkAdminStatus);

// ==========================================
// DRAG AND DROP UPLOAD
// ==========================================
uploadZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadZone.classList.add("dragover");
});

uploadZone.addEventListener("dragleave", () => {
  uploadZone.classList.remove("dragover");
});

uploadZone.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadZone.classList.remove("dragover");
  handleFiles(e.dataTransfer.files);
});

imageFilesInput.addEventListener("change", (e) => {
  handleFiles(e.target.files);
});

function handleFiles(files) {
  const validFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
  if (selectedFiles.length + validFiles.length + existingImages.length > 5) {
    alert("You can only have up to 5 images per product.");
    return;
  }
  validFiles.forEach(file => {
    if (file.size > 5 * 1024 * 1024) {
      alert(`${file.name} is over 5MB limit.`);
      return;
    }
    selectedFiles.push(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      addPreviewElement(e.target.result, null, file);
    };
    reader.readAsDataURL(file);
  });
}

function addPreviewElement(src, publicId, fileRef) {
  const div = document.createElement("div");
  div.className = "preview-item";
  div.innerHTML = `
    <img src="${src}" alt="preview" />
    <button type="button" class="preview-remove">&times;</button>
  `;
  div.querySelector(".preview-remove").addEventListener("click", () => {
    div.remove();
    if (fileRef) {
      selectedFiles = selectedFiles.filter(f => f !== fileRef);
    }
    if (publicId) {
      existingImages = existingImages.filter(img => img.public_id !== publicId);
    }
  });
  imagePreviewsGrid.appendChild(div);
}

// ==========================================
// PRODUCT MANAGEMENT
// ==========================================
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
      const mainImg = p.images && p.images.length > 0 ? p.images[0].url : ((p.image && typeof p.image === "object" ? p.image.url : p.image) || "https://via.placeholder.com/80");
      row.innerHTML = `
        <img src="${mainImg}" alt="" />
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

productList.addEventListener("click", async (e) => {
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
    document.getElementById("isBestSeller").checked = p.isBestSeller;
    document.getElementById("isNewArrival").checked = p.isNewArrival;
    document.getElementById("isLimitedEdition").checked = p.isLimitedEdition;
    
    resetPreviews();
    if (p.images && p.images.length > 0) {
      existingImages = p.images;
      p.images.forEach(img => addPreviewElement(img.url, img.public_id, null));
    } else if (p.image) {
      // Legacy support
      const imgUrl = typeof p.image === "object" ? p.image.url : p.image;
      addPreviewElement(imgUrl, null, null);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (delBtn) {
    if (!confirm("Delete this product?")) return;
    const id = delBtn.dataset.delete;
    const res = await fetch(`${API_BASE}/api/products/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });
    if (res.ok) {
      loadAdminProducts();
    } else {
      alert("Delete failed");
    }
  }
});

function resetPreviews() {
  imagePreviewsGrid.innerHTML = "";
  selectedFiles = [];
  existingImages = [];
  imageFilesInput.value = "";
}

function resetForm() {
  productForm.reset();
  editId.value = "";
  formTitle.textContent = "Add Product";
  resetPreviews();
}

document.getElementById("resetForm")?.addEventListener("click", resetForm);

productForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitBtn = productForm.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  submitBtn.innerText = "Uploading & Saving...";

  try {
    let finalImages = [...existingImages];

    // Upload new files to Cloudinary if any
    if (selectedFiles.length > 0) {
      const formData = new FormData();
      selectedFiles.forEach(file => formData.append("images", file));

      const uploadRes = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}` },
        body: formData
      });
      
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.message || "Image upload failed");
      
      finalImages = [...finalImages, ...uploadData.images];
    }

    const payload = {
      name: document.getElementById("name").value.trim(),
      brand: document.getElementById("brand").value.trim(),
      scale: document.getElementById("scale").value,
      price: Number(document.getElementById("price").value),
      stock: Number(document.getElementById("stock").value),
      category: document.getElementById("category").value,
      description: document.getElementById("description").value.trim(),
      images: finalImages,
      isBestSeller: document.getElementById("isBestSeller").checked,
      isNewArrival: document.getElementById("isNewArrival").checked,
      isLimitedEdition: document.getElementById("isLimitedEdition").checked
    };

    const id = editId.value;
    const url = id ? `${API_BASE}/api/products/${id}` : `${API_BASE}/api/products`;
    const method = id ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert(id ? "Product updated" : "Product created");
      resetForm();
      loadAdminProducts();
    } else {
      const data = await res.json();
      alert(data.message || "Save failed");
    }
  } catch (err) {
    alert(err.message || "Request failed");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Save Product";
  }
});

document.getElementById("adminLogout")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
  window.location.href = "login.html";
});

/* ======================================================
   ANALYTICS DASHBOARD INTEGRATION
   ====================================================== */

let monthlyRevenueChartInstance = null;
let scaleSalesChartInstance = null;
let brandSalesChartInstance = null;

async function loadDashboardStats() {
  try {
    const res = await fetch(`${API_BASE}/api/analytics`, {
      headers: getAuthHeaders(false)
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        alert("Not authorized to view analytics dashboard.");
        return;
      }
      throw new Error("Failed to fetch analytics statistics");
    }

    const data = await res.json();
    
    // 1. Populate Metrics
    document.getElementById("metricRevenue").textContent = `₹${data.metrics.totalRevenue.toLocaleString("en-IN")}`;
    document.getElementById("metricOrders").textContent = data.metrics.totalOrders;
    
    const bestSeller = data.bestSellers && data.bestSellers.length > 0 ? data.bestSellers[0] : null;
    document.getElementById("metricBestSeller").textContent = bestSeller ? `${bestSeller.name} (${bestSeller.totalSold} sold)` : "—";
    
    const wishlisted = data.metrics.mostWishlisted;
    document.getElementById("metricWishlisted").textContent = wishlisted ? `${wishlisted.name} (${wishlisted.wishlistCount} likes)` : "—";
    
    document.getElementById("metricScale").textContent = data.metrics.popularScale || "1:64";

    // 2. Render Recent Orders
    const recentOrdersContainer = document.getElementById("recentOrdersList");
    if (recentOrdersContainer) {
      if (data.recentOrders.length === 0) {
        recentOrdersContainer.innerHTML = `<tr><td colspan="5" style="text-align:center; opacity:0.5;">No orders placed yet</td></tr>`;
      } else {
        recentOrdersContainer.innerHTML = data.recentOrders.map(o => `
          <tr>
            <td><code>${o.id.slice(-6).toUpperCase()}</code></td>
            <td>
              <strong>${o.user.name}</strong><br/>
              <span style="font-size:0.75rem; opacity:0.6;">${o.user.email}</span>
            </td>
            <td>${new Date(o.createdAt).toLocaleDateString()}</td>
            <td>₹${o.totalAmount.toLocaleString("en-IN")}</td>
            <td><span class="status-badge ${o.status.toLowerCase()}">${o.status}</span></td>
          </tr>
        `).join("");
      }
    }

    // 3. Render Top Customers
    const topCustomersContainer = document.getElementById("topCustomersList");
    if (topCustomersContainer) {
      if (data.topCustomers.length === 0) {
        topCustomersContainer.innerHTML = `<tr><td colspan="4" style="text-align:center; opacity:0.5;">No customer logs found</td></tr>`;
      } else {
        topCustomersContainer.innerHTML = data.topCustomers.map(c => `
          <tr>
            <td><strong>${c.name}</strong></td>
            <td><span style="opacity:0.7;">${c.email}</span></td>
            <td>${c.ordersCount}</td>
            <td>₹${c.totalSpent.toLocaleString("en-IN")}</td>
          </tr>
        `).join("");
      }
    }

    // 4. Render Charts
    initCharts(data.charts);

  } catch (err) {
    console.error("Dashboard error:", err);
    alert(err.message || "Failed to load dashboard statistics");
  }
}

function initCharts(chartData) {
  if (monthlyRevenueChartInstance) monthlyRevenueChartInstance.destroy();
  if (scaleSalesChartInstance) scaleSalesChartInstance.destroy();
  if (brandSalesChartInstance) brandSalesChartInstance.destroy();

  const primaryColor = "#ff4d4d";
  const gridColor = "rgba(255, 255, 255, 0.08)";
  const textColor = "rgba(255, 255, 255, 0.7)";

  // A. Monthly Revenue Chart (Line)
  const ctxRevenue = document.getElementById("monthlyRevenueChart")?.getContext("2d");
  if (ctxRevenue) {
    const months = chartData.monthlyRevenue.map(m => m.label);
    const revenues = chartData.monthlyRevenue.map(m => m.revenue);
    
    monthlyRevenueChartInstance = new Chart(ctxRevenue, {
      type: "line",
      data: {
        labels: months.length > 0 ? months : ["No Data"],
        datasets: [{
          label: "Revenue (₹)",
          data: revenues.length > 0 ? revenues : [0],
          borderColor: primaryColor,
          backgroundColor: "rgba(255, 77, 77, 0.15)",
          borderWidth: 2,
          fill: true,
          tension: 0.35
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: textColor } },
          y: { grid: { color: gridColor }, ticks: { color: textColor } }
        }
      }
    });
  }

  // B. Popular Scales Chart (Doughnut)
  const ctxScale = document.getElementById("scaleSalesChart")?.getContext("2d");
  if (ctxScale) {
    const scales = chartData.scaleSales.map(s => s.scale);
    const counts = chartData.scaleSales.map(s => s.count);

    scaleSalesChartInstance = new Chart(ctxScale, {
      type: "doughnut",
      data: {
        labels: scales.length > 0 ? scales : ["No Sales"],
        datasets: [{
          data: counts.length > 0 ? counts : [1],
          backgroundColor: [
            "#ff4d4d",
            "#ff9f43",
            "#00d2d3",
            "#54a0ff",
            "#5f27cd"
          ],
          borderWidth: 1,
          borderColor: "#111"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: { color: textColor, boxWidth: 12 }
          }
        }
      }
    });
  }

  // C. Top Selling Brands (Bar)
  const ctxBrand = document.getElementById("brandSalesChart")?.getContext("2d");
  if (ctxBrand) {
    const brands = chartData.brandSales.map(b => b.brand);
    const counts = chartData.brandSales.map(b => b.count);

    brandSalesChartInstance = new Chart(ctxBrand, {
      type: "bar",
      data: {
        labels: brands.length > 0 ? brands : ["No Data"],
        datasets: [{
          label: "Quantity Sold",
          data: counts.length > 0 ? counts : [0],
          backgroundColor: "rgba(255, 77, 77, 0.75)",
          borderColor: primaryColor,
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: textColor } },
          y: { grid: { color: gridColor }, ticks: { color: textColor, stepSize: 1 } }
        }
      }
    });
  }
}

function initAdminTabs() {
  const tabPM = document.getElementById("tabProductManager");
  const tabAD = document.getElementById("tabAnalyticsDashboard");
  
  const secPM = document.getElementById("productManagerSection");
  const secAD = document.getElementById("analyticsDashboardSection");

  tabPM?.addEventListener("click", () => {
    tabPM.classList.add("active");
    tabAD?.classList.remove("active");
    secPM?.classList.remove("hidden");
    secAD?.classList.add("hidden");
  });

  tabAD?.addEventListener("click", () => {
    tabAD.classList.add("active");
    tabPM?.classList.remove("active");
    secAD?.classList.remove("hidden");
    secPM?.classList.add("hidden");
    loadDashboardStats();
  });
}

// Run tabs setup on module load
initAdminTabs();
