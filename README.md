# Doctor Tracker Frontend

Doctor Tracker is a responsive administrative workspace for doctors, patients, and care analytics. This repository contains the independent Next.js frontend with fully local demo flows. Run commands from this folder:

```powershell
npm.cmd ci
Copy-Item .env.example .env.local
npm.cmd run dev
```

Open http://localhost:3000. The frontend currently runs entirely on browser demo data; the backend does not need to be running.

## Demo login

- Email: `admin@doctortracker.com`
- Password: `Admin123!`

Sign-in is a frontend simulation, not a security boundary. Session state uses session storage, so refreshing retains login in the current tab. All names and records are fictional.

## Implemented demo flows

- Overview with totals, monthly additions, patient growth over 30/90 days, condition distribution, doctor workload, and recent patients.
- Doctor creation and editing, searchable directory, specialization/hospital/date filters, sorting, pagination, and individual doctor profiles.
- Assigned patient lists on doctor profiles, patient creation, editing, reassignment, and confirmed deletion.
- Global patient directory with name/contact/doctor search, condition/doctor/date filters, sorting, and pagination.
- URL-backed filters and page state, empty states, validation feedback, toast notifications, and runtime error recovery.
- Responsive navigation, scrollable tables, native modal dialogs, keyboard focus management, and reduced-motion support.
- Browser persistence with 24 seeded doctors and 186 patients. Reset demo data restores the original records after confirmation.

Date filters use the record's creation date in the browser's local timezone. Dashboard figures derive from the same records and update after mutations. Demo filtering, pagination, and analytics run locally; production will move these operations to the backend API.

If browser storage is blocked, changes remain in memory for the current visit and the UI displays a warning. Data is local to the browser; it is not written to MongoDB.

- `npm.cmd run lint`: ESLint.
- `npm.cmd run typecheck`: validate TypeScript.
- `npm.cmd test`: demo login, CRUD, relationship integrity, persistence, reset, and storage failure checks.
- `npm.cmd run format`: format source, tests, and documentation.
- `npm.cmd run build`: production build.
- `npm.cmd start`: serve the production build.

## Prerequisites and repository independence

Use Node.js 24 LTS and npm. Clone this frontend repository and run the setup commands above from its root. No parent package or sibling folder is required to install or build the frontend.

## Environment

Set `NEXT_PUBLIC_API_URL` in `.env.local` to the backend API base URL, including `/api`. The local default is `http://localhost:5000/api`. Public frontend variables must not contain secrets. `.env.local` is ignored; `.env.example` is included in this repository.

## Architecture

Current demo: browser → frontend demo repository → localStorage (records) and sessionStorage (login).

Planned production: browser → Next.js frontend → standalone Express REST API → MongoDB.

Demo data ownership is centralized in `src/services/demo-store.ts`, with typed entities in `src/types/domain.ts` and seed generation in `src/constants/demo-data.ts`. Pages subscribe to immutable snapshots through React's `useSyncExternalStore`. Components never write directly to browser storage. The existing `lib/api.ts` helper is reserved for future backend integration.

Production authentication, server-side validation, filtering, pagination, and analytics remain backend work. The frontend does not access MongoDB directly.

## Source structure

```text
src/
  app/
    layout.tsx                 Root layout and metadata
    page.tsx                   Redirect to dashboard
    login/                     Demo login
    (protected)/
      dashboard/               Analytics overview
      doctors/[id]/            Doctor directory and profiles
      patients/                Patient directory
  components/
    ui/ layout/ common/
    dashboard/ doctors/ patients/
  hooks/                       React hooks
  lib/api.ts                   REST request helper
  services/                    Feature API access
  types/                       Frontend types
  constants/                   Shared constants
```

The protected layout checks demo session state before displaying records and redirects signed-out users to login. This client-side gate is only for the demo.

## Technical decisions

1. **Central demo repository:** Shared records and mutations live outside page components. Doctor counts, assigned patient lists, and dashboard analytics all observe the same snapshot, preventing views from becoming inconsistent after an edit. This provides a clear boundary for future API integration without introducing Redux for a small local demo.
2. **Referenced patients:** Each patient stores a `doctorId`; patient arrays are not embedded inside doctors. This supports global lists, reassignment, independent patient edits, and doctor-specific views using the same typed records.
3. **URL-backed lists:** Search, filters, sorting, and pagination survive refreshes and are represented in shareable URLs. Native SVG charts avoid a chart dependency for this small demo and expose text summaries and point titles.

## Independent deployment

Deploy this repository to Vercel or another Next.js-compatible host. Configure `NEXT_PUBLIC_API_URL` with the hosted backend API URL before building. Configure the backend's `FRONTEND_URL` to allow the exact live frontend origin. Authentication topology will be finalized when login is implemented.

The frontend build and deployment use only files from this repository.

## Submission links

- Frontend GitHub repository: pending publication.
- Live frontend website: pending deployment.
- Companion backend repository and API URL: pending publication and deployment.
- Demo credentials: listed above; production authentication is pending.

## Dependency audit

At scaffold creation, production dependencies passed `npm audit --omit=dev`. Development tooling reported five high-severity findings stemming from `braces` through the Next.js ESLint plugin. No patched `braces` release was available during that check; npm suggested an incompatible major downgrade of the Next.js ESLint configuration. Recheck before submission.

## Documentation to complete

Add desktop/mobile screenshots after visual QA and final repository/deployment URLs after publishing. Browser visual checks were unavailable in the implementation run because the app's browser automation URL policy rejected access to the local preview.
