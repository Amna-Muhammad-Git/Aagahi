# Agahi backend and frontend integration handoff

This is the shared contract for Person A (frontend/content) and Person B (backend/AI/data). Agree on this document before implementing the API. The backend serves stable JSON; the frontend owns presentation, accessibility, guide flows, and local settings.

## 1. Product rules the backend must preserve

- Agahi explains and teaches; it never performs bill payment, sends messages, or takes actions for the user.
- Cached mode is the reliable demo mode and must not require an AI provider or network connection.
- Uploaded bills and screenshots are held in memory for the request only. Do not write uploads to disk, retain them, or log their contents.
- Never collect accounts, contacts, passwords, OTPs, PINs, or analytics. Do not log request bodies.
- Account numbers are masked before any provider call and in every API response. Return only the last four digits, e.g. `••••1234`.
- Unknown or unreadable fields must be `null` with a plain-language explanation. Never guess, give payment advice, or expose raw model output or HTML.
- AI-derived values must be labelled as estimates by the frontend. The backend should identify their source with `provider` and `mode`.
- The product should feel professional and dignified. Accessibility for older adults means readable type, clear steps, and predictable controls—not childish visuals, language, or assumptions about ability.
- WhatsApp and email guidance should cover common everyday tasks. Users can ask follow-up questions about guides by typing or speaking; voice input is converted to a question and answered with the same safe support service.

### Latency and responsiveness

- Zero delay cannot be guaranteed for live network/AI answers. The product must feel responsive: acknowledge taps/mic start immediately in the UI, never block navigation on AI, and use local/cached content for instant demo paths.
- Target for local cached API requests: under 150 ms at the 95th percentile. This is a local development target, not a guarantee for remote hosting.
- For live AI, show the pending state immediately, keep answers concise, and set a short provider timeout. If the provider is slow or unavailable, show a retry/fallback state instead of leaving the user waiting indefinitely.
- Do not stream unvalidated provider output. Return only after schema/safety validation; cached answers are the fast path.

## 2. Ownership and agreed layout

Keep the existing root folders `Backend/` and `Frotend/` (the latter is currently spelled that way). Suggested ownership:

```text
Backend/
  package.json
  .env.example
  src/
    server.js
    app.js
    routes/
    middleware/
    services/
  data/
    samples.json
    sample-results.json
    screen-results.json
Frotend/
  src/data/
    guides.json
    glossary.json
  (Person A owns the UI; content JSON is bundled locally for offline use)
```

`Frotend/src/data/guides.json` and `glossary.json` are the canonical offline content files. The frontend imports these JSON files into its bundle and performs guide/glossary search locally, so reading content does not need a network request. The backend reads the same files and exposes `GET /api/guides` and `GET /api/glossary` for API consumers. Keep the `Frotend/` directory in backend deployments so these shared files are present. Backend bill/cache files stay under `Backend/data/`.

## 3. API base URL and transport

- Local backend default: `http://localhost:4000`.
- Frontend reads `VITE_API_BASE_URL`; for local development set it to `http://localhost:4000` (no trailing slash).
- JSON routes use `Content-Type: application/json` responses and UTF-8. Upload routes use `multipart/form-data` with field name `file`; the browser must set the multipart boundary, so do not manually set that request header.
- Enable CORS only for the configured frontend origin in development/hosting. Do not use wildcard origins with credentials.
- All routes are prefixed `/api`. Health, samples, guides, and glossary are GET; extraction, screen help, upload questions, and support questions are POST.
- Standard error body: `{ "error": "<stable_code>", "message": "<safe user-facing message>" }`. Never return stack traces, provider errors, or model text.
- Support answer request shape is JSON. Voice input is transcribed in the browser and sent as the same `message` field; there is no separate voice API route in the first version.

## 4. Endpoints

### `GET /api/health`

No request body. This is a readiness/mode check, not a detailed system diagnostic.

```json
{ "status": "ok", "mode": "cached" }
```

`mode` is `cached` or `live`, reflecting the effective mode after configuration and provider readiness checks.

### `GET /api/samples`

Returns the three fake sample bills. Keep the object structure identical to the extraction response so the UI can render a sample directly or submit its `id` for a cached extraction.

```json
[
  {
    "id": "electricity-001",
    "bill_type": "electricity",
    "provider": "Example Electric Company",
    "amount_due": { "value": 8420, "currency": "PKR" },
    "due_date": "2026-11-15",
    "billing_period": "October 2026",
    "account_number": "••••1234",
    "previous_balance": { "value": 0, "currency": "PKR" },
    "late_fee": null,
    "explanations": {
      "provider": "The company that sent this bill.",
      "amount_due": "The amount the bill says is due. Check the original bill before paying.",
      "due_date": "The date printed as the payment deadline.",
      "billing_period": "The period covered by this bill.",
      "account_number": "Only the last four digits are shown for privacy.",
      "previous_balance": "No previous unpaid balance was listed.",
      "late_fee": "Not found on this bill."
    },
    "mode": "cached"
  }
]
```

