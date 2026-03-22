const express = require("express");
const http = require("http");
const os = require("os");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const ROLES = [
  { id: "AA", label: "AA" },
  { id: "BB", label: "BB" },
  { id: "CC", label: "CC (Openclaw)" }
];
const VALID_ROLES = ROLES.map((role) => role.id);
const MAX_HISTORY = 120;
const MAX_MESSAGE_LENGTH = 500;

const history = [];
const sessions = new Map();

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/network", (_req, res) => {
  const addresses = getLanAddresses();
  res.json({
    port: PORT,
    host: HOST,
    addresses,
    suggestedUrls: addresses.map((address) => `http://${address}:${PORT}`)
  });
});

app.get("/healthz", (_req, res) => {
  res.json({
    ok: true,
    port: PORT,
    host: HOST,
    roles: VALID_ROLES,
    connectedClients: sessions.size,
    historySize: history.length
  });
});

app.use((_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

io.on("connection", (socket) => {
  socket.emit("session:init", {
    history,
    roles: ROLES,
    occupiedRoles: getOccupiedRoles(),
    network: getNetworkPayload()
  });

  socket.on("role:claim", (payload = {}) => {
    const requestedRole = typeof payload.role === "string" ? payload.role.trim().toUpperCase() : "";

    if (!VALID_ROLES.includes(requestedRole)) {
      socket.emit("role:error", { message: `Invalid role. Use one of: ${VALID_ROLES.join(" / ")}.` });
      return;
    }

    const ownerId = findSocketIdByRole(requestedRole);
    if (ownerId && ownerId !== socket.id) {
      socket.emit("role:error", { message: `${requestedRole} is already claimed by another client.` });
      return;
    }

    const previousSession = sessions.get(socket.id);
    sessions.set(socket.id, {
      role: requestedRole,
      joinedAt: new Date().toISOString()
    });

    socket.emit("role:accepted", {
      role: requestedRole,
      roles: ROLES,
      occupiedRoles: getOccupiedRoles()
    });

    io.emit("presence:update", {
      occupiedRoles: getOccupiedRoles()
    });

    if (!previousSession || previousSession.role !== requestedRole) {
      pushSystemMessage(`${requestedRole} joined the room.`);
    }
  });

  socket.on("chat:message", (payload = {}) => {
    const session = sessions.get(socket.id);
    if (!session) {
      socket.emit("chat:error", { message: "Claim a role before sending messages." });
      return;
    }

    const rawText = typeof payload.text === "string" ? payload.text : "";
    const text = rawText.trim();

    if (!text) {
      return;
    }

    if (text.length > MAX_MESSAGE_LENGTH) {
      socket.emit("chat:error", { message: `Messages must be ${MAX_MESSAGE_LENGTH} characters or fewer.` });
      return;
    }

    const message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind: "chat",
      role: session.role,
      text,
      createdAt: new Date().toISOString()
    };

    history.push(message);
    trimHistory();
    io.emit("chat:message", message);
  });

  socket.on("typing:start", () => {
    const session = sessions.get(socket.id);
    if (!session) {
      return;
    }

    socket.broadcast.emit("typing:update", {
      role: session.role,
      isTyping: true
    });
  });

  socket.on("typing:stop", () => {
    const session = sessions.get(socket.id);
    if (!session) {
      return;
    }

    socket.broadcast.emit("typing:update", {
      role: session.role,
      isTyping: false
    });
  });

  socket.on("disconnect", () => {
    const session = sessions.get(socket.id);
    sessions.delete(socket.id);

    io.emit("presence:update", {
      occupiedRoles: getOccupiedRoles()
    });

    if (session) {
      io.emit("typing:update", {
        role: session.role,
        isTyping: false
      });
      pushSystemMessage(`${session.role} left the room.`);
    }
  });
});

server.listen(PORT, HOST, () => {
  const network = getNetworkPayload();
  console.log(`AA/BB/CC LAN chat is running on http://localhost:${PORT}`);
  if (network.suggestedUrls.length > 0) {
    console.log("LAN access:");
    for (const url of network.suggestedUrls) {
      console.log(`  ${url}`);
    }
  } else {
    console.log("No private LAN address detected yet.");
  }
});

function getOccupiedRoles() {
  const occupied = {};
  for (const role of VALID_ROLES) {
    occupied[role] = Boolean(findSocketIdByRole(role));
  }
  return occupied;
}

function findSocketIdByRole(role) {
  for (const [socketId, session] of sessions.entries()) {
    if (session.role === role) {
      return socketId;
    }
  }
  return null;
}

function pushSystemMessage(text) {
  const message = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind: "system",
    text,
    createdAt: new Date().toISOString()
  };

  history.push(message);
  trimHistory();
  io.emit("chat:message", message);
}

function trimHistory() {
  while (history.length > MAX_HISTORY) {
    history.shift();
  }
}

function getNetworkPayload() {
  const addresses = getLanAddresses();
  return {
    port: PORT,
    addresses,
    suggestedUrls: addresses.map((address) => `http://${address}:${PORT}`)
  };
}

function getLanAddresses() {
  const interfaces = os.networkInterfaces();
  const found = [];

  for (const items of Object.values(interfaces)) {
    if (!items) {
      continue;
    }

    for (const item of items) {
      if (!item || item.family !== "IPv4" || item.internal) {
        continue;
      }

      if (isPrivateLan(item.address) && !found.includes(item.address)) {
        found.push(item.address);
      }
    }
  }

  return found.sort((left, right) => {
    if (left.startsWith("192.168.") && !right.startsWith("192.168.")) {
      return -1;
    }
    if (!left.startsWith("192.168.") && right.startsWith("192.168.")) {
      return 1;
    }
    return left.localeCompare(right);
  });
}

function isPrivateLan(address) {
  if (address.startsWith("192.168.")) {
    return true;
  }

  if (address.startsWith("10.")) {
    return true;
  }

  const match = address.match(/^172\.(\d+)\./);
  if (!match) {
    return false;
  }

  const secondOctet = Number(match[1]);
  return secondOctet >= 16 && secondOctet <= 31;
}
