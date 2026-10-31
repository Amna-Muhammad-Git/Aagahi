# Agahi frontend handoff

This guide is for Person A building the React/Vite frontend alongside Person B's Express backend. The backend contract and full response examples are in `Backend/BACKEND_HANDOFF.md`. Follow the API shapes below so both sides can work independently and integrate cleanly.

## Visual and interaction direction

Make Agahi feel like a polished, trustworthy product for adults. Older-adult-friendly means readable typography, clear hierarchy, generous spacing, predictable navigation, visible focus/touch states, and plain respectful language. Avoid childish illustrations, cartoonish styling, patronizing copy, or assuming users cannot learn. Keep the interface calm and professional while maintaining the required large controls and accessibility options.

## Product goal

Agahi helps older adults understand bills and learn WhatsApp and Gmail tasks step by step. It teaches the user and never performs an action for them. Prioritize a complete cached demo that works without a live AI service.

## Frontend ownership

Person A owns:

- React app shell, routing, Home, Settings, and Privacy screens.
- Bill upload/sample selection, result cards, and glossary bottom sheet.
- Searchable guide library for common WhatsApp and email tasks, with text and voice follow-up questions.
- Recreated WhatsApp/Gmail mock screens. Label them clearly as mock screens; they are not the real apps.
- Text size, high contrast, Urdu fonts, responsive behavior, and large controls.
- Frontend README section and demo recording support.

Person B owns the Express API and backend data. Do not import files directly from `Backend/`; consume the API so each person can work in their own folder.

## Run configuration

Read the API base URL from Vite environment configuration:

```dotenv
VITE_API_BASE_URL=http://localhost:4000
```

Do not commit local `.env` files. The frontend must work without an AI key. Use one small API client module (for example `src/api/client.js`) to build URLs and handle JSON/error responses consistently. Keep API error branching based on the stable `error` code, not message text.

## Backend routes to integrate

| Method | Route | Use |
|---|---|---|
| GET | `/api/health` | Read effective mode (`cached` or `live`) and backend readiness |
| GET | `/api/samples` | Load the three fake bills for sample selection and offline demo content |
| GET | `/api/glossary` | Load 15 glossary entries (English and optional Urdu); additive route agreed by both people |
| POST | `/api/extract-bill` | Submit a sample ID or a bill upload |
| POST | `/api/explain-screen` | Submit one of the cached screenshot IDs or an uploaded screenshot |
| POST | `/api/ask-about-upload` | Ask a question about a selected bill/screenshot or uploaded file (live mode for arbitrary questions; curated cached questions offline) |
| POST | `/api/support/chat` | Ask about Agahi, guides, WhatsApp, or email; voice transcripts use the same route |

All routes use the base URL above. Uploads use `FormData` with the field name `file`; do not manually set the `Content-Type` header because the browser supplies the multipart boundary. Cached sample requests may send JSON `{ "sample_id": "electricity-001" }`; backend also accepts `sample_id` as a multipart text field.

The support-chat JSON request is `{ "message": "How do I send a photo?", "guide_id": "whatsapp-send-photo", "language": "en" }`. `guide_id` and `language` are optional; language is `en` or `ur`. The response is `{ "reply": "...", "related_guide_ids": [], "mode": "cached" | "live" }`. There is no separate voice API route for the first version: use browser speech recognition, display the transcript for correction, send it as `message`, and optionally read the visible response aloud using speech synthesis.

For responsiveness, acknowledge taps and microphone activation immediately, keep navigation/guides/cached examples local, and show a pending state for live requests. Never leave a pending state indefinitely; handle safe API errors and let the user retry or use a guide. Live network/AI latency cannot be eliminated or guaranteed.

## Data shapes

### Bill result

The sample list and extraction endpoint use the same bill fields:

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

Amounts are objects with value and currency; dates use `YYYY-MM-DD` or `null`; absent values are `null`. Show **“Not found on this bill”** for missing fields. Always show the AI estimate note for analyzed bills and tell the user to check the original bill. Render the account number exactly as returned; never attempt to recover hidden digits.

### Glossary item

```json
{
  "id": "billing-period",
  "term": "Billing period",
  "term_ur": "بلنگ کی مدت",
  "definition": "The dates of service covered by this bill.",
  "definition_ur": "وہ مدت جس کے لیے یہ بل ہے۔"
}
```

Urdu values may be absent. Fall back to English when missing. Glossary and guides must remain usable offline after content loads; keep the app's essential navigation and guides independent of the API.

### Screen helper result

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

Show the 3–5 steps clearly, include the safety note, and be honest when the helper is uncertain. Do not use raw HTML from API content.

### Ask about a bill or screenshot

Allow the user to select/upload a bill, photo, or screenshot and ask a question about its visible content. Use suggested questions for cached samples so this path has a reliable offline demo. For example, submit JSON `{ "sample_id": "electricity-001", "question": "What does previous balance mean?" }` or multipart fields `file` and `question` for an uploaded file.

```json
{
  "answer": "Previous balance is an amount carried over from an earlier bill. This sample shows none. Check the original bill to confirm.",
  "confidence": "high",
  "mode": "cached",
  "safety_note": "This explanation may be wrong. Check the original bill or screen before acting."
}
```

Clearly label cached suggested answers and live AI answers. If an arbitrary question cannot be answered in cached mode, show the safe unavailable message and preserve the uploaded item/question for retry only as long as appropriate; do not claim analysis occurred. Never encourage payment, guessing, or sharing passwords, OTPs, or PINs. Uploaded content is request-only and must not be persisted.

## Error handling

