# Service Request Tracker

A compact, secure internal service request tracker. Employees sign in, raise requests, and move them through a controlled workflow (**Open → In progress → Resolved**). Every status change is audited, and stale updates are rejected instead of silently overwriting someone else's change.

- **Backend:** Laravel 13 REST API, MySQL, Laravel Sanctum (SPA cookie authentication)
- **Frontend:** Next.js 16 (App Router, TypeScript, Tailwind CSS)
- **Tests:** 48 automated Laravel tests

## Screenshots

_Added in the next commit._

## Repository structure

| Folder | Contents |
|---|---|
| [`backend/`](backend) | Laravel REST API, migrations, seeders and tests |
| [`frontend/`](frontend) | Next.js web app |

## Requirements

| Tool | Version |
|---|---|
| PHP | 8.3 or newer |
| Composer | 2.x |
| MySQL | 8.0 or newer |
| Node.js | 20.9 or newer |
| npm | 10.x |

No paid services are needed. Everything runs locally.

## Setup

### 1. Create the databases

```bash
mysql -u root -e "CREATE DATABASE service_request_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -e "CREATE DATABASE service_request_tracker_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

The second database is used only by the automated tests, so running tests never touches your data.

### 2. Backend (Laravel API)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Check the `DB_*` values in `backend/.env` (defaults: `root` with no password on `127.0.0.1:3306`), then:

```bash
php artisan migrate --seed
php artisan serve
```

The API runs at **http://localhost:8000**.

### 3. Frontend (Next.js)

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open **http://localhost:3000** and sign in with a [demo account](#demo-accounts).

> Use `localhost`, not `127.0.0.1`. The session cookie is set for `localhost`, and the API only accepts requests from `http://localhost:3000`.

`.env` files are not committed. Only the `.env.example` files are, and they contain no secrets.

## Running the tests

```bash
cd backend
php artisan test
```

Tests run against the separate `service_request_tracker_test` database (configured in `backend/phpunit.xml`).

| Test file | Tests | Covers |
|---|---|---|
| `tests/Feature/AuthTest.php` | 9 | Login, wrong password, validation, rate limit, `/me`, logout, 401, bearer tokens ignored |
| `tests/Feature/ServiceRequestTest.php` | 11 | Create (201, 422, field limits, server-owned fields), list (own only, newest first, search, combined filters, pagination 10 / max 25) |
| `tests/Feature/ServiceRequestAccessTest.php` | 5 | Detail and history, other users' and unknown requests (404), 401 |
| `tests/Feature/StatusTransitionTest.php` | 15 | Valid transition, full workflow, 6 invalid transitions (409), stale version (409), race condition, rollback, 422, 404, 401 |
| `tests/Feature/ErrorResponseTest.php` | 5 | Consistent JSON errors, identical 404s, no stack traces |
| `tests/Unit/RequestStatusTest.php` | 3 | Workflow rules in the enum |

Code style and frontend checks:

```bash
cd backend && ./vendor/bin/pint --test
cd frontend && npm run lint && npm run build
```

## Demo accounts

Created by `php artisan migrate --seed`:

| Name | Email | Password |
|---|---|---|
| Alice Perera | `alice@example.com` | `password` |
| Bob Fernando | `bob@example.com` | `password` |

Each user has a few sample requests in different statuses. Sign in as one user to confirm you can't see the other user's requests.

## Authentication

**Choice: Laravel Sanctum, SPA cookie-based.**

Why:

- The frontend and API run on the same site (`localhost`), which is the setup Sanctum's SPA mode is built for.
- The session lives in an **httpOnly** cookie, so JavaScript (and therefore an XSS attack) can't read it. A token stored in `localStorage` can be stolen that way.
- Logout really ends the session on the server. A JWT stays valid until it expires unless a revocation list is added.

How it works:

1. The frontend calls `GET /sanctum/csrf-cookie`, which sets an `XSRF-TOKEN` cookie.
2. Every `POST`/`PATCH` request sends that value in the `X-XSRF-TOKEN` header. Without it, the API returns **419**.
3. `POST /api/auth/login` checks the password (bcrypt) and starts a session. The session ID is regenerated to prevent session fixation.
4. The browser sends the session cookie automatically (`credentials: "include"`).

Security settings:

- Session cookie: `httpOnly`, `SameSite=Lax`, expires after `SESSION_LIFETIME` minutes (120).
- CORS: only `FRONTEND_URL` is allowed, with credentials.
- Login is rate-limited to 5 attempts per minute per email and IP (**429**).
- `Authorization: Bearer` headers are ignored, since only cookie sessions are supported.

## API reference

Base URL: `http://localhost:8000`. All `/api/requests` endpoints require a signed-in session.

| Method | Endpoint | Description | Success |
|---|---|---|---|
| `POST` | `/api/auth/login` | Sign in (`email`, `password`) | 200 |
| `GET` | `/api/auth/me` | Current user | 200 |
| `POST` | `/api/auth/logout` | Sign out | 204 |
| `POST` | `/api/requests` | Create a request | 201 |
| `GET` | `/api/requests` | List own requests | 200 |
| `GET` | `/api/requests/{id}` | Request detail, including `version` | 200 |
| `GET` | `/api/requests/{id}/history` | Status history, oldest first | 200 |
| `PATCH` | `/api/requests/{id}/status` | Change status | 200 |

