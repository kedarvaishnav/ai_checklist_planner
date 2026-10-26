# AI Checklist Planner — Full Stack & Chrome Extension

A full-stack checklist planning system featuring a React frontend, a Node.js/Express REST API with PostgreSQL and Google Gemini structured checklist generation, and a Chrome Manifest V3 side panel extension.

---

## Deployment Architecture

- **Frontend:** Deployed on **Vercel**.
- **Backend:** Deployed on **Render** (Node.js web service).
- **Database:** Managed **PostgreSQL on Render**.
- **Extension:** Packaged Chrome Manifest V3 side panel communicating with the production backend.

---

## Environment Variables

### Frontend (`frontend/.env` / Vercel Environment Variables)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Base URL of the backend API. Must be set on Vercel to your production Render backend URL. | `https://ai-checklist-backend.onrender.com` |

### Backend (`backend/.env` / Render Environment Variables)

| Variable | Required | Description | Example |
|---|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string. Automatically injected by Render when attaching PostgreSQL. | `postgresql://user:pass@host:5432/checklist_db` |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | Yes (on Render) | Set to `false` for Render's managed PostgreSQL to allow its self-signed SSL certificates. | `false` |
| `JWT_SECRET` | Yes | Long random secret string used to sign and verify JSON Web Tokens (JWT). | Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `FRONTEND_URL` | Yes | Comma-separated list of exact allowed origins for CORS. In production, must be the exact Vercel frontend URL. | `https://ai-checklist-planner.vercel.app` |
| `GEMINI_API_KEY` | Yes | Google Gemini API key used for structured AI checklist generation. | Your Google AI Studio API key |
| `GEMINI_MODEL` | Yes | Identifier of the Gemini model to use. Required (no silent fallback). | `gemini-3.5-flash` |
| `GEMINI_TIMEOUT_MS` | No | Optional timeout in milliseconds for Gemini API requests (defaults to `60000`). | `60000` |
| `TEST_DATABASE_URL` | For Tests | Dedicated test database URL for `npm test`. The test runner refuses to run if unset or if equal to `DATABASE_URL`. | `postgresql://user:pass@localhost:5432/checklist_test_db` |
| `NODE_ENV` | Yes | Set to `production` on Render, `development` for local work, or `test` for test runner. | `production` |

---

## Local Development

### 1. Database Setup

Ensure PostgreSQL is running locally, then create the development and test databases:

```bash
# Windows PowerShell (adjust psql path if needed)
psql -U postgres -c "CREATE DATABASE checklist_db;"
psql -U postgres -c "CREATE DATABASE checklist_test_db;"
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in DATABASE_URL, TEST_DATABASE_URL, JWT_SECRET, GEMINI_API_KEY, GEMINI_MODEL
npm install
npm run db:migrate
npm run dev
```

Backend runs on **http://localhost:4000**.

To run automated backend tests:
```bash
npm test
```

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:4000
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**.

---

## Chrome Extension (Manifest V3 Side Panel)

The Chrome extension provides a side panel companion that lets you highlight any plan, tutorial, or article on the web and transform it into an actionable checklist with a single click.

### Build and Load Steps

1. In `frontend/`, ensure `VITE_API_URL` in `.env` (or environment) points to your backend:
   ```bash
   # For local testing:
   VITE_API_URL=http://localhost:4000
   # For production:
   # VITE_API_URL=https://ai-checklist-backend.onrender.com
   ```
2. Build the extension bundle:
   ```bash
   npm run build:extension
   ```
   This compiles the extension into `frontend/dist-extension/` using Vite and Rolldown, injecting the verified backend origin into `manifest.json`.
3. Open Google Chrome and navigate to `chrome://extensions`.
4. Turn on **Developer mode** using the toggle in the top-right corner.
5. Click **Load unpacked** and select the `frontend/dist-extension` folder.
6. Click the extension toolbar icon to open the side panel.

### Permissions Used & Justification

| Permission | Justification |
|---|---|
| `sidePanel` | Allows the app to render inside Chrome's native side panel next to web pages without taking up a full browser tab. |
| `contextMenus` | Registers the right-click "Generate checklist" context menu option on text selections and pages. |
| `scripting` | Extracts user-selected text (or page content when no text is selected) to prefill the generation textarea. |
| `storage` | Uses `chrome.storage.session` to pass captured text from the background worker to the side panel. Uses `chrome.storage.local` to safely persist JWT tokens in extension mode. |
| `host_permissions` | Grants permission to send API requests directly to the configured `VITE_API_URL` backend without CORS restrictions in the extension sandbox. |

### Privacy & Data Handling Guarantee

- Page text is captured to local session storage only when the user explicitly triggers the right-click context menu action.
- **No text or page data is sent to the backend server or the Gemini API automatically.** Data is transmitted only after the user reviews the prefilled text in the side panel and explicitly clicks the **Generate** button.
- Once a generated checklist is saved, the captured text is cleared from session storage and will not reappear if the panel is remounted.

---

## API Reference

All protected endpoints require an `Authorization: Bearer <token>` header.

### Authentication

| Method | Path | Request Body | Description |
|---|---|---|---|
| POST | `/api/auth/register` | `{ "email": "...", "password": "..." }` | Register new account. Returns `{ token, user }`. Passwords must be $\ge$ 8 chars. Case-insensitive email uniqueness. |
| POST | `/api/auth/login` | `{ "email": "...", "password": "..." }` | Sign in. Returns `{ token, user }`. |
| GET | `/api/auth/me` | None | Get currently authenticated user details. |

### Checklists

| Method | Path | Request Body | Description |
|---|---|---|---|
| GET | `/api/checklists` | None | List all checklists belonging to the authenticated user. |
| POST | `/api/checklists` | `{ "title": "...", "rawInput": "...", "categories": [...] }` | Create a new checklist with structured categories and tasks. |
| GET | `/api/checklists/:id` | None | Fetch single checklist with categories and tasks. Enforces strict user isolation (returns 404 for checklists owned by other users). |
| PUT | `/api/checklists/:id` | `{ "title": "..." }` | Update checklist title. |
| DELETE | `/api/checklists/:id` | None | Delete checklist and all associated categories/tasks. |
| PATCH | `/api/checklists/:id/tasks/:taskId` | `{ "completed": boolean }` | Set task completion status idempotently. The body explicitly specifies the target boolean state `{ completed: boolean }`. |

### AI Generation

| Method | Path | Request Body | Description |
|---|---|---|---|
| POST | `/api/generate` | `{ "text": "..." }` | Analyze raw text ($20 - 20000$ characters) with Google Gemini using structured JSON schema. Returns `{ "categories": [ { "category": "...", "tasks": [ { "title": "..." } ] } ] }`. Returns `503` if AI is not configured (`GEMINI_API_KEY` or `GEMINI_MODEL` unset). |

---

## Known Limitations

1. **No Token Refresh:** JWT tokens expire after 7 days. When expired, users are redirected to sign in again.
2. **Free-Tier Cold Starts:** On free hosting tiers (such as Render free instances), inactive instances spin down after inactivity, causing initial requests to take up to 30–50 seconds to respond.
