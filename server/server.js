const express = require("express");
const cors = require("cors");
const path = require("path");

const menuRoutes = require("./routes/menu");
const orderRoutes = require("./routes/orders");
const { ADMIN_KEY } = require("./middleware/adminAuth");

const app = express();
const PORT = process.env.PORT || 3000;

// cors() allows the browser to call this API from a different origin
// (e.g. Live Server on port 5500) without the request being blocked.
app.use(cors());
// express.json() parses incoming JSON request bodies into req.body,
// so routes can read things like req.body.name directly.
app.use(express.json());

app.post("/api/admin/login", (req, res) => {
  const { key } = req.body;
  if (key === ADMIN_KEY) return res.json({ ok: true });
  res.status(401).json({ error: "Sai admin key" });
});

// Expose the API: /api/menu and /api/orders
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);

// (Optional) Let Express also serve the static frontend files,
// so both sides can be tested from the same origin without CORS issues
app.use(express.static(path.join(__dirname, "..", "client")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Since the frontend entry file is now named "Ordering_page.html"
// (not the default "index.html"), express.static will no longer
// auto-serve a page at "/". This route redirects "/" there so
// http://localhost:3000 still works out of the box.
app.get("/", (req, res) => {
  res.redirect("/Ordering_page.html");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
