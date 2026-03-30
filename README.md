# Admission Management & CRM

A full-stack **TypeScript** Admission Management system for colleges to configure programs, manage quotas, process applicants, allocate seats, and generate admission numbers.

## Tech Stack

| Layer | Tech |
|-------|------|
| Language | TypeScript (full-stack) |
| Frontend | React 18 + Vite |
| Server Calls | tRPC (wraps TanStack React Query) |
| Forms | React Hook Form + Zod |
| Client State | Zustand |
| Backend | Node.js + Express + tRPC |
| Validation | Zod (shared schemas) |
| Database | SQLite (better-sqlite3) |
| Auth | JWT |
| Icons | Lucide React |

## Features

- **Master Setup** — CRUD for Institution, Campus, Department, Program, Academic Year
- **Seat Matrix** — Quota configuration (KCET, COMEDK, Management) with intake validation
- **Applicant Management** — 15-field form, document checklist (Pending/Submitted/Verified)
- **Seat Allocation** — Government flow (KCET/COMEDK) & Management flow with real-time quota enforcement
- **Admission Confirmation** — Fee tracking, admission number generation (`INST/YYYY/UG/CSE/KCET/0001`)
- **Dashboard** — Stat cards, quota-wise breakdown, pending documents & fees lists
- **Role-Based Access** — Admin (full), Admission Officer (manage applicants), Management (view only)

## System Rules

| Rule | Enforcement |
|------|-------------|
| Quota seats ≤ intake | Zod validation on quota save |
| No allocation if quota full | Server checks count before insert |
| Admission number generated once | DB `UNIQUE` constraint, single endpoint |
| Admission requires fee paid | Server rejects confirm if fee ≠ Paid |
| Real-time seat counters | Derived from `COUNT(*)` queries |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Install root dependency (shared zod)
cd admission-management
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install --legacy-peer-deps
```

### Running

```bash
# Terminal 1 — Start server
cd server
npm run dev
# → http://localhost:3001

# Terminal 2 — Start client
cd client
npm run dev
# → http://localhost:5173
```

### Demo Credentials

| Role | Username | Password | Access |
|------|----------|----------|--------|
| Admin | `admin` | `admin123` | Full access |
| Admission Officer | `officer` | `officer123` | Manage applicants & admissions |
| Management | `mgmt` | `mgmt123` | View dashboard only |

## Project Structure

```
admission-management/
├── package.json               # Root (shared zod dep)
├── shared/
│   └── schemas.ts             # Zod schemas (types + validation)
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts           # Express + tRPC adapter
│       ├── db.ts              # SQLite schema + seed data
│       ├── context.ts         # JWT auth context
│       ├── trpc.ts            # tRPC init + role guards
│       └── routers/
│           ├── index.ts       # Merged app router
│           ├── auth.ts        # Login
│           ├── masters.ts     # Institution/Campus/Dept/Program/Year CRUD
│           ├── quotas.ts      # Seat matrix config
│           ├── applicants.ts  # Applicant CRUD + documents
│           ├── allocation.ts  # Seat allocation + quota checks
│           ├── admission.ts   # Fee + confirm + admission number
│           └── dashboard.ts   # Aggregated stats
└── client/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx            # Router + tRPC/QueryClient providers
        ├── index.css          # Design system (dark theme)
        ├── trpc.ts            # tRPC client
        ├── store/
        │   └── authStore.ts   # Zustand auth state
        ├── components/
        │   ├── Layout.tsx     # Sidebar + topbar
        │   ├── Modal.tsx
        │   └── ProtectedRoute.tsx
        └── pages/
            ├── Login.tsx
            ├── Dashboard.tsx
            ├── Masters.tsx
            ├── Quotas.tsx
            ├── Applicants.tsx
            ├── ApplicantDetail.tsx
            ├── Allocation.tsx
            └── Admissions.tsx
```

## User Journeys

### Journey 1: System Setup
Admin → Create Institution → Campus → Department → Program → Set Intake → Configure Quotas

### Journey 2: Government Admission
Officer → Create Applicant → Enter allotment number → Allocate KCET/COMEDK seat → Verify documents → Mark fee Paid → Confirm admission → Admission number generated

### Journey 3: Management Admission
Officer → Create Applicant → Select Management quota → Allocate seat → Verify docs → Pay fee → Confirm

### Journey 4: Monitoring
Management → Login → View Dashboard → Check filled seats, remaining quota, pending fees/documents

## License

MIT
