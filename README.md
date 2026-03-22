# AA BB LAN Chat

[![CI](https://github.com/a123456789040-creator/aa-bb-lan-chat/actions/workflows/ci.yml/badge.svg)](https://github.com/a123456789040-creator/aa-bb-lan-chat/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/tag/a123456789040-creator/aa-bb-lan-chat?label=release)](https://github.com/a123456789040-creator/aa-bb-lan-chat/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

A small LAN chat app for three fixed participants: `AA`, `BB`, and `CC`.

The project is intentionally simple: one Node.js server, one static frontend, and a few helper scripts for smoke testing and sending messages from the terminal. It is useful as a local collaboration demo, a Socket.IO reference project, or a starting point for lightweight team tools on the same network.

![AA BB LAN Chat demo](./docs/assets/aa-bb-lan-chat-demo.png)

## Features

- Fixed role claiming for `AA`, `BB`, and `CC`
- Live chat with Socket.IO over the local network
- Presence indicators so you can see which roles are occupied
- Typing status updates
- In-memory message history for recent messages
- LAN URL discovery via private IPv4 addresses
- CLI helpers for smoke testing, history reads, and scripted message sending

## Quick Start

Requirements:

- Node.js 18 or newer

Install dependencies:

```bash
npm install
```

Start the server:

```bash
npm start
```

Open the app in your browser:

```text
http://localhost:3000
```

If your machine has a private LAN address, the server will also print URLs such as:

```text
http://192.168.x.x:3000
```

Devices on the same LAN can open that URL and claim one of the three roles.

## Available Scripts

- `npm start`: start the server
- `npm run dev`: restart automatically when `server.js` changes
- `npm run smoke`: launch the server and verify that AA, BB, and CC can connect and exchange messages
- `npm run history`: print recent message history as JSON
- `npm run demo:seed`: send a short demo conversation to a running server
- `npm test`: alias for the smoke test

## Command-Line Helpers

Send a message from a file:

```bash
node scripts/send-chat.js --role AA --file ./message.txt
```

Send a message inline:

```bash
node scripts/send-chat.js --role BB --text "Update accepted."
```

Read the last 10 messages from a running server:

```bash
node scripts/read-history.js --limit 10
```

Use a custom server URL:

```bash
node scripts/send-chat.js --role CC --url http://127.0.0.1:3010 --text "Ready."
```

Seed a running server with example messages for demos or screenshots:

```bash
npm run demo:seed -- --url http://127.0.0.1:3000
```

## Environment Variables

- `PORT`: server port, defaults to `3000`
- `HOST`: bind host, defaults to `0.0.0.0`

Example:

```bash
PORT=3010 HOST=0.0.0.0 npm start
```

PowerShell:

```powershell
$env:PORT = 3010
$env:HOST = "0.0.0.0"
npm start
```

## HTTP Endpoints

- `GET /`: chat UI
- `GET /api/network`: LAN address information and suggested URLs
- `GET /healthz`: lightweight health check

## Project Structure

```text
aa-bb-lan-chat/
|- public/
|  |- app.js
|  |- index.html
|  `- styles.css
|- scripts/
|  |- read-history.js
|  |- send-chat.js
|  `- smoke-test.js
|- server.js
`- package.json
```

## Limits and Tradeoffs

- Message history is stored in memory only
- There is no authentication beyond claiming one of the fixed roles
- Only three roles are supported out of the box
- This project is meant for trusted local networks, not internet exposure

## Roadmap

- Add optional persistent storage for recent message history
- Support configurable role names or room presets
- Add lightweight access controls for shared LAN environments

## Maintenance

- CI runs `npm test` on pushes and pull requests
- GitHub issue templates are included for bugs and feature requests
- CODEOWNERS is configured for the primary maintainer
- Security reporting guidance is documented in [SECURITY.md](./SECURITY.md)

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.

## License

MIT. See [LICENSE](./LICENSE).
