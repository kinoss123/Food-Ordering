const menuGrid = document.getElementById("menuGrid");
const cartList = document.getElementById("cartList");
const totalEl = document.getElementById("total");
const cartCount = document.getElementById("cartCount");
const emptyCart = document.getElementById("emptyCart");
const searchBox = document.getElementById("searchBox");
const orderForm = document.getElementById("orderForm");
const orderMessage = document.getElementById("orderMessage");
const heroTitle = document.getElementById("heroTitle");
const heroVietnamese = document.getElementById("heroVietnamese");
const heroDescription = document.getElementById("heroDescription");
const heroCategory = document.getElementById("heroCategory");
const heroPrice = document.getElementById("heroPrice");
const heroAddButton = document.getElementById("heroAddButton");
const heroVisual = document.getElementById("heroVisual");
const heroImage = document.getElementById("heroImage");
const visualCaption = document.getElementById("visualCaption");

// Presentation metadata only: all order IDs, original names, prices, and quantities stay API-driven.
const DISH_PRESENTATION = {
  1: { englishName: "Chicken Pho", vietnameseName: "Ph\u1edf G\u00e0", image: "assets/food/pho-ga.jpg" },
  2: { englishName: "Beef Pho", vietnameseName: "Ph\u1edf B\u00f2", image: "assets/food/pho-bo.jpg" },
  3: { englishName: "Vietnamese Iced Tea", vietnameseName: "Tr\u00e0 \u0110\u00e1", image: "assets/food/tra-da.jpg" },
  4: { englishName: "Soy Milk", vietnameseName: "S\u1eefa \u0110\u1eadu N\u00e0nh", image: "assets/food/soy-milk.webp" },
  5: { englishName: "Vietnamese Fried Dough", vietnameseName: "Qu\u1ea9y", image: "assets/food/quay.jpg" },
};

let cart = []; // [{ id, name, price, quantity }]
let selectedItem = null;
let heroTransitionTimer;

const formatPrice = (price) => `${Number(price).toLocaleString()} VND`;
const categoryClass = (category) => String(category || "other").toLowerCase().replace(/[^a-z0-9]+/g, "-") || "other";
const categoryLabel = (category) => category ? String(category).replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Today’s selection";
const getPresentation = (item) => DISH_PRESENTATION[item.id] || { englishName: item.name, vietnameseName: item.name, image: "" };
const imageFor = (item) => String(item.image || getPresentation(item).image || "").trim();

async function loadMenu(search = "") {
  menuGrid.innerHTML = '<p class="menu-loading">Curating today’s menu…</p>';
  try {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    const menu = await apiGet(`/menu${query}`);
    renderMenu(menu);
    selectDish(menu.find((item) => item.id === selectedItem?.id) || menu[0], false);
  } catch (err) {
    menuGrid.innerHTML = "";
    const message = document.createElement("p");
    message.className = "menu-loading is-error";
    message.textContent = `Failed to load menu: ${err.message}`;
    menuGrid.append(message);
  }
}

function renderMenu(menu) {
  menuGrid.innerHTML = "";
  if (menu.length === 0) {
    const empty = document.createElement("p");
    empty.className = "menu-loading";
    empty.textContent = "No dishes match that search yet.";
    menuGrid.append(empty);
    return;
  }
  menu.forEach((item, index) => {
    const presentation = getPresentation(item);
    const selector = document.createElement("button");
    selector.type = "button";
    selector.className = "dish-selector";
    selector.dataset.id = item.id;
    selector.setAttribute("role", "listitem");
    selector.setAttribute("aria-label", `View ${presentation.englishName}`);
    selector.style.setProperty("--dish-index", index);

    const thumbnail = document.createElement("span");
    thumbnail.className = `dish-thumbnail category-${categoryClass(item.category)}`;
    thumbnail.setAttribute("aria-hidden", "true");
    const thumbnailImage = document.createElement("img");
    thumbnailImage.src = imageFor(item);
    thumbnailImage.alt = "";
    thumbnailImage.addEventListener("error", () => thumbnailImage.remove());
    thumbnail.append(thumbnailImage);

    const identity = document.createElement("span");
    identity.className = "dish-identity";
    const name = document.createElement("span");
    name.className = "dish-name";
    name.textContent = presentation.englishName;
    const vietnamese = document.createElement("span");
    vietnamese.className = "dish-vietnamese";
    vietnamese.textContent = presentation.vietnameseName;
    const price = document.createElement("span");
    price.className = "dish-price";
    price.textContent = formatPrice(item.price);
    identity.append(name, vietnamese, price);
    selector.append(thumbnail, identity);
    selector.addEventListener("click", () => selectDish(item));
    menuGrid.append(selector);
  });
}

