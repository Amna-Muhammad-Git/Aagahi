# Agahi backend

## Requirements

- Node.js 20 or newer
- npm

## Run locally

```sh
npm install
cp .env.example .env
npm run dev
```

The API listens at `http://localhost:4000` by default. `GET /api/health` should return:

```json
{ "status": "ok", "mode": "cached" }
```

The frontend should use `VITE_API_BASE_URL=http://localhost:4000`. Set `FRONTEND_ORIGIN` in `.env` if the frontend runs at a different origin. Cached mode is the default and does not require provider credentials. Never commit `.env` or put provider keys in frontend variables.

## Current routes

- `GET /api/health` — server status and configured mode.
- `GET /api/samples` — three fictional electricity, gas, and water sample bills.
- `GET /api/glossary` — 15 bilingual glossary entries from the frontend's bundled content.
- `GET /api/guides` — the WhatsApp and Gmail guide library from the frontend's bundled content.
- `POST /api/extract-bill` — retrieve a cached result with JSON `{ "sample_id": "electricity-001" }`.

Guide and glossary JSON live in `../Frotend/src/data/` so the frontend can bundle them and work offline. Keep the frontend folder in the repository/deployment. Upload handling and the remaining routes will be added in following implementation chunks. See [the backend handoff](BACKEND_HANDOFF.md) for the full shared API contract.
