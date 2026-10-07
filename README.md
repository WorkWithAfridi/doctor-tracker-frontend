# Doctor Tracker Frontend

## Description

Doctor Tracker is a responsive administrative workspace for doctors, patients, and care analytics. This independent Next.js frontend connects to the standalone Express API; records and login sessions live in MongoDB.

## Technology stack

| Layer             | Implementation                                                           |
| ----------------- | ------------------------------------------------------------------------ |
| Frontend          | Next.js 16 App Router, React 19, TypeScript                              |
| UI                | Custom CSS, reusable React components, Lucide icons, native SVG charts   |
| State and data    | React external-store subscriptions, shared API cache, URL-backed filters |
| Companion backend | Standalone Node.js/Express REST API, TypeScript, Mongoose, MongoDB       |
| Authentication    | Server-verified administrator or staff session with an HTTP-only cookie  |
| Tooling           | ESLint, TypeScript, Prettier, Node test runner with tsx                  |

The assessment specifies a separate Next.js client and standalone Node.js/Express server. Each folder has its own package manifest, environment example, README, Git history, and deployment instructions.

## Assessment requirements and implementation

| Assessment area                     | Frontend implementation                                                                                                                                                                                                      |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authentication and protected portal | Empty login fields, administrator/staff session verification before data views render, and sign-out on protected API HTTP 401; the backend enforces role permissions.                                                        |
| Doctor creation and management      | Name, specialization, hospital, phone, and email form; searchable directory, specialization/hospital/date filters, sorting, pagination, profile editing.                                                                     |
| Corresponding patients              | Doctor profile with assigned patients; add, edit, reassign, and confirm deletion.                                                                                                                                            |
| Dedicated patient page              | Global patient list, name/contact/doctor search, condition/doctor/date filters, sorting, pagination, editing and deletion.                                                                                                   |
| Dashboard and visualization         | Total doctors/patients, monthly additions, average workload, top-five doctor bars, condition donut, six-interval growth chart over 30/90 days, and recent patients.                                                          |
| UI/UX and navigation                | Dashboard/Doctors/Patients/Profile navigation and administrator-only Settings, responsive sidebar, scrollable tables, loading/empty/error states, retry actions, debounced search, native dialogs and success notifications. |
| Performance and maintainability     | Reusable components, server pagination, shared request deduplication, stale-response protection, URL filters and cache invalidation after writes.                                                                            |
| Additional testing tools            | Settings for confirmed reset and configurable sample batches; separate API documentation sidebar link.                                                                                                                       |

No third-party chart library is required by the assessment; charts use accessible SVG roles, descriptions and point titles. Their values come from backend aggregation responses, rather than independently calculated browser totals.

## Setup guide

1. Install Node.js 24 LTS and npm, and clone this frontend repository.
2. Start the separately configured backend and MongoDB using the backend README.
3. From this frontend repository, install dependencies, copy the included [environment example](.env.example), and start the development server:

```powershell
npm.cmd ci
Copy-Item .env.example .env.local
npm.cmd run dev
```