The amounts above are illustrative. Use team-written fake content only. Use ISO `YYYY-MM-DD` dates or `null`; keep currency explicit; represent absent values as `null`, not empty strings. Include stable IDs on each sample.

### `GET /api/glossary` (agreed additive route)

Returns exactly 15 offline-ready glossary entries, with English and short Urdu. This endpoint reads `Frotend/src/data/glossary.json`; the frontend imports the same JSON locally for offline access.

```json
[
  {
    "id": "billing-period",
    "term": "Billing period",
    "term_ur": "بلنگ کی مدت",
    "definition": "The dates of service covered by this bill.",
    "definition_ur": "وہ مدت جس کے لیے یہ بل ہے۔"
  }
]
```

Urdu labels and definitions are bundled with English fallback fields. All text is plain text.

### `GET /api/guides` (content convenience route)

Returns the guide array from `Frotend/src/data/guides.json`. The frontend should import that same JSON locally and filter it on-device; it must not depend on this route to display guides offline.

Each guide has `id`, `platform`, `category`, `title`, `title_ur`, `summary`, `search_terms`, and `steps`. Each step has `title` and `instruction`. Directions should be short, literal, respectful, and free of unnecessary jargon. App labels and screen placement can vary by device/version; acknowledge that where relevant.

### `POST /api/extract-bill`

Accept either a multipart `file` upload or a JSON body `{ "sample_id": "electricity-001" }`. A sample ID is the deterministic cached path. For convenience with clients that use multipart for all submissions, also accept `sample_id` as a multipart text field. In cached mode, return the stored result for a known sample ID. Live upload extraction is optional and stays behind `USE_CACHE=false` plus a configured provider key. If cached mode receives an uploaded non-sample file, return `503` with `mode_unavailable`; do not pretend it was analyzed.

Accepted file types: PDF, JPEG, PNG. Maximum size: 5 MB. Uploads are memory-only. Reject empty, unsupported, and oversized files before provider processing.

Success (`200`) has the same field structure as a sample object, plus an optional stable `id` and `mode`:

```json
{
  "id": "electricity-001",
  "bill_type": "electricity",
  "provider": "Example Electric Company",
  "amount_due": { "value": 8420, "currency": "PKR" },
  "due_date": "2026-11-15",
  "billing_period": "October 2026",
  "account_number": "••••1234",
  "previous_balance": { "value": 0, "currency": "PKR" },
  "late_fee": null,
  "explanations": {
    "provider": "The company that sent this bill.",
    "amount_due": "The amount the bill says is due. Check the original bill before paying.",
    "due_date": "The date printed as the payment deadline.",
    "billing_period": "The period covered by this bill.",
    "account_number": "Only the last four digits are shown for privacy.",
    "previous_balance": "No previous unpaid balance was listed.",
    "late_fee": "Not found on this bill."
  },
  "mode": "cached"
}
```

Validation/errors:

| HTTP | `error` | When |
|---|---|---|
| 400 | `missing_input` | Neither `file` nor `sample_id` supplied |
| 400 | `invalid_file_type` | Not PDF, JPEG, or PNG, or the MIME type does not match the file signature |
| 400 | `empty_file` | Uploaded file has no contents |
| 400 | `conflicting_input` | Both `file` and `sample_id` supplied |
| 400 | `invalid_upload_field` | More than one file or the file field name is not `file` |
| 400 | `invalid_upload` | Multipart form is malformed or exceeds text-field limits |
| 413 | `file_too_large` | Over 5 MB |
| 404 | `sample_not_found` | Unknown `sample_id` |
| 422 | `unreadable` | Valid upload could not be safely parsed or validated |
| 503 | `mode_unavailable` | Valid arbitrary upload received before live extraction is available |
| 500 | `server_error` | Unexpected failure; safe generic message only |

The plan specifies `{ "error": "unreadable" }` for unparseable AI output; the common `message` field is added here to keep UI errors friendly and consistent. Frontend should branch on `error`, not parse message text.

### `POST /api/explain-screen`

Accept multipart `file` (PNG/JPEG, max 5 MB) or JSON `{ "sample_id": "whatsapp-location-001" }`. The two screenshot IDs and results are provided by Person B in `screen-results.json`. Include multipart `sample_id` support for a consistent upload client. Cached screenshot outputs work offline; unsupported arbitrary uploads in cached-only mode return `503 mode_unavailable`.

