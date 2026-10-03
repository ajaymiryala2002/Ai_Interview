# PyProctor AI — Student Setup & Run Guide

This guide contains **every command** needed to install and run the PyProctor AI interview application on your own computer.

---

## What you need before you start

1. **Node.js 20 or newer** (LTS recommended). Download from https://nodejs.org
2. **Python 3.10 or newer**. Download from https://python.org
3. A working **camera and microphone** (for the candidate interview page).
4. **Git** (optional, only if you clone the folder).

> Quick check: open a terminal and run:
> ```bash
> node -v
> python --version
> ```

---

## Folder layout

```
pyproctor-ai/
├── backend/          ← Node.js API + database
├── frontend/         ← Next.js web app
└── face-test-python/ ← Python face-verification helper
```

You must start **three things** in separate terminals:
1. Backend API server
2. Frontend web app
3. (Optional) Python face-verification virtual environment setup

---

## Step 1 — Install the backend

Open a terminal in the project root (`pyproctor-ai`), then run:

```bash
cd backend
npm install
```

### Set up the database

```bash
npx prisma generate
npx prisma db push
```

The database is a local SQLite file (`prisma/dev.db`). No separate database server is required.

---

## Step 2 — Configure environment variables

Open `backend/.env` in VS Code and update these values:

```env
JWT_SECRET="type-a-long-random-string-here"
FRONTEND_URL="http://localhost:3000"
```

Optional — only if you want the app to **send result emails automatically**:

```env
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-16-character-gmail-app-password"
SMTP_FROM="PyProctor AI <your-email@gmail.com"
```

> Do **not** use your normal Gmail password. You must create an **App Password** in your Google account.
> If you skip this, the interview still works — you just copy the invitation link from the dashboard.

---

## Step 3 — Seed the interview questions

The backend now seeds questions **automatically** when it starts, but you can also run it manually:

```bash
cd backend
npm run seed
```

You should see: `Database seeded with 48 role-specific questions ...`

---

## Step 4 — Set up the Python face-verification helper

Open a terminal in the project root and run:

**On Windows:**

```bash
cd face-test-python
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

**On macOS/Linux:**

```bash
cd face-test-python
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

After installation you can deactivate the virtual environment:

```bash
deactivate
```

The Node.js backend will automatically use `face-test-python/venv/Scripts/python.exe` (Windows) or `face-test-python/venv/bin/python` (macOS/Linux) when verifying faces.

---

## Step 5 — Start the backend server

In a terminal inside `backend/`:

```bash
npm run dev
```

You should see:

```
Database already has 48 questions.
Server running on port 5000
```

If the database is empty, you will see:

```
No questions found in database. Seeding 48 questions before starting server...
Database seeded successfully.
Server running on port 5000
```

Keep this terminal open.

> If you prefer to use the compiled version instead of `npm run dev`, run:
> ```bash
> npm run build
> npm run start
> ```

---

## Step 6 — Start the frontend web app

Open a **second terminal** in the project root, then run:

```bash
cd frontend
npm install
npm run dev
```

After a few seconds, open your browser at:

```
http://localhost:3000
```

Keep this terminal open too.

---

## Step 7 — Register an organizer and run an interview

1. Open http://localhost:3000
2. Click **Register** and create an organizer account.
3. Log in.
4. Add a candidate (name, email, phone, role, photo).
5. Click **Send Invitation**. The candidate receives a link like:
   ```
   http://localhost:3000/interview/<token>/terms
   ```
6. Open that link in a second browser (or an incognito window).
7. Accept terms, allow camera/microphone, verify face, and answer the 10 questions.
8. Return to the organizer dashboard to see the result.

---

## Common problems and fixes

### 1. "Server error" or "Failed to load question"

**Cause:** The backend is not running, or the frontend cannot reach it.

**Fix:**
- Make sure the backend terminal shows `Server running on port 5000`.
- Make sure `backend/.env` has `PORT=5000`.
- Make sure the frontend `next.config.ts` rewrites point to `http://127.0.0.1:5000` (default is correct).
- Do **not** close the backend terminal.

### 2. Interview submitted without asking any questions

**Cause (fixed in this version):** In the old code, the session could be marked complete even when no questions were answered. This happened when the database was not seeded before the candidate opened the interview link.

**Fix in this version:**
- The backend now seeds the 48 questions **before** it accepts any requests.
- The `/api/sessions/:id/complete` endpoint now rejects submission if no answers exist.

**What students should do:**
- Always start the backend first and wait for `Server running on port 5000`.
- If you still see this problem, stop the backend, delete `backend/prisma/dev.db`, then run:
  ```bash
  npx prisma db push
  npm run seed
  npm run dev
  ```

### 3. Face verification always fails

**Cause:** The Python virtual environment is missing or the required libraries are not installed.

**Fix:**
- Follow Step 4 again.
- Make sure `face-test-python/venv/Scripts/python.exe` exists (Windows) or `face-test-python/venv/bin/python` exists (macOS/Linux).
- During the interview, use good lighting and face the camera directly.
- If the room is too dark, the interview page offers a **Continue Anyway** button for practice/testing.

### 4. Camera/microphone not working

**Fix:**
- Use a browser that supports `navigator.mediaDevices.getUserMedia` (Chrome, Edge, Firefox).
- Allow camera and microphone when the browser asks.
- If you previously blocked permission, click the camera icon in the browser address bar and change it to **Allow**.

### 5. Emails are not sent

**Fix:**
- Fill in your Gmail and App Password in `backend/.env`.
- If you do not want to use email, the invitation link is still shown on the organizer dashboard — copy and send it manually.

### 6. Port already in use (`EADDRINUSE :::5000`)

**Fix:**
- Close any old backend terminal windows.
- On Windows, run:
  ```bash
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  ```
- Then restart the backend.

---

## Quick command cheat-sheet

```bash
# Terminal 1 — Backend
cd backend
npm install
npx prisma generate
npx prisma db push
npm run seed
npm run dev

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev

# Terminal 3 — Python face helper (one-time setup)
cd face-test-python
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
deactivate
```

---

## Important security note

**Never send a `.env` file that contains real passwords or secrets to students.** The `.env` file in this folder has been reset to safe placeholder values. Each student must fill in their own `JWT_SECRET` and (optionally) their own SMTP credentials.

---

## Need more help?

If you see an error in the terminal, copy the **full error message** and share it. Most problems are one of these:
- backend not running
- database not seeded
- Python venv not created
- camera/microphone permission blocked
