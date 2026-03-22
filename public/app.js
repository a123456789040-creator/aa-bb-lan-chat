const socket = io();

const state = {
  role: null,
  roles: ["AA", "BB", "CC"],
  occupiedRoles: {
    AA: false,
    BB: false,
    CC: false
  }
};

const messagesEl = document.querySelector("#messages");
const networkListEl = document.querySelector("#networkList");
const sessionBadgeEl = document.querySelector("#sessionBadge");
const roleHintEl = document.querySelector("#roleHint");
const typingStatusEl = document.querySelector("#typingStatus");
const feedbackEl = document.querySelector("#feedback");
const composerEl = document.querySelector("#composer");
const messageInputEl = document.querySelector("#messageInput");
const messageMetaEl = document.querySelector("#messageMeta");
const sendButtonEl = document.querySelector("#sendButton");
const presenceAAEl = document.querySelector("#presenceAA");
const presenceBBEl = document.querySelector("#presenceBB");
const presenceCCEl = document.querySelector("#presenceCC");
const roleButtons = Array.from(document.querySelectorAll(".role-button"));

let typingTimer = null;
let typingActive = false;

composerEl.addEventListener("submit", (event) => {
  event.preventDefault();

  const text = messageInputEl.value.trim();
  if (!text) {
    setFeedback("Write a message before sending.", true);
    return;
  }

  if (!state.role) {
    setFeedback("Claim AA, BB, or CC before sending a message.", true);
    return;
  }

  socket.emit("chat:message", { text });
  messageInputEl.value = "";
  updateMessageMeta();
  stopTyping();
  setFeedback("Message sent.", false);
});

messageInputEl.addEventListener("input", () => {
  setFeedback("", false);
  updateMessageMeta();

  if (!state.role) {
    return;
  }

  if (!typingActive) {
    typingActive = true;
    socket.emit("typing:start");
  }

  if (typingTimer) {
    clearTimeout(typingTimer);
  }

  typingTimer = window.setTimeout(() => {
    stopTyping();
  }, 1200);
});

roleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const role = button.dataset.role;
    socket.emit("role:claim", { role });
  });
});

socket.on("session:init", (payload) => {
  applyRoles(payload.roles || []);
  renderHistory(payload.history || []);
  applyPresence(payload.occupiedRoles || {});
  renderNetwork(payload.network || {});
  updateMessageMeta();
});

socket.on("role:accepted", (payload) => {
  state.role = payload.role;
  applyRoles(payload.roles || []);
  applyPresence(payload.occupiedRoles || {});
  sessionBadgeEl.textContent = `Role: ${payload.role}`;
  sessionBadgeEl.classList.remove("badge-idle");
  roleHintEl.textContent = `You are chatting as ${payload.role}. Other devices on the LAN can claim the remaining roles.`;
  messageInputEl.placeholder = `Send a message as ${payload.role}...`;
  messageInputEl.focus();
  updateRoleButtons();
  setFeedback(`${payload.role} claimed successfully.`, false);
});

socket.on("role:error", (payload) => {
  setFeedback(payload.message || "Could not claim that role.", true);
});

socket.on("chat:error", (payload) => {
  setFeedback(payload.message || "Could not send the message.", true);
});

socket.on("presence:update", (payload) => {
  applyPresence(payload.occupiedRoles || {});
});

socket.on("typing:update", (payload) => {
  if (!payload || !payload.role) {
    typingStatusEl.textContent = "Nobody is typing right now.";
    return;
  }

  if (payload.isTyping) {
    typingStatusEl.textContent = `${payload.role} is typing...`;
    return;
  }

  typingStatusEl.textContent = "Nobody is typing right now.";
});

socket.on("chat:message", (message) => {
  appendMessage(message);
  setFeedback("", false);
});

function renderHistory(history) {
  messagesEl.innerHTML = "";
  history.forEach((message) => appendMessage(message));
}

function appendMessage(message) {
  const item = document.createElement("article");
  const kind = message.kind || "chat";
  item.className = `message ${kind} ${message.role ? message.role.toLowerCase() : ""}`.trim();

  const when = formatTime(message.createdAt);
  if (kind === "system") {
    item.innerHTML = `
      <div class="message-head">
        <span class="message-role">System</span>
        <span>${when}</span>
      </div>
      <div class="message-body">${escapeHtml(message.text || "")}</div>
    `;
  } else {
    item.innerHTML = `
      <div class="message-head">
        <span class="message-role">${escapeHtml(message.role || "Unknown")}</span>
        <span>${when}</span>
      </div>
      <div class="message-body">${escapeHtml(message.text || "")}</div>
    `;
  }

  messagesEl.appendChild(item);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function applyPresence(occupiedRoles) {
  const next = {};
  state.roles.forEach((role) => {
    next[role] = Boolean(occupiedRoles[role]);
  });
  state.occupiedRoles = next;

  presenceAAEl.classList.toggle("is-online", Boolean(state.occupiedRoles.AA));
  presenceBBEl.classList.toggle("is-online", Boolean(state.occupiedRoles.BB));
  presenceCCEl.classList.toggle("is-online", Boolean(state.occupiedRoles.CC));
  updateRoleButtons();
}

function updateRoleButtons() {
  roleButtons.forEach((button) => {
    const role = button.dataset.role;
    const occupied = state.occupiedRoles[role];
    const ownedByMe = state.role === role;
    button.disabled = occupied && !ownedByMe;
    button.textContent = ownedByMe ? `${role} claimed` : `Claim ${role}`;
  });

  sendButtonEl.disabled = !state.role;
}

function applyRoles(roles) {
  const ids = roles
    .map((role) => {
      if (typeof role === "string") {
        return role;
      }
      return role && typeof role.id === "string" ? role.id : null;
    })
    .filter(Boolean);

  if (ids.length > 0) {
    state.roles = ids;
  }
}

function renderNetwork(network) {
  const urls = Array.isArray(network.suggestedUrls) ? network.suggestedUrls : [];
  if (urls.length === 0) {
    networkListEl.innerHTML = `
      <div class="network-empty">
        No private LAN address detected yet. You can still use <strong>http://localhost:${network.port || 3000}</strong>.
      </div>
    `;
    return;
  }

  networkListEl.innerHTML = urls
    .map(
      (url, index) => `
        <div class="network-item">
          <strong>${index === 0 ? "Recommended URL" : "Additional URL"}</strong>
          <span>${escapeHtml(url)}</span>
        </div>
      `
    )
    .join("");
}

function setFeedback(message, isError) {
  feedbackEl.textContent = message;
  feedbackEl.classList.toggle("is-error", Boolean(message) && isError);
  feedbackEl.classList.toggle("is-success", Boolean(message) && !isError);
}

function stopTyping() {
  if (!typingActive) {
    return;
  }

  typingActive = false;
  socket.emit("typing:stop");

  if (typingTimer) {
    clearTimeout(typingTimer);
    typingTimer = null;
  }
}

function updateMessageMeta() {
  const length = messageInputEl.value.length;
  messageMetaEl.textContent = `${length} / 500 characters`;
}

function formatTime(isoString) {
  if (!isoString) {
    return "";
  }

  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}
