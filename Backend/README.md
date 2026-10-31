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

Other routes will be added in the following implementation chunks. See [the backend handoff](BACKEND_HANDOFF.md) for the shared API contract.
