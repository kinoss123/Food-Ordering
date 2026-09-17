const trackForm = document.getElementById("trackForm");
const resultBox = document.getElementById("result");

const STATUS_LABELS = {
  pending: "Pending confirmation",
  preparing: "Preparing",
  delivering: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

trackForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = document.getElementById("orderId").value;
  resultBox.innerHTML = "Searching...";

  try {
    const order = await apiGet(`/orders/${id}`);
    renderOrder(order);
  } catch (err) {
    resultBox.innerHTML = `<p class="message error">Order not found</p>`;
  }
});

function renderOrder(order) {
  const itemsHtml = order.items
    .map((i) => `<li>${i.name} x${i.quantity} - ${(i.price * i.quantity).toLocaleString()} VND</li>`)
    .join("");

  resultBox.innerHTML = `
    <div id="cart">
      <h2>Order #${order.id}</h2>
      <p>Customer: ${order.customerName}</p>
      <p>Table: ${order.tableNumber || "N/A"}</p>
      <p>Status: <span class="status-${order.status}">${STATUS_LABELS[order.status]}</span></p>
      <ul>${itemsHtml}</ul>
      <p id="total">Total: ${order.total.toLocaleString()} VND</p>
    </div>
  `;
}
