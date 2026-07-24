# court (Court of Miracles)

A modern MU* game built with the [UrsaMU](https://github.com/ursamu/ursamu) engine.

## Architecture

- **Main Server** (`src/main.ts`) — game engine, database, WebSocket, HTTP API
- **Telnet Server** (`src/telnet.ts`) — classic MU* connections, runs as a separate process

### Ports

| Protocol | Port |
|----------|------|
| Telnet   | 4201 |
| WebSocket | 4202 |
| HTTP API | 4203 |

## Getting Started

```bash
deno task start
```

This starts both servers with watch mode enabled.

## Connecting

- Telnet: `telnet localhost 4201`
- WebSocket: `ws://localhost:4202`
- HTTP API: `http://localhost:4203/api/...`

## Project Structure

```
court/
├── config/             Configuration files
├── data/               Database files
├── help/               In-game help files
├── scripts/            Utility scripts (run.sh, etc.)
├── src/
│   ├── main.ts         Main server entry point
│   ├── telnet.ts       Telnet server entry point
│   └── plugins/        Custom plugins
├── system/scripts/     Engine system scripts (editable)
├── text/
│   └── default_connect.txt  Welcome screen
├── wiki/               Game wiki and documentation
└── deno.json           Tasks and import map
```

## Layout chrome

Headers, dividers, and footers are themed via `game.layout` in `config/config.json`:

```json
"layout": {
  "header":  "[center(%ch%cy%0%cn,%1,%cg=%cn)]",
  "divider": "[center(%ch%cy%0%cn,%1,%cg-%cn)]",
  "footer":  "[repeat(%cg=%cn,%1)]"
}
```

Help, BBS, and native commands all honor these templates.

## CoFD & Engine Plugins

Chronicles of Darkness 2e and other features are enabled via `@ursamu/jobs`, `@ursamu/cofd-plugin`, and `@ursamu/lang-plugin` in `server.plugins`. In-game: `+cg`, `+sheet`, `+roll`, `help cofd`.

## Extending

Add plugins to `src/plugins/`:

```bash
deno run -A jsr:@ursamu/ursamu/cli create plugin my-feature
```

## Documentation

- [UrsaMU Docs](https://ursamu.github.io/ursamu/)
- [GitHub](https://github.com/ursamu/ursamu)

## License

MIT