Success (`200`):

```json
{
  "app_name": "WhatsApp",
  "description": "This screen is asking you to choose a person to share your location with.",
  "steps": [
    "Check that you recognize the person's name.",
    "Choose how long to share your location.",
    "Tap the send button only if you want to share it."
  ],
  "confidence": "high",
  "safety_note": "Never share a password, one-time code (OTP), or PIN shown on a screen.",
  "mode": "cached"
}
```

`steps` must contain 3–5 short strings. `confidence` is `high`, `medium`, or `low`. For uncertain screens, say so in `description`/steps and suggest asking a trusted family member. Never instruct the user to disclose a password, OTP, or PIN. Use the same upload and error rules as bill extraction; unknown sample IDs return 404.

### `POST /api/ask-about-upload` (contextual bill/screenshot questions)

The user may upload a bill, photo, or screenshot and ask a question about what is visible. This is separate from general Agahi support chat: it answers about the supplied content only. Accept JSON `{ "sample_id": "electricity-001", "question": "What does previous balance mean?" }` for a cached example or multipart fields `file` and `question` for an upload. Supported files are PDF/JPEG/PNG, up to 5 MB; image and screenshot support is required. Keep uploads in memory for this request only.

Success (`200`):

```json
{
  "answer": "Previous balance is an amount carried over from an earlier bill. This sample shows none. Check the original bill to confirm.",
  "confidence": "high",
  "mode": "cached",
  "safety_note": "This explanation may be wrong. Check the original bill or screen before acting."
}
```

Answer only what can be supported by the supplied file/sample. If not visible or unclear, say so; never guess, give payment advice, or ask the user to share credentials, OTPs, or PINs. Return plain text only. Validate answer length and shape; never expose provider text on parsing failures. Cached mode supports a small set of curated suggested questions for the three sample bills and two sample screenshots. For arbitrary questions with no cached answer, return `503 mode_unavailable` rather than implying an answer was generated. Live answers use the configured Grok or Gemini adapter only when live mode is enabled.

## 5. Data files and validation

- `samples.json`: three fake sample bills, each with stable `id`, field values, and explanations.
- `sample-results.json`: cached extraction result keyed by the same sample IDs. Keep it structurally identical to the success response.
- `screen-results.json`: two cached screen outputs keyed by stable screenshot IDs.
- `question-results.json`: curated cached answers keyed by sample ID and suggested question ID; these power offline suggested questions.
- `Frotend/src/data/glossary.json`: exactly 15 bilingual, plain-text entries imported into the frontend bundle.
- `Frotend/src/data/guides.json`: authored guides bundled into the frontend and served by the optional guide API route.
- Validate all JSON at startup (or validate on read) and fail clearly if shipped cache data is malformed. Validate provider output against an explicit schema before responding.
- Strip tags/control characters or reject unexpected non-string content; frontend also renders as text, never HTML.
- Account masking: normalize a detected account number, retain only its last four digits, and discard the full value before constructing the response. Do not put full values in logs or cache.

## 6. Live AI mode and privacy

- `USE_CACHE=true` is the default. When true, API keys are not needed and no provider request is made.
- `USE_CACHE=false` enables live AI only when `AI_PROVIDER` is `grok` or `gemini`, the matching server-side key is present, and the configured model is available. Set the model with `AI_MODEL`. Keep provider access behind a small adapter so the frontend contract does not depend on which provider is selected. Cached behavior remains the acceptance/demo path.
- Never put provider keys in frontend variables (`VITE_*`), source control, API responses, or logs. Commit `.env.example` with placeholders only; ignore `.env`.
- Prompt instructions: return JSON only; no guessing; use `null` if not clearly visible; mask account number to last four only; no payment advice. Validate parsed JSON; on failure return `422 unreadable` and never return raw model output.
- For PDFs, prefer extracting text in memory with `pdf-parse`; for images, resize/normalize in memory with Sharp. Do not persist temporary files. If preprocessing fails, return `422 unreadable`.
- Set provider timeout and a small output-token limit. Provider outages/timeouts return a safe `503` error; the frontend should offer retry and keep sample/cached paths usable.
- Screen AI is optional. Cached screen results meet the requirement; only add live screenshot analysis after cached flows work.

## 7. Environment and local run agreement

Person B supplies `Backend/.env.example` with:

```dotenv
PORT=4000
USE_CACHE=true
AI_PROVIDER=
AI_MODEL=
GEMINI_API_KEY=
GROK_API_KEY=
FRONTEND_ORIGIN=http://localhost:5173
```

