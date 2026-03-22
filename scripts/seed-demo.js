const { spawnSync } = require("node:child_process");

const args = parseArgs(process.argv.slice(2));
const url = args.url || "http://127.0.0.1:3000";

const demoMessages = [
  { role: "AA", text: "AA: local server ready." },
  { role: "BB", text: "BB: smoke test passed and screenshot prep is done." },
  { role: "CC", text: "CC: waiting for the LAN demo snapshot." }
];

for (const entry of demoMessages) {
  const result = spawnSync(
    process.execPath,
    ["scripts/send-chat.js", "--role", entry.role, "--url", url, "--text", entry.text],
    {
      cwd: process.cwd(),
      stdio: "inherit"
    }
  );

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
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
