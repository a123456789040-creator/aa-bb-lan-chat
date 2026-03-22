const { io } = require("socket.io-client");

const args = parseArgs(process.argv.slice(2));
const url = args.url || "http://127.0.0.1:3000";
const limit = Math.max(1, Number(args.limit || 20));

const socket = io(url, {
  transports: ["websocket"],
  forceNew: true
});

const timeout = setTimeout(() => {
  fail(`Timed out while reading history from ${url}.`);
}, 10000);

socket.on("session:init", (payload) => {
  const history = Array.isArray(payload.history) ? payload.history : [];
  const recent = history.slice(-limit).map((item) => ({
    kind: item.kind,
    role: item.role || null,
    text: item.text,
    createdAt: item.createdAt
  }));

  console.log(JSON.stringify(recent, null, 2));
  cleanup(0);
});

socket.on("connect_error", (error) => {
  fail(error && error.message ? error.message : "Connection failed.");
});

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
