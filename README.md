# Doctor Tracker Frontend

Doctor Tracker is a responsive administrative workspace for doctors, patients, and care analytics. This independent Next.js frontend connects to the standalone Express API; records and login sessions live in MongoDB.

## Local setup

Use Node.js 24 LTS and npm. Run these commands from this frontend repository:

```powershell
npm.cmd ci
Copy-Item .env.example .env.local
npm.cmd run dev
```

Open http://localhost:3000. Keep the backend running at http://localhost:5000 with local MongoDB available. In the backend repository, follow its README to configure MongoDB, run `npm.cmd run seed`, and start `npm.cmd run dev`. No sibling directory or parent package is needed to install or build either repository independently.

## Seeded development account

- Email: `admin@doctortracker.com`
- Password: `Admin123!`

The backend seed creates 24 fictional doctors and 186 fictional patients. Authentication checks the backend account and uses an HTTP-only session cookie. Refreshing the page restores the session through `GET /api/auth/me`; logout revokes it on the server. Browser demo storage is no longer used or imported. Existing browser demo records are not migrated into MongoDB.

## Connected flows

- Login, current administrator, logout, and redirect to login after a session expires.
- Doctor directory and profiles, creation/editing, patient counts, and filter options.
- Global and doctor-specific patient lists, creation/editing, reassignment, and confirmed deletion.
- Server search, specialization/hospital/condition/doctor/date filters, name/date sorting, and pagination.
- Database-derived dashboard totals, monthly additions, 30/90-day growth, patient conditions, top doctors, and recent patients.
- URL-backed list filters, debounced search, loading and retry states, server field errors, and success notifications.
- Responsive navigation, keyboard focus management, native modal dialogs, and reduced-motion support.
- Settings with record counts, confirmed workspace reset, and generation of 1–2,000 doctors and 1,000–2,000 fictional patients per batch (defaults: 100 doctors, 1,500 patients).
- Sidebar API documentation link derived from the configured backend URL.

Writes affect the connected MongoDB database and persist across browser sessions. Settings reset permanently removes all doctors and patients after typing RESET; administrator accounts, sessions, and indexes are preserved. Each population batch appends both the selected number of doctors and patients to existing records, distributing patients across existing and newly created doctors. Both operations require confirmation and refresh visible counts and data. Date filters and analytics use UTC; ordinary record timestamps are formatted for display in the browser's timezone. Daily growth counts are grouped into six chart intervals; deleted patients are excluded by the backend.

## Environment and API documentation

Set `NEXT_PUBLIC_API_URL` in `.env.local` to the backend base URL **including /api**. The local value is `http://localhost:5000/api`. This public setting must not contain database credentials or secrets. Restart the frontend after changing it; deployment values are configured before building.

The backend must allow the exact frontend origin via `FRONTEND_URL=http://localhost:3000`. Use localhost consistently when opening the frontend. Requests include cookies and browsers supply the Origin header required for writes. The frontend does not access MongoDB directly.

Inspect and try the endpoints at [Swagger UI](http://localhost:5000/docs/) or import [OpenAPI JSON](http://localhost:5000/openapi.json) into Postman or Bruno.

## Architecture

Browser → independent Next.js frontend → standalone Express REST API → MongoDB.

- `src/lib/api.ts`: credentialed requests, structured API errors, and expired-session notifications.
- `src/services/auth-store.ts`: server-verified administrator and login/logout state.
- `src/services/records.ts`: write contracts, URL-to-API query mapping, and paginated doctor assignment options.
- `src/services/api-cache.ts`: shared request deduplication, retries, invalidation, and stale-request protection.
- `src/hooks/use-api.ts`: React subscription to API resource state.
- `src/hooks/use-list-filters.ts`: shareable URL filters and pagination.
- `src/components/`: existing care workspace UI with backend records.
- `src/types/domain.ts`: frontend entities and API response contracts.

The protected layout waits for session verification before rendering data views. The backend enforces authorization on every protected request. Successful mutations invalidate cached feature resources, refreshing visible lists, profiles, selectors, and dashboard counts. Cache data is cleared on logout/session expiry and is not persisted in browser storage. Returning to a view refreshes its resources.

Tables use server pagination rather than downloading all patients. Doctor assignment selectors fetch successive bounded pages so doctors beyond the first 50 remain selectable. There is no client-side fallback to fictional records when the API fails.

## Scripts and verification

- `npm.cmd run lint`: ESLint.
- `npm.cmd run typecheck`: TypeScript.
- `npm.cmd test`: request credentials/errors, session-expiry notification, query mapping, nested writes/reassignment, complete doctor selectors, retries, request deduplication, stale responses, and cache clearing.
- `npm.cmd run build`: production build.
- `npm.cmd start`: serve the production build.
- `npm.cmd run format`: format source, tests, and README.

Backend integration tests verify real MongoDB CRUD, authentication, analytics, filters, pagination, and security using their own temporary local database. Frontend tests mock HTTP transport and do not alter the application database. Browser visual verification remains outstanding because the app's browser automation URL policy rejected access to the local preview.

## Independent deployment

Deploy this repository to a Next.js host such as Vercel. Set `NEXT_PUBLIC_API_URL` to the hosted backend API URL before building and configure the backend's `FRONTEND_URL` with the exact live frontend origin. The build uses only this repository's files.

The backend uses Secure cookies in production. Prefer a same-site frontend/backend domain arrangement or frontend proxy. Direct cross-site cookies require HTTPS and backend `COOKIE_SAME_SITE=none`, and browser third-party-cookie policies may still affect access. Verify the deployment topology before submission.

## Submission

- Frontend GitHub repository: pending publication.
- Live frontend website: pending deployment.
- Backend GitHub repository and live API: pending publication and deployment.
- Seeded development credentials: above; customize the backend account for deployment.

Add final URLs and desktop/mobile screenshots after deployment and visual verification.
