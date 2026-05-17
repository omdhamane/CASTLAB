const ordersList = document.getElementById("ordersList");
const ordersEmpty = document.getElementById("ordersEmpty");

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function invoiceUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

async function loadOrders() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  ordersList.innerHTML = "<p class='loading'>Loading orders…</p>";

  try {
    const res = await fetch(`${API_BASE}/api/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (!res.ok) {
      ordersList.innerHTML = `<p class='error'>${data.message || "Failed to load orders"}</p>`;
      return;
    }

    const orders = data.orders || [];

    if (!orders.length) {
      ordersList.innerHTML = "";
      if (ordersEmpty) ordersEmpty.classList.remove("hidden");
      return;
    }

    if (ordersEmpty) ordersEmpty.classList.add("hidden");
    ordersList.innerHTML = "";

    orders.forEach((order) => {
      const card = document.createElement("article");
      card.className = "order-card glass-card";

      const shortId = String(order.id).slice(-8).toUpperCase();
      const inv = invoiceUrl(order.invoicePath);

      card.innerHTML = `
        <div class="order-card-head">
          <div>
            <h3>Order #${shortId}</h3>
            <p class="order-meta">${formatDate(order.createdAt)} · ${order.status}</p>
          </div>
          <p class="order-total">₹${Number(order.totalAmount).toLocaleString("en-IN")}</p>
        </div>
        <div class="order-card-actions">
          ${inv ? `<a href="${inv}" target="_blank" rel="noopener" class="btn outline">Download Invoice</a>` : ""}
        </div>
      `;

      ordersList.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    ordersList.innerHTML = "<p class='error'>Could not load orders.</p>";
  }
}

document.addEventListener("DOMContentLoaded", loadOrders);
