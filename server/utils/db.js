const fs = require("fs");
const path = require("path");

// Read and parse the full content of a JSON file inside data/
function readData(fileName) {
  const filePath = path.join(__dirname, "..", "data", fileName);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "[]", "utf-8");
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

// Overwrite the full content of a JSON file inside data/
function writeData(fileName, data) {
  const filePath = path.join(__dirname, "..", "data", fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// Generate a simple incrementing id based on the current list
// Explanation: list.map(...) turns [{id:1},{id:3}] into [1, 3],
// then "..." (spread) unpacks that array into separate arguments
// so Math.max(1, 3) can find the highest id. We then add 1 to get
// the next free id. This is NOT safe for concurrent writes, but is
// fine for a single-user class project with file-based storage.
function nextId(list) {
  if (list.length === 0) return 1;
  return Math.max(...list.map((item) => item.id)) + 1;
}

module.exports = { readData, writeData, nextId };
