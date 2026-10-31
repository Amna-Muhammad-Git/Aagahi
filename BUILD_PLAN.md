# Agahi full build plan — chunks by sequence and priority

This is the shared work order for Person A (frontend/content) and Person B (backend/AI/data). It includes the original core plan plus the newly requested customer support chatbot and voice agent. Work in order: complete the cached product path first, then add higher-risk AI and voice work. Keep the API contract in `Backend/BACKEND_HANDOFF.md` and frontend expectations in `Frotend/FRONTEND_HANDOFF.md` aligned.

**Product design rule:** Agahi should look and read like a professional, respectful product for adults. Make it older-adult-friendly through readability, calm visual hierarchy, clear language, large controls, and predictable steps. Do not make it childish or patronizing. Users must be able to upload a bill, photo, or screenshot, understand it, and ask questions about its visible content.

## Priority levels

- **P0 — Demo foundation:** Needed for the app to run and for both people to integrate.
- **P1 — Core product:** Required Agahi flows and privacy/accessibility commitments.
- **P2 — Added support features:** Customer support chatbot and voice agent, first with safe cached/fallback behavior.
- **P3 — Risky extras:** Live bill/screen AI and hosting; only after cached flows work.

“Done” means the chunk's stated outcome works and the other person has its interface/content to integrate. Commit small changes regularly and merge to the shared development branch as the team workflow requires.

## Chunk 0 — Agree on the contract and parallel setup (P0)

**Both**

- Use the route, field, and ID contracts in the backend and frontend handoffs as the shared integration interface.
- Confirm app folders, local run commands, and base URL (`http://localhost:4000`; frontend uses `VITE_API_BASE_URL`).
- Use cached mode by default (`USE_CACHE=true`). Live AI, when enabled, uses a server-side provider adapter configured for either Grok or Gemini (`AI_PROVIDER=grok|gemini`); provider keys stay in `Backend/.env`.
- Use browser speech recognition/synthesis for the first voice-query version; send transcripts to `POST /api/support/chat`. There is no separate voice route in the first version.
- Keep the interface responsive: immediate UI acknowledgement, local guides/cached answers, short provider timeouts, and clear fallback states. Target local cached API requests under 150 ms p95; live network/model latency cannot be guaranteed.
- Agree the chatbot purpose: Agahi product help and safe digital-task guidance, not account support, personal financial advice, or actions for the user.
- Agree that voice is a teaching/support interaction and never operates WhatsApp, Gmail, payments, or the device for the user.
- Use the documented support-chat shape (`message`, optional `guide_id` and `language`) for typed and spoken questions. Keep Grok/Gemini as a backend configuration choice; the frontend API does not depend on provider choice.
- Keep all demo flows usable in cached mode.

**Done when:** both can work independently against the documented JSON examples and know where to report contract changes.

## Chunk 1 — Runnable app shells (P0)

**Person A**

- Set up the React/Vite shell, routing, shared layout, and placeholder Home, Settings, and Privacy screens.
- Create a small API client configured by `VITE_API_BASE_URL`.

**Person B**

- Initialize the Node/Express project in `Backend/`, configure the port and CORS, add safe error handling, `.env.example`, and `.gitignore`.
- Implement `GET /api/health` returning status and effective mode.

**Integration checkpoint:** frontend can call health and display a friendly connection/mode status. Neither app requires an AI key.

## Chunk 2 — Core content in cached form (P1)

**Person A**

- Build Home tiles/navigation, privacy copy/layout, and Settings controls for text size and contrast.
- Create guide list and step-view structure using temporary local data; do not wait for AI or backend.

**Person B**

- Create three entirely fictional sample bills and stable IDs.
- Create matching cached bill results with plain-language explanations, explicit `null`s, and masked account numbers.
- Implement `GET /api/samples` and `POST /api/extract-bill` for `sample_id`.

**Integration checkpoint:** frontend renders all three sample results from the agreed schema; unknown fields display “Not found on this bill”.

## Chunk 3 — Glossary and learning guides (P1)

**Person A**

- Integrate the bundled guide library in the UI and add/expand mock screens.
- Each guide has 4–7 short steps, one action per step, Back/Next, and correct “Step X of Y”.
- Create/label recreated mock screens; state clearly they are mock screens, not the real apps.
- Build phone-friendly glossary bottom sheet integration.

**Person B**

- Provide the initial WhatsApp/Gmail guide library and 15 bilingual glossary entries in `Frotend/src/data/` so Vite bundles them for offline use.
- Implement `GET /api/guides` and `GET /api/glossary` as convenience endpoints reading the same local JSON files.
- Validate guide IDs and 4–7 step lengths; keep search tags and text plain and client-searchable.
- Keep cached bill results and content schemas stable.

**Integration checkpoint:** guide and glossary content is included in the frontend bundle; local search, guide steps, and glossary lookup work without API/AI calls. Backend content routes return the same JSON.

## Chunk 4 — Bill upload and safety/privacy (P1)

**Person A**

- Add PDF/JPG/PNG upload form, loading state, result cards, and retry/friendly error states.
- Let users ask follow-up questions about a bill; offer suggested questions for cached sample bills.
- Show estimate warning and tell users to check the original bill.
- Render account number exactly as masked by the backend; never infer hidden digits.

**Person B**

- Add in-memory multipart handling; accept PDF, JPG, PNG up to 5 MB.
- Reject empty, unsupported, and oversized uploads with stable error codes.
- Do not save upload files or log request contents.

