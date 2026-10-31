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

The frontend runs at `http://localhost:5173` and should use `VITE_API_BASE_URL=http://localhost:4000`. These are different ports for separate services. Set `FRONTEND_ORIGIN` in `.env` if the frontend runs at a different origin. Cached mode is the default and does not require provider credentials. Never commit `.env` or put provider keys in frontend variables.

## Current routes

- `GET /api/health` — server status and configured mode.
- `GET /api/samples` — three fictional electricity, gas, and water sample bills.
- `GET /api/glossary` — 15 bilingual glossary entries from the frontend's bundled content.
- `GET /api/guides` — the WhatsApp and Gmail guide library from the frontend's bundled content.
- `GET /api/support/questions` — reviewed English and Urdu support prompts that the UI can show as question suggestions.
- `POST /api/support/chat` — answers an exact or clearly matched curated FAQ in English or Urdu; voice transcripts use the same route. Unmatched questions return `503 mode_unavailable` rather than a generated guess.
- `POST /api/extract-bill` — retrieve a cached result with JSON `{ "sample_id": "electricity-001" }`, or validate an in-memory PDF/JPG/PNG upload up to 5 MB. Valid arbitrary uploads return `mode_unavailable` until live extraction is implemented.
- `POST /api/explain-screen` — return one of two cached screenshot explanations or validate an image upload.
- `POST /api/ask-about-upload` — answer curated questions about cached bill/screenshot samples; arbitrary uploads/questions return `mode_unavailable` until live AI is implemented.

Guide and glossary JSON live in `../Frotend/src/data/` so the frontend can bundle them and work offline. Keep the frontend folder in the repository/deployment. Uploads use memory storage only and are not written to disk or logged. See [the backend handoff](BACKEND_HANDOFF.md) for the full shared API contract.