### Create a request

```json
POST /api/requests
{ "title": "Printer not working", "description": "Office printer stopped responding.", "priority": "HIGH" }
```

| Field | Rules |
|---|---|
| `title` | required, 3–100 characters |
| `description` | required, 10–500 characters |
| `priority` | required, `LOW`, `MEDIUM` or `HIGH` |

`status` is always `OPEN` and `version` is always `1`. The owner (`created_by`) is the signed-in user. Any `created_by`, `status` or `version` in the body is ignored.

### List requests

`GET /api/requests?search=printer&status=OPEN&priority=HIGH&per_page=10&page=1`

| Query | Description |
|---|---|
| `search` | Title contains this text |
| `status` | `OPEN`, `IN_PROGRESS` or `RESOLVED` |
| `priority` | `LOW`, `MEDIUM` or `HIGH` |
| `per_page` | 1–25, default 10 |
| `page` | Page number |

Only the signed-in user's requests are returned, newest first. `status` and `priority` can be combined.

### Change status

```json
PATCH /api/requests/12/status
{ "status": "IN_PROGRESS", "expected_version": 1, "remark": "Technician assigned" }
```

| Field | Rules |
|---|---|
| `status` | required, `OPEN`, `IN_PROGRESS` or `RESOLVED` |
| `expected_version` | required, the `version` the client last saw |
| `remark` | optional, up to 255 characters |

### Response shape

One record:

```json
{
  "data": {
    "id": 12,
    "title": "Printer not working",
    "description": "Office printer stopped responding.",
    "priority": "HIGH",
    "status": "IN_PROGRESS",
    "version": 2,
    "allowed_transitions": ["RESOLVED"],
    "created_at": "2026-11-21T09:15:00.000000Z",
    "updated_at": "2026-11-21T09:20:00.000000Z"
  }
}
```

`allowed_transitions` lists the statuses the request can move to next (empty once resolved). The frontend uses it to show only valid actions.

A list adds pagination details:

```json
{
  "data": [ { "id": 12, "...": "..." } ],
  "links": { "first": "...", "last": "...", "prev": null, "next": "..." },
  "meta": { "current_page": 1, "last_page": 2, "per_page": 10, "total": 14, "from": 1, "to": 10 }
}
```

History entry:

```json
{
  "id": 1,
  "from_status": "OPEN",
  "to_status": "IN_PROGRESS",
  "remark": "Technician assigned",
  "actor": { "id": 1, "name": "Alice Perera", "email": "alice@example.com" },
  "created_at": "2026-11-21T09:20:00.000000Z"
}
```

### Errors

Every error is JSON with a `message`. There are never stack traces or internal class names.

| Status | When | Body |
|---|---|---|
| 401 | Not signed in | `{ "message": "Unauthenticated." }` |
| 404 | Unknown request **or another user's request** | `{ "message": "Resource not found." }` |
| 409 | Stale version or transition not allowed | `{ "message", "reason", "current_status", "current_version" }` |
| 419 | Missing or invalid CSRF token | `{ "message": "CSRF token mismatch." }` |
| 422 | Invalid input | `{ "message", "errors": { "field": ["..."] } }` |
| 429 | Too many login attempts | `{ "message": "Too Many Attempts." }` |

409 example:

```json
{
  "message": "This request was changed by someone else. Reload it and try again.",
  "reason": "stale_version",
  "current_status": "IN_PROGRESS",
  "current_version": 2
}
```

`reason` is `stale_version` or `invalid_transition`.

**Other users' requests return 404, not 403.** This is applied the same way on every endpoint (detail, history and status change). A 404 doesn't reveal whether a request with that ID exists. Ownership is checked before validation, so even an invalid body gets 404 for someone else's request.

## Workflow and concurrency

```
OPEN ──► IN_PROGRESS ──► RESOLVED (final)
```

No skipping, no going back, no "same status" changes, and nothing after `RESOLVED`. These all return **409**. The rules live in one place: `RequestStatus::allowedTransitions()`.

**Stale updates (optimistic locking).** Each request has a `version`. The client sends the version it last saw as `expected_version`. `StatusTransitionService` then, inside one database transaction:

1. Runs `UPDATE service_requests SET status = ?, version = version + 1 WHERE id = ? AND version = ?`.
2. If no row was updated, someone else changed the request first. It returns **409** (`stale_version`) and nothing is written.
3. Otherwise it inserts **exactly one** row into `request_status_histories`.

The version check and the update are one SQL statement, so when two requests race with the same version, only one can succeed. If the history insert fails, the whole transaction rolls back. A failed update never creates audit history.

In the UI, a 409 shows a warning, reloads the latest version and history automatically, and keeps the typed remark so the user can review and retry.

## Design decisions

- **Status and priority are string columns, not database enums.** A new value only needs a change to the PHP enum, with no migration. Allowed values are enforced by the enum and validation.
- **No history row on create.** History records status changes; the creation time is `service_requests.created_at`.
- **Server-owned fields:** `created_by`, `status` and `version` can't be set by the client.
- **Thin controllers:** validation in Form Requests, ownership in a Policy, the workflow in `StatusTransitionService`, response shapes in API Resources, and one central JSON error handler in `bootstrap/app.php`.
