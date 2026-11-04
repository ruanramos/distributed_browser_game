# Real-time browser game — WebSocket experiment

A personal learning project exploring **real-time multiplayer communication** with a browser client and a Node.js/TypeScript server.

The source implements a small browser game in which clients can create or join sessions and exchange state through WebSocket messages. The server manages connections, game identifiers, and a shared game state. This repository is a historical experiment, **not a maintained multiplayer service**.

## What is implemented

- **WebSocket messaging** for joining sessions and broadcasting game state.
- **Session management** for game creation, joining, deletion, and basic client-disconnection handling.
- **Browser client UI** using HTML and JavaScript to show sessions and interact with the game.
- **Express HTTP endpoints** for removing one session or clearing sessions.
- **TypeScript server code** and package scripts for compilation and local development.

## Repository guide

| Component | Source |
| --- | --- |
| WebSocket/Express game server | [`src/server.ts`](src/server.ts) |
| Browser interface and client logic | [`src/views/index.html`](src/views/index.html) |
| Experimental persistence-related server | [`src/persistence_server.ts`](src/persistence_server.ts) |
| Scripts and dependencies | [`package.json`](package.json) |
| Existing test | [`src/test/tesing.spec.test.ts`](src/test/tesing.spec.test.ts) |

## Development setup (not recently verified)

The following reflects the commands in `package.json`:

```bash
git clone https://github.com/ruanramos/distributed_browser_game.git
cd distributed_browser_game
npm install
npm run dev
```

The repository declares Node.js 16 and uses packages from the 2021 timeframe. **Current Node.js compatibility has not been verified.** The browser code uses a secure `wss://` WebSocket URL and `https://` HTTP requests; local execution may require adapting the protocol configuration and, for TLS, providing an appropriate reverse proxy. The command above is not a guarantee that the application will run unchanged.

## Known limitations

- **Prototype only.** No claims of production deployment, reliability, or scaling.
- **Very limited automated tests.** The existing test does not exercise multiplayer synchronization or the network protocol.
- **Protocol and input hardening are incomplete.** For example, the server parses incoming JSON without an error-handling boundary.
- **State is maintained in memory** in the main game server. Persistence experiments are separate and should not be treated as an integrated durable storage feature.
- Authentication, security review, modern dependency updates, and performance validation are outside the verified scope of this historical code.

## Context

This repository demonstrates exploration of client/server systems, real-time messaging, and web application behavior. It is best read as an engineering experiment and a starting point for further work rather than a ready-to-deploy product.