Person B documents install/start commands in `Backend/README.md` and the root README backend section. Person A sets `VITE_API_BASE_URL=http://localhost:4000` in the frontend's local environment file (ignored by git). Start the backend and frontend independently. Do not make frontend startup depend on the AI key.

## 8. Frontend integration behavior

- At app start, call `/api/health` for mode and `/api/samples` for sample choices. Fetch `/api/glossary` for glossary content. Keep a clear loading and friendly error state.
- A selected sample can render from the sample list; if Person A chooses to request the extraction route, send its `sample_id` and render the returned object.
- Uploads use `FormData` field `file`; show a progress/loading state, then render only returned fields and explanations. `null` fields display **“Not found on this bill”**.
- Render `account_number` exactly as returned; never reconstruct or reveal hidden digits. Show the required note that AI estimates can be wrong and users should check the original bill.
- Screen helper submits a known `sample_id` for cached demos or an uploaded screenshot for live mode. Show the safety note and label recreated WhatsApp/Gmail screens as mocks in guide flows.
- Offer suggested questions for a selected bill or screenshot and send them to `/api/ask-about-upload`; accept a file plus the user's own question when live mode is available. Clearly identify cached suggested answers versus live AI answers.
- The frontend remains usable for guides, privacy, settings, and cached sample content when live mode or the backend provider is unavailable. Do not call AI for WhatsApp/Gmail guide steps.
- On API errors, map stable error codes to friendly copy and provide a retry action where appropriate. Do not show raw server messages unless reviewed as user-safe.

## 9. Definition of integration-ready

- Person A can run the frontend with the documented API base URL and no provider credentials.
- Health reports `cached`; samples returns exactly three; glossary returns exactly 15.
- Every sample ID returns the matching cached extraction object; both screen IDs return a 3–5 step result.
- Suggested questions about cached bills/screens return safe answers; unsupported arbitrary questions in cached mode show an unavailable/retry message.
- Empty, wrong-type, and >5 MB uploads return stable friendly errors without crashing the server.
- Live extraction is disabled by default; when enabled, API key stays server-only and malformed/provider-failed output never leaks.
- No upload body logging, persisted user upload, full account number in response/cache/log, or committed `.env`/secret.
- Cached demo paths require no network call to an AI provider.

## 10. Person B delivery order

1. Agree on this contract and start Express with health route and CORS.
2. Add fake samples, extraction cache, and glossary; wire their GET routes.
3. Implement cached extraction and screen helper routes and stable errors.
4. Give Person A the base URL, sample IDs, glossary shape, and example responses as soon as they are stable.
5. Add upload validation, in-memory handling, size/type errors, and safe logging defaults.
6. Add Grok or Gemini live mode behind `USE_CACHE=false`; validate provider JSON and mask data before response.
7. Complete backend README/setup notes and the integration-ready checklist. Freeze live mode if it is not stable; submit with cached mode.

## 11. Revised scope: support chatbot and voice agent

The original development plan listed chatbot and voice agent as cut/out-of-scope. The team has now added them back into the intended product scope. Treat this as a scope change and schedule these after the bill, guides, privacy, and cached backend paths work. Keep both assistants focused on teaching people how to use Agahi, bills, WhatsApp, and email; neither may take actions for the user or ask for passwords, OTPs, or PINs.

The following text support contract is fixed for frontend/backend integration. Supported response language is selected with `language: "en" | "ur"`; when Urdu output is unavailable, return English. The AI provider remains a deployment choice between Grok and Gemini and does not change these API shapes. Voice uses browser speech recognition/synthesis where supported and reuses the text support route; do not add a voice session route for the first version.

### `POST /api/support/chat`

Request:

```json
{ "message": "How do I send a photo?", "guide_id": "whatsapp-send-photo", "language": "en" }
```

`guide_id` and `language` are optional; supported language values are `en` and `ur`.

Success (`200`):

```json
{
  "reply": "Open the chat, tap the attachment or plus button, choose Photos, select the picture, then tap Send.",
  "related_guide_ids": ["whatsapp-send-photo"],
  "mode": "cached"
}
```

The reply teaches steps and does not perform them. In cached mode, answer curated/common questions; for unsupported questions return `503 mode_unavailable` with a friendly message and related guide suggestions. In live mode, use the configured Grok/Gemini adapter, validate the answer, keep it concise, and apply the safety rules above. Do not store chat history or log request content. Typed text and voice transcripts use the same request.

Stable errors: `400 missing_input`, `413 message_too_long`, `503 mode_unavailable` or `provider_unavailable`, and `500 server_error`. Keep user-facing messages safe and short.

