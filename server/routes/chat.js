const express = require("express");
const router = express.Router();
const { readData, writeData, nextId } = require("../utils/db");
const { requireAdmin } = require("../middleware/adminAuth");

const MESSAGE_FILE = "messages.json";
const ORDER_FILE = "orders.json";
const CHAT_POLL_MS = 0; // Polling is controlled by the browser clients.

function findOrder(orderId) {
  return readData(ORDER_FILE).find((order) => order.id === Number(orderId));
}

function getMessages() {
  return readData(MESSAGE_FILE);
}

function validateMessage(req, res, next) {
  const message = String(req.body.message || "").trim();
  if (!message) return res.status(400).json({ error: "Message cannot be empty" });
  if (message.length > 2000) return res.status(400).json({ error: "Message is too long (max 2000 characters)" });
  req.messageText = message;
  next();
}

// Customer endpoints. The order number is the conversation identifier.
router.get("/orders/:orderId/messages", (req, res) => {
  const order = findOrder(req.params.orderId);
  if (!order) return res.status(404).json({ error: "Order not found" });
  const after = Number(req.query.after || 0);
  const messages = getMessages().filter((m) => m.orderId === order.id && m.id > after);
  res.json(messages);
});

router.post("/orders/:orderId/messages", validateMessage, (req, res) => {
  const order = findOrder(req.params.orderId);
  if (!order) return res.status(404).json({ error: "Order not found" });
  const messages = getMessages();
  const newMessage = {
    id: nextId(messages),
    orderId: order.id,
    sender: "customer",
    senderName: order.customerName || "Customer",
    message: req.messageText,
    createdAt: new Date().toISOString(),
  };
  messages.push(newMessage);
  writeData(MESSAGE_FILE, messages);
  res.status(201).json(newMessage);
});

// Admin-only inbox. Keep this route before /orders/:orderId/messages.
router.get("/conversations", requireAdmin, (req, res) => {
  const orders = readData(ORDER_FILE);
  const messages = getMessages();
  const conversations = orders.map((order) => {
    const orderMessages = messages.filter((m) => m.orderId === order.id);
    const latest = orderMessages[orderMessages.length - 1] || null;
    return {
      orderId: order.id,
      customerName: order.customerName || "Customer",
      orderStatus: order.status,
      messageCount: orderMessages.length,
      latestMessage: latest,
    };
  }).filter((conversation) => conversation.messageCount > 0)
    .sort((a, b) => new Date(b.latestMessage.createdAt) - new Date(a.latestMessage.createdAt));
  res.json(conversations);
});

router.get("/admin/orders/:orderId/messages", requireAdmin, (req, res) => {
  const order = findOrder(req.params.orderId);
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(getMessages().filter((m) => m.orderId === order.id));
});

router.post("/admin/orders/:orderId/messages", requireAdmin, validateMessage, (req, res) => {
  const order = findOrder(req.params.orderId);
  if (!order) return res.status(404).json({ error: "Order not found" });
  const messages = getMessages();
  const newMessage = {
    id: nextId(messages),
    orderId: order.id,
    sender: "admin",
    senderName: "Phở Việt Support",
    message: req.messageText,
    createdAt: new Date().toISOString(),
  };
  messages.push(newMessage);
  writeData(MESSAGE_FILE, messages);
  res.status(201).json(newMessage);
});

module.exports = router;
