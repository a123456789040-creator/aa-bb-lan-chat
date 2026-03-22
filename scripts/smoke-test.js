const { spawn } = require("node:child_process");
const { io } = require("socket.io-client");

const PORT = 3060;
const HOST = "127.0.0.1";
const URL = `http://${HOST}:${PORT}`;

const server = spawn(process.execPath, ["server.js"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    PORT: String(PORT),
    HOST
  },
  stdio: ["ignore", "pipe", "pipe"]
});

let serverStdout = "";
let serverStderr = "";

server.stdout.on("data", (data) => {
  serverStdout += data.toString();
});

server.stderr.on("data", (data) => {
  serverStderr += data.toString();
});

waitForServer()
  .then(runScenario)
  .then(() => {
    console.log("Smoke test passed: AA, BB, and CC exchanged messages successfully.");
    shutdown(0);
  })
  .catch((error) => {
    console.error(error.message);
    shutdown(1);
  });

function waitForServer() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Server did not start in time.\nSTDOUT:\n${serverStdout}\nSTDERR:\n${serverStderr}`));
    }, 5000);

    const interval = setInterval(() => {
      if (serverStdout.includes(`http://localhost:${PORT}`)) {
        clearTimeout(timeout);
        clearInterval(interval);
        resolve();
      }
    }, 150);
  });
}

async function runScenario() {
  const aa = io(URL, {
    transports: ["websocket"],
    forceNew: true
  });
  const bb = io(URL, {
    transports: ["websocket"],
    forceNew: true
  });
  const cc = io(URL, {
    transports: ["websocket"],
    forceNew: true
  });

  try {
    await Promise.all([once(aa, "connect"), once(bb, "connect"), once(cc, "connect")]);

    aa.emit("role:claim", { role: "AA" });
    bb.emit("role:claim", { role: "BB" });
    cc.emit("role:claim", { role: "CC" });
    await Promise.all([once(aa, "role:accepted"), once(bb, "role:accepted"), once(cc, "role:accepted")]);

    const receivedByAA = waitForChatMessage(aa);
    const receivedByBB = waitForChatMessage(bb);
    const receivedByCC = waitForChatMessage(cc);

    aa.emit("chat:message", { text: "AA online." });
    bb.emit("chat:message", { text: "BB online." });
    cc.emit("chat:message", { text: "CC online." });

    const [messageAtAA, messageAtBB, messageAtCC] = await Promise.all([receivedByAA, receivedByBB, receivedByCC]);
    if (!messageAtAA.text || !messageAtBB.text || !messageAtCC.text) {
      throw new Error("Messages were delivered without payload.");
    }
  } finally {
    aa.disconnect();
    bb.disconnect();
    cc.disconnect();
  }
}

function once(socket, eventName) {
  return new Promise((resolve) => {
    socket.once(eventName, resolve);
  });
}

function waitForChatMessage(socket) {
  return new Promise((resolve) => {
    const handler = (payload) => {
      if (!payload || payload.kind !== "chat") {
        return;
      }
      socket.off("chat:message", handler);
      resolve(payload);
    };

    socket.on("chat:message", handler);
  });
}

function shutdown(code) {
  if (!server.killed) {
    server.kill();
  }

  setTimeout(() => {
    process.exit(code);
  }, 150);
}
