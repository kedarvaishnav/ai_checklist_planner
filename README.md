# AI Checklist Planner — Full Stack

A checklist app with a React frontend, Node.js/Express backend, and PostgreSQL database with JWT authentication.

---

## Project structure

```
ai-checklist-fullstack/
├── frontend/            ← React + Vite + Tailwind (JavaScript)
│   └── src/
│       ├── App.jsx               — routing setup
│       ├── context/
│       │   └── AuthContext.jsx   — login state for the whole app
│       ├── pages/
│       │   ├── AuthPage.jsx          — login / register
│       │   ├── MyChecklistsPage.jsx  — list of saved checklists
│       │   ├── NewChecklistPage.jsx  — paste plan → generate
│       │   └── ChecklistPage.jsx     — view + tick off tasks
│       ├── components/
│       │   ├── ProtectedRoute.jsx    — redirects to /auth if not logged in
│       │   ├── CategorySection.jsx
│       │   ├── TaskItem.jsx
│       │   ├── ProgressBar.jsx
│       │   └── CopyPromptButton.jsx
│       └── utils/
│           ├── api.js    — all HTTP calls to the backend
│           ├── parser.js — converts raw text to categories/tasks
│           └── prompt.js — AI prompt template
└── backend/             ← Node.js + Express + PostgreSQL (JavaScript)
    └── src/
        ├── index.js          — Express app entry point
        ├── db/
        │   ├── pool.js       — shared PostgreSQL connection pool
        │   └── migrate.js    — creates all tables
        ├── middleware/
        │   └── auth.js       — JWT verification middleware
        └── routes/
            ├── auth.js       — register, login, me
            └── checklists.js — CRUD for checklists + task toggling
```

---

## Prerequisites

- Node.js 20+
- PostgreSQL installed and running

---

## Setup

### 1. Create the database

```bash
psql -U postgres -c "CREATE DATABASE checklist_db;"
```

### 2. Set up the backend

```bash
cd backend
```

Copy `backend/.env.example` to `backend/.env`, then fill in the values:
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/checklist_db
JWT_SECRET=any-long-random-string
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

Then install and migrate:
```bash
npm install
npm run db:migrate
npm run dev
```

Backend runs on **http://localhost:4000**

### 3. Set up the frontend

Open a new terminal:
```bash
cd frontend
```

Copy `frontend/.env.example` to `frontend/.env`, then set:
```
VITE_API_URL=http://localhost:4000
```

Then:
```bash
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

> Safety note: keep `backend/.env` and `frontend/.env` local. Commit only `backend/.env.example` and `frontend/.env.example`.

---

## Common errors and fixes

### `psql` not recognized
PostgreSQL is not in your PATH. Use the full path:
```bash
# Windows
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE checklist_db;"
```

### `database "checklist_db" does not exist`
You haven't created the database yet. Run the `CREATE DATABASE` command above first, then run migrations.

### `SASL: client password must be a string`
Your `backend/.env` has quotes around the values. Remove them:
```
# Wrong
DATABASE_URL="postgresql://..."

# Correct
DATABASE_URL=postgresql://...
```

### CORS error in browser
Your frontend is running on a different port than `FRONTEND_URL` in `backend/.env`. Check what port Vite is using (it shows in the terminal) and update `FRONTEND_URL` to match, then restart the backend.

### Backend crashes immediately after starting
Check your `backend/.env` file is inside the `backend/` folder (not the root) and has no quotes around values.

### `ECONNREFUSED` in Postman or browser
The backend server isn't running. Start it with `npm run dev` in the `backend/` folder.

---

## API reference

All checklist endpoints require `Authorization: Bearer <token>`.

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account → returns `{ token, user }` |
| POST | `/api/auth/login` | Sign in → returns `{ token, user }` |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/checklists` | List all checklists |
| POST | `/api/checklists` | Create a checklist |
| GET | `/api/checklists/:id` | Get checklist with categories + tasks |
| PUT | `/api/checklists/:id` | Update title |
| DELETE | `/api/checklists/:id` | Delete checklist |
| PATCH | `/api/checklists/:id/tasks/:taskId` | Toggle task completed |
