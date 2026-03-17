# Login System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full-stack login system with React frontend and Node.js backend, where login verifies password and returns clear success/failure messages and user info.

**Architecture:** Use a split architecture: `frontend` (Next.js + React) and `backend` (Node.js + Express + MySQL). Backend owns account storage, password verification, and login counters/time updates; frontend handles form submission and result rendering.

**Tech Stack:** Next.js (React), Node.js, Express, mysql2, bcryptjs, JWT (optional for session token), Vitest/Jest + Supertest, MySQL 8.

---

## Requirements Mapping

- Username/password form + login button: `frontend` page with controlled form.
- Login success view with user info: show username, latest login time, login count, failed count.
- DB stores accounts: `users` table with unique username and password hash.
- Record login time/count/error count: update stats on every attempt and keep login history.
- Password correctness checks and prompt: backend returns standardized error message for wrong password / missing user.

## Project Structure

```text
login_system/
  frontend/               # Next.js app
  backend/                # Express API
  docs/plans/
```

### Task 1: Initialize Repo Skeleton

**Files:**
- Create: `frontend/`
- Create: `backend/`
- Create: `README.md`

**Step 1: Create frontend app**

Run: `npx create-next-app@latest frontend --ts --eslint --src-dir --app`
Expected: Next.js scaffold complete.

**Step 2: Create backend app**

Run: `mkdir backend && cd backend && npm init -y`
Expected: `backend/package.json` created.

**Step 3: Install backend dependencies**

Run: `npm i express mysql2 bcryptjs dotenv cors && npm i -D nodemon vitest supertest`
Expected: dependencies installed.

### Task 2: Define Database Schema

**Files:**
- Create: `backend/sql/init.sql`
- Create: `backend/src/config/db.js`

**Step 1: Write schema SQL**

Create tables:
- `users(id, username, password_hash, login_count, failed_count, last_login_at, created_at, updated_at)`
- `login_audit(id, user_id, username_snapshot, status, message, attempted_at)`

**Step 2: Add DB config**

Use env vars from your JDBC info:
- `DB_HOST=localhost`
- `DB_PORT=3306`
- `DB_NAME=login_system`
- `DB_USER=${DB_USERNAME}`
- `DB_PASSWORD=${DB_PASSWORD}`
- `DB_TIMEZONE=Asia/Shanghai`

### Task 3: Backend Foundation

**Files:**
- Create: `backend/src/app.js`
- Create: `backend/src/server.js`
- Create: `backend/src/routes/auth.js`
- Create: `backend/src/controllers/authController.js`
- Create: `backend/src/services/authService.js`
- Create: `backend/src/repositories/userRepository.js`

**Step 1: Build Express app**

Add middleware: `express.json()`, `cors()`, request logger, global error handler.

**Step 2: Register auth routes**

API endpoints:
- `POST /api/auth/login`
- `POST /api/auth/register` (seed/create account for testing)

### Task 4: Implement Register Logic

**Files:**
- Modify: `backend/src/services/authService.js`
- Modify: `backend/src/repositories/userRepository.js`

**Step 1: Validate input**

Check username/password non-empty and minimum password length.

**Step 2: Hash password**

Use `bcryptjs.hash(password, 10)` before insert.

**Step 3: Save user**

Insert user with `login_count=0`, `failed_count=0`.

### Task 5: Implement Login Logic and Counters

**Files:**
- Modify: `backend/src/services/authService.js`
- Modify: `backend/src/repositories/userRepository.js`

**Step 1: Find user by username**

If missing: write `login_audit` failed record and return `401`.

**Step 2: Verify password**

Use `bcryptjs.compare(plain, hash)`.

**Step 3: On success**

- Increment `login_count = login_count + 1`
- Set `last_login_at = NOW()`
- Insert success `login_audit`
- Return user info (no password hash)

**Step 4: On failure**

- Increment `failed_count = failed_count + 1`
- Insert failed `login_audit`
- Return `401` with message like `用户名或密码错误`

### Task 6: API Response Contract

**Files:**
- Modify: `backend/src/controllers/authController.js`
- Create: `backend/src/utils/response.js`

**Step 1: Standardize response**

Success:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "id": 1,
    "username": "alice",
    "loginCount": 3,
    "failedCount": 1,
    "lastLoginAt": "2026-03-11T10:00:00.000Z"
  }
}
```

Failure:
```json
{
  "success": false,
  "message": "用户名或密码错误"
}
```

### Task 7: Backend Testing

**Files:**
- Create: `backend/tests/auth.login.test.js`
- Create: `backend/tests/auth.register.test.js`

**Step 1: Write failing tests**

Cases:
- register success
- duplicate username rejected
- login success updates `login_count` and `last_login_at`
- wrong password updates `failed_count`

**Step 2: Run tests**

Run: `npm test` (or `npx vitest run`)
Expected: all tests pass.

### Task 8: Frontend Login Page

**Files:**
- Modify: `frontend/src/app/page.tsx`
- Create: `frontend/src/components/LoginForm.tsx`
- Create: `frontend/src/lib/api.ts`

**Step 1: Build form UI**

Fields:
- username input
- password input
- submit button

**Step 2: Call backend API**

POST to `http://localhost:3001/api/auth/login`.

**Step 3: Render result**

- success: show `登录成功` + user info card
- fail: show error message under form

### Task 9: Frontend Validation and UX

**Files:**
- Modify: `frontend/src/components/LoginForm.tsx`

**Step 1: Client validation**

Reject empty username/password before request.

**Step 2: Loading and disable state**

Disable button while request is pending; show `登录中...`.

**Step 3: Error handling**

Handle network timeout/backend crash with generic message.

### Task 10: Integration and Environment Config

**Files:**
- Create: `backend/.env.example`
- Create: `frontend/.env.local.example`
- Modify: `README.md`

**Step 1: Backend env template**

Include `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `PORT`.

**Step 2: Frontend env template**

Include `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001`.

**Step 3: Startup scripts**

Backend:
- `npm run dev` -> nodemon server

Frontend:
- `npm run dev` -> next dev

### Task 11: End-to-End Manual Verification

**Files:**
- Modify: `README.md`

**Step 1: Prepare DB**

Run: `mysql -u root -p < backend/sql/init.sql`

**Step 2: Run both services**

- backend on `http://localhost:3001`
- frontend on `http://localhost:3000`

**Step 3: Verify scenarios**

- valid login -> success message + correct counts/time
- wrong password -> error message + failed count increments
- non-existing user -> error prompt

### Task 12: Optional Hardening (If Time Permits)

**Files:**
- Modify: `backend/src/middleware/rateLimit.js` (new)
- Modify: `backend/src/routes/auth.js`

**Step 1: Add rate limiting**

Prevent brute-force from same IP.

**Step 2: Security checks**

- Use parameterized queries only
- Never return password hash
- Add basic input sanitization

## Definition of Done

- Frontend has login form (username/password/button) and success info display.
- Backend validates credentials and returns clear prompt.
- MySQL stores users and updates `login_count`, `failed_count`, `last_login_at`.
- Login attempts are auditable.
- Core API tests pass and manual E2E scenarios pass.

