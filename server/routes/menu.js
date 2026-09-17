const express = require("express");
const router = express.Router();
const { readData, writeData, nextId } = require("../utils/db");

const FILE = "menu.json";

// GET /api/menu - get the full menu
// Supports filtering: /api/menu?category=noodles or /api/menu?search=pho
router.get("/", (req, res) => {
  let menu = readData(FILE);
  const { category, search } = req.query;

  if (category) {
    menu = menu.filter((item) => item.category === category);
  }
  if (search) {
    const term = search.toLowerCase();
    menu = menu.filter((item) => item.name.toLowerCase().includes(term));
  }

  res.json(menu);
});

// GET /api/menu/:id - get a single dish
router.get("/:id", (req, res) => {
  const menu = readData(FILE);
  const item = menu.find((m) => m.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: "Dish not found" });
  res.json(item);
});

// POST /api/menu - (admin) add a new dish
router.post("/", (req, res) => {
  const { name, description, price, category, image } = req.body;

  if (!name || !price) {
    return res.status(400).json({ error: "Missing required field: name or price" });
  }

  const menu = readData(FILE);
  const newItem = {
    id: nextId(menu),
    name,
    description: description || "",
    price: Number(price),
    category: category || "other",
    image: image || "",
    available: true,
  };

  menu.push(newItem);
  writeData(FILE, menu);
  res.status(201).json(newItem);
});

// PUT /api/menu/:id - (admin) update a dish
router.put("/:id", (req, res) => {
  const menu = readData(FILE);
  const index = menu.findIndex((m) => m.id === Number(req.params.id));

  if (index === -1) {
    return res.status(404).json({ error: "Dish not found" });
  }

  // Explanation: "..." (spread) copies all fields from the old item,
  // then copies all fields from req.body on top (overwriting anything
  // the client sent), then we force id back to the original value so
  // the client can never accidentally change an item's id.
  menu[index] = { ...menu[index], ...req.body, id: menu[index].id };
  writeData(FILE, menu);
  res.json(menu[index]);
});

// DELETE /api/menu/:id - (admin) remove a dish
router.delete("/:id", (req, res) => {
  const menu = readData(FILE);
  const filtered = menu.filter((m) => m.id !== Number(req.params.id));

  if (filtered.length === menu.length) {
    return res.status(404).json({ error: "Dish not found" });
  }

  writeData(FILE, filtered);
  res.json({ message: "Dish deleted" });
});

module.exports = router;
