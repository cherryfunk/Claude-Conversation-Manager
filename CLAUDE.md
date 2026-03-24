# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Conversation Manager (CCM) is a VS Code extension that visualizes Claude Code conversations as interactive tree diagrams. It reads conversation history from `~/.claude/projects/` and renders them as a timeline view with fork support. Pure TypeScript with strict type checking throughout.

## Architecture

Four-part monorepo, all TypeScript:

- **shared/** — Shared types (`types.ts`) and unified parser (`parser.ts`). Compiles to CommonJS (`shared/dist/`). Both extension and server depend on `@ccm/shared`.
- **extension/** — VS Code extension (CommonJS). Creates a webview panel, handles message passing, and watches `~/.claude/projects/` for file changes to auto-reload the UI. Compiles to `extension/dist/`.
- **server/** — Express.js REST API (ESM, port 3001). Used only in dev mode. Includes SSE endpoint (`/api/events`) for auto-reload. Compiles to `server/dist/`.
- **client/** — React SPA (Vite + Tailwind + TypeScript). Uses @xyflow/react for graph visualization. Builds to `extension/webview/`. Type-checked by `tsc --noEmit` (Vite handles the actual build).

**Auto-reload:** The extension watches `~/.claude/projects/**/*.jsonl` via `vscode.workspace.createFileSystemWatcher` and pushes `refresh` messages to the webview. In dev mode, the server uses `fs.watch` + SSE. The client hooks (`useProjects`, `useConversations`) subscribe via `onRefresh()` and re-fetch automatically.

**Dual API client:** `client/src/lib/api.ts` detects whether it's running inside VS Code (webview message passing) or standalone (HTTP fetch to server + SSE for refresh).

## Development Commands

```bash
# Run dev mode (client + server concurrently)
npm run dev

# Build everything (shared → server → extension → client)
npm run build

# Type-check all packages (no emit)
npm run typecheck

# Build individual packages
npm run build:shared
npm run build:server
npm run build:extension
cd client && npm run build

# Run client only (Vite on port 5173)
cd client && npm run dev
```

The Vite dev server proxies `/api` requests to the Express server at localhost:3001.

To test the extension: open the repo in VS Code, press F5, then run command `CCM: Open Conversation Manager`.

## Build Dependencies

Shared must be built before extension or server (`shared/dist/` must exist). The build scripts handle this ordering. When modifying shared types or parser, rebuild shared first: `npm run build:shared`.

## Data Flow

1. Parser (`shared/src/parser.ts`) scans `~/.claude/projects/` directories and cross-references `~/.claude/history.jsonl` for readable project paths
2. Reads JSONL session files, filters for `user`/`assistant`/`system` message types
3. Builds tree structure via `uuid`/`parentUuid` linking
4. Client assigns timeline positions and lanes via `buildTree.ts`, renders with React Flow
5. File watchers detect changes on disk and push refresh signals to trigger re-fetch

## No Tests or Linting

No test framework, linter, or formatter is currently configured.