### First-version voice contract

- No separate backend voice route. Browser speech recognition captures a question; frontend shows the transcript and posts it to `/api/support/chat`. Browser speech synthesis may read the returned answer aloud.
- Show typed input and visible text answers as fallbacks. Handle unsupported browser speech and microphone denial without blocking other features.
- Do not persist audio/transcripts. Never ask for passwords, OTPs, or PINs.

## 12. Backend tasks divided into chunks

Each chunk should end with working behavior that Person A can integrate. Share the route, response example, sample IDs, and any changed assumptions as soon as a chunk is ready.

### Chunk 1 — Project and server foundation

- Initialize the Node project in `Backend/`; add Express and environment loading.
- Create the app/server entry points and port configuration.
- Set up CORS for the frontend origin, JSON handling, and a final safe error handler.
- Add `GET /api/health` with effective mode.
- Add `.env.example`, `.gitignore` entries for `.env` and dependencies, and basic backend run instructions.
- **Ready when:** server starts locally and Person A can call health from the frontend.

### Chunk 2 — Fake bills and cached bill API

- Write three fake bills with stable IDs and masked account numbers.
- Write matching cached result data, explanations, and explicit `null` values for unknown fields.
- Add `GET /api/samples` and `POST /api/extract-bill` for `sample_id` requests.
- Add stable error codes for missing/unknown sample input.
- **Ready when:** each sample ID returns predictable JSON that matches the frontend contract, with no AI key or provider request.

### Chunk 3 — Glossary and screen helper cache

- Add 15 glossary entries with English and optional Urdu.
- Add two cached screenshot results, each with 3–5 steps and the safety note.
- Add `GET /api/glossary` and cached `POST /api/explain-screen` by sample ID.
- **Ready when:** glossary and screen helper work in cached mode and the frontend can render them.

### Chunk 4 — Upload validation and privacy controls

- Add in-memory multipart file handling for supported routes.
- Enforce PDF/JPG/PNG type and 5 MB limit; reject empty/invalid files clearly.
- Ensure no file is written to disk and request bodies/content are not logged.
- Return consistent safe errors for wrong type, oversized file, missing input, and unreadable content.
- **Ready when:** bad uploads fail cleanly and sample/cache flows still work.

### Chunk 5 — Live bill extraction (optional, after core)

- Integrate Grok or Gemini behind `USE_CACHE=false` and server-only environment key.
- Preprocess PDFs/images in memory; send only what is necessary.
- Validate model JSON, normalize values, mask account number before response, reject guesses, and never expose raw model text.
- Handle timeout/provider failure with safe errors; cached mode remains the default.
- **Ready when:** live mode passes sample checks and cached mode works without the provider. If unstable, freeze/omit live mode for the demo.

### Chunk 6 — Customer support chatbot

- Define allowed topics and boundaries with Person A (Agahi navigation, bill terms, using guides; no account support or personal financial advice).
- Implement the agreed `POST /api/support/chat` schema with English/Urdu behavior and guide context.
- Build a small curated FAQ/response cache first; add provider-backed answers only behind a flag if time permits.
- Keep responses short, plain-language, and safe; refuse requests involving credentials, OTPs, PINs, payments, or actions on behalf of a user.
- Avoid storing chat history. Frontend may hold the current conversation in memory only.
- **Ready when:** a cached support conversation works without AI/network, and all fallback/error cases are defined.

### Chunk 7 — Voice agent

- Agree with Person A on the interaction and provider architecture before choosing routes: browser speech APIs, a voice provider, or server-mediated audio.
- Set the voice agent's job as spoken teaching/support; it must not make calls, send messages, make payments, or operate apps.
- Prefer a short-lived token/session pattern if using a hosted provider. Keep secrets on the server and transcripts/audio out of persistent storage.
- Provide a text fallback and a clear unavailable state. Cached demo must still work if voice service/network is down (for example, scripted sample conversation or spoken guide playback, clearly labelled).
- **Ready when:** user can start and end the voice interaction, see/hear a safe response, recover from service failure, and switch to text/guide instructions.

### Chunk 8 — Integration, documentation, and release readiness

- Send Person A final route list and examples; resolve mismatches in both handoff docs before changing code.
- Document env vars, start commands, cached/live mode, chatbot, voice limitations, and privacy behavior.
- Walk through the full cached demo with no AI credentials; confirm optional AI/voice features fail gracefully.
- Confirm no `.env`, provider key, uploaded content, or request bodies appear in Git/logs.
- **Ready when:** frontend and backend run together with cached mode as the dependable path and the README accurately describes what is live, cached, and mocked.