**Integration checkpoint:** invalid uploads do not crash either app; sample flow always remains available. Privacy screen explains upload handling accurately.

## Chunk 5 — Accessibility, Urdu, and responsive finish (P1)

**Person A**

- Apply text-size and high-contrast settings across routes and persist choices in localStorage.
- Meet minimums of 18 px body text and 48 px button height; verify touch targets and phone layout.
- Add Urdu labels and Nastaliq rendering with English fallback.
- Ensure Privacy is reachable within two taps from Home.

**Person B**

- Confirm API JSON is UTF-8 and Urdu glossary strings are returned intact.
- Recheck no account numbers, upload content, credentials, or request bodies enter logs/cache.

**Integration checkpoint:** accessibility/Urdu preferences work across screens and persist after reload.

## Chunk 6 — Screen helper and questions about uploads (P1/P2)

**Person A**

- Add screen upload/sample-selection UI, clear uncertainty state, safety note, and follow-up questions about visible screenshot content.

**Person B**

- Create two cached screenshot results, each with 3–5 steps, confidence, and the warning never to share passwords, OTPs, or PINs.
- Implement `POST /api/explain-screen` for the two sample IDs.
- Implement `POST /api/ask-about-upload` for bill/screenshot questions, with curated cached answers for suggested questions. Arbitrary uploads/questions use live mode only.

**Integration checkpoint:** cached screen helper and suggested questions about sample bills/screens work with no provider dependency. Label custom questions unavailable when cached answers do not exist.

## Chunk 7 — Customer support chatbot (P2)

**Both — contract first**

- Use the agreed support-chat request/response schema in `Backend/BACKEND_HANDOFF.md`; supported language values are `en` and `ur`.
- Keep contextual bill/screenshot questions on `/api/ask-about-upload`; general Agahi, WhatsApp, email, and guide questions use `/api/support/chat`.

**Person A**

- Build chat panel, accessible message list, clear loading/error/retry states, and optional English/Urdu selection.
- Keep chat history in memory only unless the team separately agrees on local persistence.

**Person B**

- Build a curated FAQ/cached answer path for bills, WhatsApp, email, and Agahi usage first; add provider answers only behind a flag if time permits.
- Accept speech-to-text transcripts through the same chat endpoint as typed questions, optionally with `guide_id` context.
- Do not collect credentials or answer requests to pay bills, send messages, or operate apps. No passwords, OTPs, or PINs. No request-body logging or transcript retention.

**Integration checkpoint:** useful cached support answers work offline and safety boundaries are tested manually. Do not let chatbot failure block core screens.

## Chunk 8 — Voice agent (P2, higher integration risk)

**Both — architecture decision first**

- Use browser speech recognition/synthesis where supported and send recognized text to the support chat API.
- Keep audio in the browser for the first version; do not add streamed audio/provider sessions unless there is time and a clear need. Never expose a permanent provider secret in frontend code.

**Person A**

- Build an accessible start/stop control, microphone permission/error states, visible transcript, spoken response where available, and a text/guide fallback.
- Explain when voice is unavailable and never imply the app is controlling another application.

**Person B**

- Keep audio/transcripts out of persistent storage; no content logging by default.
- Provide curated cached text answers when no live answer is available; label the answer source honestly.

**Integration checkpoint:** user can ask a spoken question about bills, screenshots, WhatsApp, email, or a guide; see the recognized question and answer; and recover to typing/guides after denial or speech failure.

## Chunk 9 — Live bill extraction (P3; only after P1 works)

**Person A**

- Show cached/live mode clearly; keep sample bills available if live extraction fails.
- Map safe error codes to friendly retry messages.

**Person B**

- Add Grok or Gemini bill extraction only behind `USE_CACHE=false` and a server-only key.
- Preprocess files in memory, validate JSON, never guess, mask account numbers, and never return raw provider text.
- Set request/output limits and safe timeout/provider errors.

**Integration checkpoint:** cached mode remains default and works without a network/provider. Verify the configured model is available before relying on it. If not stable, leave live mode off.

## Chunk 10 — Final integration and release handoff (P0/P1)

**Both**

- Run the product manually in cached mode with no AI credentials and walk through one complete user journey.
- Check sample bills, masked numbers, glossary, all guides, privacy, settings persistence, screen cache, chatbot fallback, and voice fallback.
- Confirm UI accurately labels AI estimates, cached answers, and recreated mock screens.
- Check mobile layout, Urdu rendering, empty/wrong-type/oversized uploads, provider failures, and retry behavior.
- Update README with run instructions, roles/stack, live vs cached vs mocked features, known limitations, privacy behavior, and any needed demo instructions.
- Search before commit/push to ensure `.env`, API keys, `node_modules`, uploaded content, and request bodies are absent.

**Done when:** frontend and backend run together, the core cached demo works end to end, optional features fail gracefully, and both people can explain what is live, cached, and mocked.

## Priority if time gets tight

1. Preserve: cached bill samples, bill explanations, suggested bill questions, privacy, masked numbers, WhatsApp/Gmail guides, accessibility basics, and safe cached mode.
2. Keep screen helper and screenshot suggested questions cached if already built; otherwise defer them.
3. Chatbot: deliver curated cached responses before connecting any AI.
4. Voice: keep a safe text/scripted fallback; defer live voice-provider work if setup or reliability is uncertain.
5. Live bill extraction and live screen AI come last. Never let them jeopardize the offline demo.
