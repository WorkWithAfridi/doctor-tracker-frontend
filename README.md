# Doctor Tracker Frontend

Independent Next.js App Router application using TypeScript and Tailwind CSS. Run commands from this folder:

```powershell
npm.cmd ci
Copy-Item .env.example .env.local
npm.cmd run dev
```

Open http://localhost:3000. The current page is a foundation placeholder; feature pages and authentication will follow. `NEXT_PUBLIC_API_URL` points to the standalone Express API.

- `npm.cmd run lint`: ESLint.
- `npm.cmd run typecheck`: validate TypeScript.
- `npm.cmd run build`: production build.
- `npm.cmd start`: serve the production build.

## Prerequisites and repository independence

Use Node.js 24 LTS and npm. Clone this frontend repository and run the setup commands above from its root. No parent package or sibling folder is required to install or build the frontend. Start the backend separately when integrating API features.

## Environment

Set `NEXT_PUBLIC_API_URL` in `.env.local` to the backend API base URL, including `/api`. The local default is `http://localhost:5000/api`. Public frontend variables must not contain secrets. `.env.local` is ignored; `.env.example` is included in this repository.

## Architecture

Browser → Next.js frontend → standalone Express REST API → MongoDB.

The frontend owns presentation and UI state. The backend owns persistence, authentication, validation, and analytics. The frontend does not access MongoDB directly.

## Source structure

```text
src/
  app/
    layout.tsx                 Root layout and metadata
    page.tsx                   Initial landing page
    login/                     Reserved login route
    (protected)/
      dashboard/               Reserved dashboard route
      doctors/[id]/            Reserved doctor routes
      patients/                Reserved patients route
  components/
    ui/ layout/ common/
    dashboard/ doctors/ patients/
  hooks/                       React hooks
  lib/api.ts                   REST request helper
  services/                    Feature API access
  types/                       Frontend types
  constants/                   Shared constants
```

Reserved route folders have no page files yet. The `(protected)` folder name alone does not enforce authentication.

## Independent deployment

Deploy this repository to Vercel or another Next.js-compatible host. Configure `NEXT_PUBLIC_API_URL` with the hosted backend API URL before building. Configure the backend's `FRONTEND_URL` to allow the exact live frontend origin. Authentication topology will be finalized when login is implemented.

The frontend build and deployment use only files from this repository.

## Submission links

- Frontend GitHub repository: pending publication.
- Live frontend website: pending deployment.
- Companion backend repository and API URL: pending publication and deployment.
- Demo credentials: pending authentication implementation.

## Dependency audit

At scaffold creation, production dependencies passed `npm audit --omit=dev`. Development tooling reported five high-severity findings stemming from `braces` through the Next.js ESLint plugin. No patched `braces` release was available during that check; npm suggested an incompatible major downgrade of the Next.js ESLint configuration. Recheck before submission.

## Documentation to complete

Add implemented feature descriptions, two technical decision explanations, desktop/mobile screenshots, and demo credentials as the application is completed.
