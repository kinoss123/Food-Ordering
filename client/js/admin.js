const addMenuForm = document.getElementById("addMenuForm");
const menuMessage = document.getElementById("menuMessage");
const menuTableBody = document.getElementById("menuTableBody");
const orderTableBody = document.getElementById("orderTableBody");

const STATUS_ORDER = ["pending", "preparing", "delivering", "completed", "cancelled"];

// ---- Login gate ----
const loginForm = document.getElementById("loginForm");
const loginSection = document.getElementById("loginSection");
const adminMain = document.getElementById("adminMain");
const loginMessage = document.getElementById("loginMessage");

// If a key was already saved this browser tab session, skip login screen.
if (sessionStorage.getItem("adminKey")) showDashboard();

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const key = document.getElementById("adminKeyInput").value;

  const res = await fetch(`${API_BASE}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key }),
  });

  if (res.ok) {
    sessionStorage.setItem("adminKey", key);
    showDashboard();
  } else {
    loginMessage.innerHTML = `<p class="message error">Sai admin key</p>`;
  }
});

function showDashboard() {
  loginSection.style.display = "none";
  adminMain.style.display = "block";
  loadMenuTable();
  loadOrderTable();
}

// ---- Menu: display ----
async function loadMenuTable() {
  const menu = await apiGet("/menu");
  menuTableBody.innerHTML = "";
  menu.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.id}</td>
      <td>${item.name}</td>
      <td>${item.price.toLocaleString()} VND</td>
      <td>${item.category}</td>
      <td><button data-id="${item.id}">Delete</button></td>
    `;
    tr.querySelector("button").addEventListener("click", () => deleteMenuItem(item.id));
    menuTableBody.append(tr);
  });
}

async function deleteMenuItem(id) {
  if (!confirm("Delete this dish?")) return;
  await apiDelete(`/menu/${id}`);
  loadMenuTable();
}

// ---- Menu: add new ----
addMenuForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  menuMessage.innerHTML = "";

  const name = document.getElementById("mName").value.trim();
  const description = document.getElementById("mDesc").value.trim();
  const price = document.getElementById("mPrice").value;
  const category = document.getElementById("mCategory").value.trim() || "other";

  try {
    await apiPost("/menu", { name, description, price, category });
    menuMessage.innerHTML = `<p class="message success">Dish added successfully</p>`;
    addMenuForm.reset();
    loadMenuTable();
  } catch (err) {
    menuMessage.innerHTML = `<p class="message error">Error: ${err.message}</p>`;
  }
});

// ---- Orders: display ----
async function loadOrderTable() {
  const orders = await apiGet("/orders");
  orderTableBody.innerHTML = "";

  orders.forEach((order) => {
    const tr = document.createElement("tr");
    const select = STATUS_ORDER
      .map((s) => `<option value="${s}" ${s === order.status ? "selected" : ""}>${s}</option>`)
      .join("");

    tr.innerHTML = `
      <td>${order.id}</td>
      <td>${order.customerName}</td>
      <td>${order.total.toLocaleString()} VND</td>
      <td><span class="status-${order.status}">${order.status}</span></td>
      <td>
        <select data-id="${order.id}">${select}</select>
        <button data-delete-id="${order.id}">Delete</button>
      </td>
    `;
    tr.querySelector("select").addEventListener("change", (e) =>
      updateOrderStatus(order.id, e.target.value)
    );
    tr.querySelector("button[data-delete-id]").addEventListener("click", () =>
      deleteOrder(order.id)
    );
    orderTableBody.append(tr);
  });
}

async function updateOrderStatus(id, status) {
  await apiPut(`/orders/${id}`, { status });
  loadOrderTable();
}

async function deleteOrder(id) {
  if (!confirm("Delete this order?")) return;
  await apiDelete(`/orders/${id}`);
  loadOrderTable();
}