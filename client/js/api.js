// Base URL of the API - change this if you deploy the backend elsewhere
const API_BASE = "http://localhost:3000/api";

// Reads the saved admin key (if logged in) and turns it into a header
// object to attach to requests. Empty object if not logged in yet,
// meaning the request goes out with no x-admin-key header at all.
function authHeaders() {
  const key = sessionStorage.getItem("adminKey");
  return key ? { "x-admin-key": key } : {};
}

async function apiGet(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`GET ${endpoint} failed: ${res.status}`);
  return res.json();
}

async function apiPost(endpoint, data) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`POST ${endpoint} failed: ${res.status}`);
  return res.json();
}

async function apiPut(endpoint, data) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`PUT ${endpoint} failed: ${res.status}`);
  return res.json();
}

async function apiDelete(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error(`DELETE ${endpoint} failed: ${res.status}`);
  return res.json();
}