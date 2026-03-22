const fs = require("node:fs");
const path = require("node:path");
const { io } = require("socket.io-client");

const args = parseArgs(process.argv.slice(2));
const VALID_ROLES = ["AA", "BB", "CC"];
const role = (args.role || "").toUpperCase();
const url = args.url || "http://127.0.0.1:3000";
const waitMs = Number(args.waitMs || 800);

if (!role) {
  fail("Missing --role. Example: node scripts/send-chat.js --role AA --file .\\message.txt");
}

if (!VALID_ROLES.includes(role)) {
  fail(`Invalid --role. Use one of: ${VALID_ROLES.join(", ")}.`);
}

const text = readText(args);
if (!text.trim()) {
  fail("Outgoing message is empty. Use --text, --file, or pipe UTF-8 text to stdin.");
}

const socket = io(url, {
  transports: ["websocket"],
  forceNew: true
});

const timeout = setTimeout(() => {
  fail(`Timed out while sending message to ${url}.`);
}, 10000);

socket.on("connect", () => {
  socket.emit("role:claim", { role });
});

socket.on("role:accepted", () => {
  socket.emit("chat:message", { text });
  setTimeout(() => {
    cleanup(0);
  }, waitMs);
});

socket.on("role:error", (payload) => {
  fail(payload && payload.message ? payload.message : "Role claim failed.");
});

socket.on("chat:error", (payload) => {
  fail(payload && payload.message ? payload.message : "Chat send failed.");
});

socket.on("connect_error", (error) => {
  fail(error && error.message ? error.message : "Connection failed.");
});

function readText(options) {
  if (typeof options.text === "string") {
    return options.text;
  }

  if (typeof options.file === "string") {
    const filePath = path.resolve(process.cwd(), options.file);
    return fs.readFileSync(filePath, "utf8");
  }

  if (!process.stdin.isTTY) {
    return fs.readFileSync(0, "utf8");
  }

  return "";
}

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
      continue;
    }

    parsed[key] = next;
    index += 1;
  }

  return parsed;
}

function cleanup(code) {
  clearTimeout(timeout);
  socket.disconnect();
  process.exit(code);
}

function fail(message) {
  console.error(message);
  cleanup(1);
}