4. Open [Doctor Tracker](http://localhost:3000) and sign in with the seeded account below.

Keep the backend running at http://localhost:5000 with local MongoDB available. In the backend repository, follow its README to configure MongoDB, run `npm.cmd run seed`, and start `npm.cmd run dev`. No sibling directory or parent package is needed to install or build either repository independently.

## Seeded development account

- Email: `admin@doctortracker.com`
- Password: `Admin123!`

The backend seed creates 24 fictional doctors and 186 fictional patients. Authentication checks the backend account and uses an HTTP-only session cookie. Refreshing the page restores the session through `GET /api/auth/me`; logout revokes it on the server. Browser demo storage is no longer used or imported. Existing browser demo records are not migrated into MongoDB.

## Connected flows

- Login, current administrator or staff account, logout, and redirect to login after a session expires.
- Profile with password changes that revoke all sessions; administrator-only staff creation and paginated workspace accounts.
- Doctor directory and profiles, creation/editing, patient counts, and filter options.
- Global and doctor-specific patient lists, creation/editing, reassignment, and confirmed deletion.
- Server search, specialization/hospital/condition/doctor/date filters, name/date sorting, and pagination.
- Database-derived dashboard totals, monthly additions, 30/90-day growth, patient conditions, top doctors, and recent patients.
- URL-backed list filters, debounced search, loading and retry states, server field errors, and success notifications.
- Responsive navigation, keyboard focus management, native modal dialogs, and reduced-motion support.
- Settings with record counts, confirmed workspace reset, and generation of 1–2,000 doctors and 1,000–2,000 fictional patients per batch (defaults: 100 doctors, 1,500 patients).
- Sidebar API documentation link derived from the configured backend URL.

Writes affect the connected MongoDB database and persist across browser sessions. Settings reset permanently removes all doctors and patients after typing RESET; all user accounts, sessions, and indexes are preserved. Each population batch appends both the selected number of doctors and patients to existing records, distributing patients across existing and newly created doctors. Both operations require confirmation and refresh visible counts and data. Date filters and analytics use UTC; ordinary record timestamps are formatted for display in the browser's timezone. Daily growth counts are grouped into six chart intervals; deleted patients are excluded by the backend.

## Environment and API documentation

Set `NEXT_PUBLIC_API_URL` in `.env.local` to the backend base URL **including /api**. The local value is `http://localhost:5000/api`. This public setting must not contain database credentials or secrets. Restart the frontend after changing it; deployment values are configured before building.

The backend must allow the exact frontend origin via `FRONTEND_URL=http://localhost:3000`. Use localhost consistently when opening the frontend. Requests include cookies and browsers supply the Origin header required for writes. The frontend does not access MongoDB directly.

Inspect and try the endpoints at [Swagger UI](http://localhost:5000/docs/) or import [OpenAPI JSON](http://localhost:5000/openapi.json) into Postman or Bruno.

## System architecture

Browser → independent Next.js frontend → standalone Express REST API → MongoDB.

- `src/lib/api.ts`: credentialed requests, structured API errors, and expired-session notifications.
- `src/services/auth-store.ts`: server-verified administrator/staff account and login/logout/password-change state.
- `src/services/records.ts`: write contracts, URL-to-API query mapping, and paginated doctor assignment options.
- `src/services/api-cache.ts`: shared request deduplication, retries, invalidation, and stale-request protection.
- `src/hooks/use-api.ts`: React subscription to API resource state.
- `src/hooks/use-list-filters.ts`: shareable URL filters and pagination.
- `src/components/`: existing care workspace UI with backend records.
- `src/types/domain.ts`: frontend entities and API response contracts.

The protected layout waits for session verification before rendering data views. The backend enforces authorization on every protected request. Successful mutations invalidate cached feature resources, refreshing visible lists, profiles, selectors, and dashboard counts. Cache data is cleared on logout/session expiry and is not persisted in browser storage. Returning to a view refreshes its resources.

Tables use server pagination rather than downloading all patients. Doctor assignment selectors fetch successive bounded pages so doctors beyond the first 50 remain selectable. There is no client-side fallback to fictional records when the API fails.

## Technical decisions

### 1. Shared API resources with React external-store subscriptions

List pages, the sidebar count and forms need to observe consistent data after a write. A shared resource cache keyed by API path deduplicates in-flight requests, while `useSyncExternalStore` subscribes each view to its resource state. Feature components own only UI state such as the open modal; the backend owns records, validation, list results and totals. Authentication is a separate store verified through `/auth/me`.

Each resource exposes loading, error, data and retry state. Successful writes invalidate the cache and reload active resources; logout and session expiry clear cached records without issuing more protected requests. An aborted or superseded request cannot overwrite the newer response. This handles the current portal without introducing Redux or a third-party query client. The tradeoffs are a small custom cache to maintain, broad invalidation after writes and no automatic background polling or offline persistence. A larger application could adopt a query library with cache eviction and more selective invalidation.

### 2. URL-backed queries with server-owned pagination and analytics

Search, filter, sorting and pagination values live in the URL, so navigation and refresh preserve the list being viewed. A 300 ms search debounce limits request churn; the request mapper converts UI keys such as `size`, `sort` and `doctor` into the backend's `limit`, `sortBy/sortOrder` and `doctorId`. Tables render one server page instead of downloading all patients. Shared form/table/modal components keep behavior consistent across global and doctor-specific patient views.

The dashboard consumes server totals, condition counts, top doctor groups and zero-filled UTC daily counts. Its six chart intervals are presentation grouping of that response, keeping statistics consistent with MongoDB after edits. Doctor selectors are an intentional exception to table pagination: they fetch bounded pages until every doctor is available for assignment. This is suitable for the assessment dataset; at much larger doctor counts, a remote searchable selector would avoid loading the complete directory. Offset pagination is similarly simple for this dataset but would need cursor pagination for larger collections.

## Scripts and verification

- `npm.cmd run lint`: ESLint.
- `npm.cmd run typecheck`: TypeScript.
- `npm.cmd test`: request credentials/errors, session-expiry notification, query mapping, nested writes/reassignment, complete doctor selectors, retries, request deduplication, stale responses, and cache clearing.
- `npm.cmd run build`: production build.
- `npm.cmd start`: serve the production build.
- `npm.cmd run format`: format source, tests, and README.

Backend integration tests verify real MongoDB CRUD, authentication, analytics, filters, pagination, and security using their own temporary local database. Frontend tests mock HTTP transport and do not alter the application database. The deployed login, dashboard, and Profile page have been visually checked. Profile password changes and staff authorization are covered by isolated backend integration tests; production passwords were not changed for verification.

## Visual evidence

The assessment requires high-quality desktop and mobile screenshots. **Pending: the complete desktop/mobile submission screenshot set has not yet been added to this repository.** Live deployment checks and a Profile screenshot have been captured during development, but they do not replace the full assessment evidence set below.

| Evidence to capture                   | What it should show                                                | Suggested repository path                                                       |
| ------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Desktop dashboard                     | Totals, growth/conditions charts, doctor workload, recent patients | `docs/screenshots/dashboard-desktop.png`                                        |
| Desktop doctor and patient management | Filters, pagination, doctor profile and assigned patients          | `docs/screenshots/doctors-desktop.png`, `docs/screenshots/patients-desktop.png` |
| Mobile portal                         | Open navigation, readable dashboard, usable patient table and form | `docs/screenshots/dashboard-mobile.png`, `docs/screenshots/patients-mobile.png` |

After capturing and reviewing the real UI, add the files to this repository and embed them here. Keep screenshots free of database credentials and session cookies; seeded fictional data is appropriate for submission evidence.

## Profile and staff access

Open **Profile** in the sidebar to view your account and change your password. Enter your current password and confirm a new password of at least 8 characters. Changing a password signs that user out on every device, so they must sign in again. Login fields are empty and contain no demo credentials.

Administrators can add staff on the same page and view the paginated workspace user list. Each staff member receives their own email/password login, can manage care records, and can change their password. Staff cannot create accounts or reset/populate the database; Settings is hidden and those APIs enforce administrator access. No public signup or email delivery is provided; administrators share initial credentials with their staff.

## Independent deployment

The frontend is deployed on Vercel at [Doctor Tracker](https://doctor-tracker-frontend-ten.vercel.app). The production API is [hosted separately](https://doctor-tracker-backend-xi.vercel.app/docs/). Import this repository as a separate Next.js project with root directory `./` and the default Next.js output settings. Set `NEXT_PUBLIC_API_URL` to the hosted backend API URL before building and configure the backend's `FRONTEND_URL` with the exact live frontend origin. The build uses only this repository's files.

The backend uses Secure cookies in production. Prefer a same-site frontend/backend domain arrangement or frontend proxy. Direct cross-site cookies require HTTPS and backend `COOKIE_SAME_SITE=none`, and browser third-party-cookie policies may still affect access. Verify the deployment topology before submission.

## Submission checklist

| Required submission item           | Current status                                                                                     |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| Frontend GitHub repository link    | [doctor-tracker-frontend](https://github.com/WorkWithAfridi/doctor-tracker-frontend)               |
| Backend GitHub repository link     | [doctor-tracker-backend](https://github.com/WorkWithAfridi/doctor-tracker-backend)                 |
| Live frontend website URL          | [Doctor Tracker](https://doctor-tracker-frontend-ten.vercel.app)                                   |
| Live backend API URL               | [Production API](https://doctor-tracker-backend-xi.vercel.app/api)                                 |
| Reviewer credentials               | Local seeded account above; verify the credentials of the deployed demo account before submission. |
| Desktop and mobile visual evidence | Pending capture; see Visual evidence.                                                              |

Both applications are deployed. Production uses `NEXT_PUBLIC_API_URL=https://doctor-tracker-backend-xi.vercel.app/api` and backend `FRONTEND_URL=https://doctor-tracker-frontend-ten.vercel.app`. Before submitting, check login/CRUD/charts on the deployed hosts and attach verified desktop/mobile screenshots.
