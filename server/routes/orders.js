const express = require("express");
const router = express.Router();
const { readData, writeData, nextId } = require("../utils/db");

const FILE = "orders.json";
const VALID_STATUSES = ["pending", "preparing", "delivering", "completed", "cancelled"];

// GET /api/orders - (admin) view all orders
router.get("/", (req, res) => {
  const orders = readData(FILE);
  res.json(orders);
});

// GET /api/orders/:id - look up a single order by id
router.get("/:id", (req, res) => {
  const orders = readData(FILE);
  const order = orders.find((o) => o.id === Number(req.params.id));
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

// POST /api/orders - customer places a new order
// body: { customerName, tableNumber, items: [{ id, name, price, quantity }] }
router.post("/", (req, res) => {
  const { customerName, tableNumber, items } = req.body;

  if (!customerName || !items || items.length === 0) {
    return res.status(400).json({ error: "Missing customer name or the cart is empty" });
  }

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const orders = readData(FILE);
  const newOrder = {
    id: nextId(orders),
    customerName,
    tableNumber: tableNumber || null,
    items,
    total,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  orders.push(newOrder);
  writeData(FILE, orders);
  res.status(201).json(newOrder);
});

// PUT /api/orders/:id - (admin) update order status
// body: { status: "preparing" }
router.put("/:id", (req, res) => {
  const { status } = req.body;

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `Invalid status. Allowed values: ${VALID_STATUSES.join(", ")}`,
    });
  }

  const orders = readData(FILE);
  const index = orders.findIndex((o) => o.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ error: "Order not found" });
  }

  orders[index].status = status;
  writeData(FILE, orders);
  res.json(orders[index]);
});

router.delete("/:id", (req, res) => {
  const orders = readData(FILE);
  const filtered = orders.filter((o) => o.id !== Number(req.params.id));

  if (filtered.length === orders.length) {
    return res.status(404).json({ error: "Order not found" });
  }

  writeData(FILE, filtered);
  res.json({ message: "Order deleted" });
});

module.exports = router;
