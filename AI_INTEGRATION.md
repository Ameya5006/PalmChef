# PalmChef AI integration

## Local setup

Use Node 20 or newer. Copy `.env.example` to `.env` and set `GEMINI_API_KEY` on the server only. Run `npm install`, `npm run dev:ai`, and `npm run dev` in separate terminals. The Vite dev proxy forwards `/api/ai` to port 3001. The existing `/api` proxy and existing server are unchanged. The assistant button is available on every page; cooking actions need an active recipe session. AI failure never blocks local cooking controls.

## Render deployment preparation

Keep the existing Render Static Site connected to GitHub `main`, with its current Vite build and `dist` publish directory. Create a **separate Render Web Service** from the same repository and branch, using the repository root, **Node** runtime, build command `npm ci --omit=dev`, and start command `node server/ai/index.js`. The backend uses Render's `PORT` first, then local `AI_PORT`, and binds to `0.0.0.0` in production. Configure its health check path as `/healthz`.

Set these **Web Service runtime variables** in Render's Environment settings: `GEMINI_API_KEY` (server only), `GEMINI_MODEL=gemini-3.5-flash` (or the model you have verified), and `AI_ALLOWED_ORIGIN` set to the Static Site's exact HTTPS origin, such as `https://palmchef.onrender.com`. Do not include a path, trailing slash, or wildcard. Render supplies `PORT`; do not set `AI_PORT` for the Web Service. The service's public URL will be an HTTPS origin such as `https://palmchef-ai.onrender.com`.

Set `VITE_AI_API_BASE` **on the existing Static Site** to that Web Service HTTPS origin, with no `/api/ai` suffix or other path, then rebuild the Static Site. Vite embeds this value at build time; changing it does not update an already published bundle. The browser adds `/api/ai/turn`, `/api/ai/continue`, or `/api/ai/recipe` itself. For local development, leave `VITE_AI_API_BASE` blank so the existing Vite proxy sends `/api/ai` to port 3001. Keep `GEMINI_API_KEY` out of the Static Site's variables and bundle.

No deployment has been made here. The Dockerfile and unrelated backend remain untouched. The AI service uses in-memory sessions and rate limits; multiple instances need shared state or sticky routing. CORS restricts browser origins but does not authenticate direct API clients, so a public deployment still needs abuse controls appropriate to its traffic. The health route reports process availability and does not call Gemini. To roll back, restore the previous Static Site build and stop or unroute the AI Web Service; local recipes and cooking controls do not depend on it.

## Flow

1. The React panel sends one text request and the minimal active recipe, step and timer context to `POST /api/ai/turn`. Chat history stays in component memory and is not sent or stored.
2. The Node service uses `@google/genai` and Gemini `gemini-3.5-flash` by default. It sends thirteen explicit function declarations. A model function call is checked against an allowlist and a strict argument schema.
3. The response contains pending calls with IDs. The client validates arguments again, executes browser state actions through Zustand and speech synthesis, and displays each actual result. The client blocks duplicate call IDs.
4. The client sends results to `POST /api/ai/continue`. The server checks IDs and order, consumes the pending batch once, passes `functionResponse` parts back to Gemini, then returns the final answer or another bounded batch. At most three rounds and four calls per batch are allowed.
5. `generate_recipe` calls `POST /api/ai/recipe`; this separate structured-output request is parsed with Zod on the server and validated again in the client. It produces a preview. `scale_recipe` also produces a preview. Neither writes to the recipe store until the user presses **Save and cook**.

Example: “Set a timer for 60 seconds” → Gemini selects `start_timer({duration_seconds:60})` → the server validates it → the browser calls `useSessionStore.startTimer(60)` → the visible timer begins → the client reports `{success:true,remainingSeconds:60}` → Gemini receives that real result and responds. A failed browser action reports `{success:false,error:...}`.

Timer commands use four distinct tools: `start_timer` starts or replaces a countdown, `pause_timer` temporarily halts a running timer, `resume_timer` continues a paused timer, and `stop_timer` cancels a running or paused timer and clears its remaining time. All four require an active recipe. The context identifies active and paused states, so a prepared step duration is not mistaken for a paused timer. Durations under a minute are reported in seconds. The cooking timer display and AI actions use the same persisted session state.

## Security and limits

The key is read only in Node. Requests are limited to 256 KiB, 20 per IP per minute, 100 in-flight sessions, 20 seconds per model request, 1,000 characters per user turn, and bounded recipe context. Pending sessions expire after five minutes. The service checks `Origin` against `AI_ALLOWED_ORIGIN`, but Origin and CORS are browser controls, not authentication; internet deployment needs perimeter rate limiting and abuse monitoring. The API does not expose shell, filesystem or arbitrary URL tools. No credentials or conversation are logged. The service worker bypasses AI endpoints. AI results are not persisted until confirmed. The AI service is independently deployable because the existing Mongo-dependent server and current static Docker image are not wired together.

## Limitations

Live Gemini calls were not performed without a key. The service uses process memory for sessions and rate limits, so horizontal scaling requires shared session and limiter storage or sticky routing. Scaling quantities is arithmetic only; the user must review cooking times, spices, pan size and non-linear ingredients. Substitution is advisory and does not rewrite the recipe. Browser speech recognition varies by browser; the text box remains available. Existing URL input saves a URL as a one-step recipe rather than scraping it. The existing `server/index.js` recipe parser includes a stray diff marker and cannot be considered a verified AI parsing path; it was left untouched for production isolation.