function selectDish(item, shouldAnimate = true) {
  selectedItem = item || null;
  document.querySelectorAll(".dish-selector").forEach((selector) => {
    const isSelected = Number(selector.dataset.id) === item?.id;
    selector.classList.toggle("is-selected", isSelected);
    selector.setAttribute("aria-pressed", String(isSelected));
  });
  if (!item) {
    heroAddButton.disabled = true;
    heroTitle.textContent = "Nothing on this search";
    heroVietnamese.textContent = "";
    heroDescription.textContent = "Try another dish or clear the search to browse the full menu.";
    heroCategory.textContent = "Menu search";
    heroPrice.textContent = "—";
    return;
  }
  const presentation = getPresentation(item);
  clearTimeout(heroTransitionTimer);
  heroVisual.className = `hero-visual category-${categoryClass(item.category)}`;
  if (shouldAnimate) {
    void heroVisual.offsetWidth;
    heroVisual.classList.add("is-switching");
    heroTransitionTimer = setTimeout(() => heroVisual.classList.remove("is-switching"), 520);
  }
  heroTitle.textContent = presentation.englishName;
  heroVietnamese.textContent = presentation.vietnameseName;
  heroDescription.textContent = item.description || "A carefully considered dish, made for your table.";
  heroCategory.textContent = categoryLabel(item.category);
  heroPrice.textContent = formatPrice(item.price);
  visualCaption.textContent = presentation.vietnameseName;
  heroAddButton.disabled = false;
  setHeroImage(item, presentation);
}

function setHeroImage(item, presentation) {
  const imageSource = imageFor(item);
  heroImage.hidden = true;
  heroImage.removeAttribute("src");
  if (!imageSource) return;
  heroImage.onload = () => { heroImage.hidden = false; };
  heroImage.onerror = () => { heroImage.hidden = true; heroImage.removeAttribute("src"); };
  heroImage.src = imageSource;
  heroImage.alt = `${presentation.englishName} (${presentation.vietnameseName})`;
}

function addToCart(item) {
  if (!item) return;
  const existing = cart.find((cartItem) => cartItem.id === item.id);
  if (existing) existing.quantity += 1;
  else cart.push({ id: item.id, name: item.name, price: item.price, quantity: 1 });
  renderCart();
}

function changeQuantity(id, difference) {
  const item = cart.find((cartItem) => cartItem.id === id);
  if (!item) return;
  item.quantity += difference;
  if (item.quantity <= 0) removeFromCart(id);
  else renderCart();
}

function removeFromCart(id) { cart = cart.filter((item) => item.id !== id); renderCart(); }

function renderCart() {
  cartList.innerHTML = "";
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = itemCount;
  cartCount.setAttribute("aria-label", `${itemCount} ${itemCount === 1 ? "item" : "items"}`);
  emptyCart.hidden = cart.length > 0;
  cart.forEach((item) => {
    const presentation = getPresentation(item);
    const row = document.createElement("li"); row.className = "cart-item";
    const details = document.createElement("div");
    const name = document.createElement("p"); name.textContent = presentation.englishName;
    const vietnamese = document.createElement("small"); vietnamese.className = "cart-vietnamese"; vietnamese.textContent = presentation.vietnameseName;
    const itemPrice = document.createElement("span"); itemPrice.textContent = formatPrice(item.price * item.quantity);
    details.append(name, vietnamese, itemPrice);
    const controls = document.createElement("div"); controls.className = "quantity-controls";
    const decrease = quantityButton("−", `Decrease ${presentation.englishName}`, () => changeQuantity(item.id, -1));
    const quantity = document.createElement("span"); quantity.textContent = item.quantity; quantity.setAttribute("aria-label", `Quantity ${item.quantity}`);
    const increase = quantityButton("+", `Increase ${presentation.englishName}`, () => changeQuantity(item.id, 1));
    const remove = quantityButton("×", `Remove ${presentation.englishName}`, () => removeFromCart(item.id)); remove.classList.add("remove-item");
    controls.append(decrease, quantity, increase, remove); row.append(details, controls); cartList.append(row);
  });
  totalEl.textContent = formatPrice(cart.reduce((sum, item) => sum + item.price * item.quantity, 0));
}

function quantityButton(label, ariaLabel, onClick) {
  const button = document.createElement("button");
  button.type = "button"; button.textContent = label; button.setAttribute("aria-label", ariaLabel); button.addEventListener("click", onClick);
  return button;
}

heroAddButton.addEventListener("click", () => addToCart(selectedItem));
let searchTimer;
searchBox.addEventListener("input", (event) => { clearTimeout(searchTimer); searchTimer = setTimeout(() => loadMenu(event.target.value.trim()), 300); });

orderForm.addEventListener("submit", async (event) => {
  event.preventDefault(); orderMessage.innerHTML = "";
  const customerName = document.getElementById("customerName").value.trim();
  const tableNumber = document.getElementById("tableNumber").value.trim();
  if (customerName === "") { showOrderMessage("Please enter your name", "error"); return; }
  if (cart.length === 0) { showOrderMessage("Your cart is empty", "error"); return; }
  try {
    const order = await apiPost("/orders", { customerName, tableNumber, items: cart });
    showOrderMessage(`Order placed successfully! Your order number is #${order.id} — save it to track your order.`, "success");
    cart = []; renderCart(); orderForm.reset();
  } catch (err) { showOrderMessage(`Failed to place order: ${err.message}`, "error"); }
});

function showOrderMessage(message, type) {
  const paragraph = document.createElement("p");
  paragraph.className = `message ${type}`; paragraph.textContent = message; orderMessage.replaceChildren(paragraph);
}

loadMenu();
