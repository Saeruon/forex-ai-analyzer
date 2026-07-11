# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

SARUON — AI Forex Market Analyzer: a single-page React app that runs a 7-step ICT/SMC (Inner Circle Trader / Smart Money Concepts) analysis on a selected forex/gold/crypto pair. All analysis is produced by an LLM (Gemini or Claude) with live web search, prompted to return strict JSON that the UI renders into a trading-signal dashboard. Educational only, not financial advice.

## Commands

```bash
npm install          # install dependencies
npm run dev           # run client + server together (client :5173, API proxy :3001)
npm run dev:client    # Vite dev server only
npm run dev:server    # Express API proxy only (server/index.js)
npm run build          # production build via Vite (outputs dist/)
npm run preview        # preview the production build
npm start               # NODE_ENV=production node server/index.js (serves the built app)
```

There is no test suite and no linter configured in this repo — don't assume `npm test` or `npm run lint` exist.

Local dev requires a `.env` file (copy from `.env.example`) with one of `GEMINI_API_KEY` or `ANTHROPIC_API_KEY` set. Never commit `.env`.

## Architecture

```
Browser (React/Vite :5173)
   │  POST /api/analyze   { system, user }
   ▼
Express proxy (:3001, dev)  ──or──  Vercel serverless function (prod)
   both wrap the SAME handler: api/analyze.js
   │
   ▼
GEMINI_API_KEY set? → Google AI Studio (gemini-2.5-flash + google_search grounding)
else ANTHROPIC_API_KEY set? → Claude (claude-sonnet-4-6 + web_search tool)
```

- **`api/analyze.js`** is the single source of truth for the backend. It's a plain `(req, res) => {}` handler consumed two ways:
  - Directly as a Vercel serverless function in production (see `vercel.json`, which sets `maxDuration: 60` since web-search analysis can take 20-40s).
  - Wrapped by **`server/index.js`** (a tiny Express app) for local dev, so the same code path runs in both environments.
- Provider selection is dynamic per-request: if `GEMINI_API_KEY` is set it's used (free tier, Google Search grounding); otherwise it falls back to `ANTHROPIC_API_KEY`. If neither is set, the handler returns a 500. The two providers have different request/response shapes (Gemini's `generateContent` REST API vs. Anthropic's `/v1/messages`) — both are handled inline in the same function and normalized to `{ text, provider }` before returning to the frontend.
- The API key **never reaches the browser** — `vite.config.js` proxies `/api/*` to `localhost:3001` in dev, and the frontend only ever calls `/api/analyze`.
- **`src/App.jsx`** is effectively the entire frontend: UI, inline styling (via a shared `C` color-token object, no CSS framework/file), the LLM system prompt (`getSYS(pair)`), the fetch call, and the response-rendering logic all live in this one file. `src/main.jsx` is just the React root mount.

### The prompt/JSON contract

`getSYS(pair)` in `src/App.jsx` is the actual "business logic" of the app — it instructs the LLM to run the 7-step ICT/SMC framework and return **only** a specific compact JSON shape (`pair`, `price`, `session`, `step1`..`step6`, `bull`/`bear`/`decision`/`confidence`, `entry`/`sl`/`tp1`-`tp3`, `reasons`). The rendering code in `App()` reads these exact fields to build the signal banner, probability bar, trade-levels table, per-step cards, and confluence breakdown. **If you change the prompt's JSON schema, you must update the corresponding rendering code in the same file (and vice versa) — they are tightly coupled and not validated by a shared schema/types.**

The frontend extracts JSON from the raw LLM text via `text.match(/\{[\s\S]*\}/)` (defensive against the model adding stray text despite instructions), then `JSON.parse`s it. Parse failures surface as an error banner with the raw response in a collapsible `<details>`.

The prompt also encodes hard business rules the model must follow (e.g. decision must always be BUY or SELL, never WAIT/HOLD; `bull + bear` must sum to 100; minimum 1:2 risk/reward) — these are prompt-level constraints, not enforced in code.

## Deployment

Deploys to Vercel (`vercel.json` declares the Vite framework preset and the `api/analyze.js` function's `maxDuration`). Environment variables (`GEMINI_API_KEY` or `ANTHROPIC_API_KEY`) are configured in the Vercel project settings, not in the repo.
