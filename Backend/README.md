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
- `POST /api/extract-bill` — retrieve a cached result with JSON `{ "sample_id": "electricity-001" }`, or process a PDF/JPG/PNG upload up to 5 MB. Live extraction is opt-in; invalid/uncertain model output is rejected.
- `POST /api/explain-screen` — return one of two cached screenshot explanations or validate an image upload.
- `POST /api/ask-about-upload` — answer curated questions about cached bill/screenshot samples; arbitrary uploads/questions return `mode_unavailable` until live AI is implemented.

Guide and glossary JSON live in `../Frotend/src/data/` so the frontend can bundle them and work offline. Keep the frontend folder in the repository/deployment. Uploads use memory storage only and are not written to disk or logged. See [the backend handoff](BACKEND_HANDOFF.md) for the full shared API contract.

### Optional live bill extraction

Live extraction is disabled by default. To enable it, set `USE_CACHE=false`, `AI_PROVIDER`, `AI_MODEL`, and the matching server-side API key. Supported provider names are `gemini`, `groq` (GroqCloud), and `grok` (xAI). These are separate services and their keys are not interchangeable. For a GroqCloud key, use `GROQ_API_KEY`, `AI_PROVIDER=gemini`, and `AI_FALLBACK_PROVIDER=groq`; Groq defaults to the vision-capable `qwen/qwen3.8-27b` model. Groq fallback currently accepts JPG and PNG images, not PDFs. Set optional `AI_FALLBACK_MODEL` to override the fallback model. If fallback is omitted, Gemini prefers configured GroqCloud over xAI Grok. Provider request failures can trigger one fallback attempt; malformed or uncertain model output is rejected without another provider attempt. Server logs contain only provider name, stage, failure category, HTTP status, and whitelisted error hints—never keys, file contents, or provider response text. Uploads are sent to the configured AI provider and may include visible personal details. xAI Grok images are sent inline; xAI Grok PDF uploads request a one-hour file expiry and are deleted after the response. A custom upload cannot be replaced by an unrelated cached sample; if providers fail, the API returns a safe unavailable error and the UI can offer a sample bill instead.