Errors have a stable code, usually `{ "error": "unreadable", "message": "We couldn't read this file. Try another clear photo or sample bill." }`.

| Error code | Suggested UI behavior |
|---|---|
| `missing_input` | Ask the user to choose a sample or file |
| `invalid_file_type` | Explain accepted formats: PDF, JPG, PNG |
| `file_too_large` | Explain the 5 MB limit and offer retry |
| `sample_not_found` | Show a friendly unavailable-sample message |
| `unreadable` | Offer a retry with a clearer image or sample |
| `mode_unavailable` | Explain live analysis is unavailable and offer a cached sample |
| `server_error` | Show a short retry message |

Uploads are limited to 5 MB. Disable repeated submit while a request is pending, show a clear loading state, and preserve the user's ability to retry. Never display stack traces, raw provider output, or raw server errors.

## Required screens and behavior

### Home

- Large, obvious tiles for bill help, WhatsApp guides, Gmail guide, and privacy.
- Privacy must be reachable in two taps or fewer.
- Add Urdu labels where available, with English fallback.

### Bill explainer

- Let the user pick one of the three sample bills or upload a PDF/JPG/PNG.
- Display fields with plain-language explanation cards.
- Let users ask follow-up questions about the bill or an uploaded bill image; include a few suggested questions for cached sample bills.
- Masked account number must remain masked everywhere.
- Unknown fields say “Not found on this bill”.
- Display an AI estimate / verify against original bill note.
- Show a friendly error and retry for blank, wrong-type, oversized, or unreadable uploads.

### Glossary

- Load entries from `/api/glossary` and highlight known terms in bill explanations where practical.
- Tapping a term opens a phone-friendly bottom sheet with definition and optional Urdu.
- Include clear close behavior and English fallback.

### Guides

- Provide an organized library of common WhatsApp and email tasks, not only isolated demo guides. Prioritize WhatsApp messages, voice messages, photos/files, calls, location sharing, finding chats, and basic privacy controls; prioritize Gmail compose, send, reply, forward, find messages, attach/download files, and identify suspicious/spam email.
- Keep the hackathon's four WhatsApp guides (video call, voice message, share location, send file/photo) and Gmail attachment guide as the first complete set, then add common tasks as time allows.
- Each guide has 4–7 steps, one action per step, Back/Next controls, and “Step X of Y”.
- First and last steps have correct disabled/finish behavior. Guide progression never calls AI.
- Screens are recreated mocks; visibly disclose that they are not live WhatsApp/Gmail screens.
- Add “Ask a question” from guide pages. Questions may be typed or spoken; include the current `guide_id` as context where relevant and display the answer as text even when speech is used.

### Screen helper (if time allows)

- Support the two cached screenshot examples first.
- Live upload analysis is optional and must not block the core app.
- Include a warning never to share passwords, OTPs, or PINs shown on screen.
- Let users ask a follow-up question about the screenshot; cached samples support curated suggested questions, and arbitrary questions require live mode.

### Voice questions

- Let users speak questions about bills, screenshots, WhatsApp, email, or the current guide. For the initial browser-based path, convert speech to text, send the transcript to `/api/support/chat` (include the current guide ID when relevant), and optionally read the answer aloud.
- Display the recognized question and answer so the user can correct a misheard question. Provide typing/text fallback if speech recognition is unsupported or microphone permission is denied.
- The assistant teaches and explains; it never opens apps, sends messages, changes settings, pays bills, or requests passwords, OTPs, or PINs.

### Privacy

Explain plainly that uploads are processed for the request and not saved, settings stay in browser storage, no accounts/passwords/OTPs/PINs/analytics are collected, and AI can make mistakes. Do not promise more than the backend actually implements.

### Settings and accessibility

- Text size and high contrast apply across all screens and persist after reload (localStorage is suitable).
- Body text at least 18 px; buttons at least 48 px tall.
- Ensure Urdu Nastaliq text shapes correctly and remains readable on small screens.
- Keep touch targets generous and avoid relying on color alone.

## Integration sequence

1. Build the app shell and navigation with local placeholder data.
2. Agree with Person B on `VITE_API_BASE_URL`, response examples, and sample IDs before wiring views.
3. Integrate health, samples, and glossary; retain friendly fallback states.
4. Integrate cached sample extraction and screen helper IDs.
5. Add upload requests and all error states.
6. Complete guides, privacy, accessibility, and Urdu fallback without depending on live AI.
7. Verify cached mode, then optionally demonstrate live mode only if Person B confirms it is stable.

Coordinate whenever a response field or route needs to change; update the shared root `BACKEND_HANDOFF.md` and this frontend guide together. Avoid independently renaming fields, IDs, or routes.

## Frontend completion checklist

- [ ] App shell and required routes/screens work on a phone-sized viewport.
- [ ] Three sample bills load and render, including `null` field handling and estimate note.
- [ ] Upload accepts PDF/JPG/PNG, handles 5 MB/type/unreadable errors, and offers retry.
- [ ] User can ask about the selected bill/screenshot; cached suggested questions work offline and unsupported cached questions are labelled unavailable.
- [ ] Account number is displayed only in the masked form supplied by the API.
- [ ] Glossary bottom sheet opens/closes and uses English fallback for missing Urdu.
- [ ] Four WhatsApp guides and Gmail guide work offline with 4–7 steps and accurate step count.
- [ ] Mock screens are labelled as recreated examples.
- [ ] Privacy is reachable within two taps from Home.
- [ ] Text size and contrast persist and apply throughout the app; controls and text meet minimum sizes.
- [ ] Cached demo works without a live AI key or provider request.
