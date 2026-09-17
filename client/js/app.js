const menuGrid = document.getElementById("menuGrid");
const cartList = document.getElementById("cartList");
const totalEl = document.getElementById("total");
const searchBox = document.getElementById("searchBox");
const orderForm = document.getElementById("orderForm");
const orderMessage = document.getElementById("orderMessage");

let cart = []; // [{ id, name, price, quantity }]

// ---- Render menu ----
async function loadMenu(search = "") {
  try {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const menu = await apiGet(`/menu${query}`);
    renderMenu(menu);
  } catch (err) {
    menuGrid.innerHTML = `<p class="message error">Failed to load menu: ${err.message}</p>`;
  }
}

function renderMenu(menu) {
  menuGrid.innerHTML = "";

  if (menu.length === 0) {
    menuGrid.innerHTML = `<p>No dishes available yet.</p>`;
    return;
  }

  menu.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${item.name}</h3>
      <p>${item.description}</p>
      <p class="price">${item.price.toLocaleString()} VND</p>
      <button data-id="${item.id}">Add to Cart</button>
    `;
    card.querySelector("button").addEventListener("click", () => addToCart(item));
    menuGrid.append(card);
  });
}

// ---- Cart ----
function addToCart(item) {
  const existing = cart.find((c) => c.id === item.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id: item.id, name: item.name, price: item.price, quantity: 1 });
  }
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter((c) => c.id !== id);
  renderCart();
}

function renderCart() {
  cartList.innerHTML = "";
  cart.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${item.name} x${item.quantity}</span>
      <span>${(item.price * item.quantity).toLocaleString()} VND
        <button data-id="${item.id}">Remove</button>
      </span>
    `;
    li.querySelector("button").addEventListener("click", () => removeFromCart(item.id));
    cartList.append(li);
  });

  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  totalEl.textContent = `Total: ${total.toLocaleString()} VND`;
}

// ---- Search ----
let searchTimer;
searchBox.addEventListener("input", (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadMenu(e.target.value.trim()), 300);
});

// ---- Place order ----
orderForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  orderMessage.innerHTML = "";

  const customerName = document.getElementById("customerName").value.trim();
  const tableNumber = document.getElementById("tableNumber").value.trim();

  if (customerName === "") {
    orderMessage.innerHTML = `<p class="message error">Please enter your name</p>`;
    return;
  }
  if (cart.length === 0) {
    orderMessage.innerHTML = `<p class="message error">Your cart is empty</p>`;
    return;
  }

  try {
    const order = await apiPost("/orders", { customerName, tableNumber, items: cart });
    orderMessage.innerHTML = `<p class="message success">
      Order placed successfully! Your order number is #${order.id} - save it to track your order.
    </p>`;
    cart = [];
    renderCart();
    orderForm.reset();
  } catch (err) {
    orderMessage.innerHTML = `<p class="message error">Failed to place order: ${err.message}</p>`;
  }
});

loadMenu();
