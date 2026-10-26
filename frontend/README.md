# Say I Do — Frontend

The Next.js 16 (App Router) frontend for [Say I Do](https://sayido.lk) — Sri Lanka's wedding directory and planning platform.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Key Routes](#key-routes)
- [Testing](#testing)
- [Code Quality](#code-quality)

---

## Overview

The frontend is a Next.js 16 application using the **App Router**. It communicates with the NestJS backend via:

- **GraphQL** — vendor/visitor data, reviews, packages, recommendations
- **REST** — file uploads, payments, auth callbacks
- **WebSocket** (Socket.io) — real-time chat

The frontend is deployed on **Vercel** and configured for standalone output (`output: "standalone"` in `next.config.mjs`).

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) | Framework, routing, SSR/SSG |
| React 19 | UI library |
| TypeScript 5 | Static typing |
| Tailwind CSS 3 | Utility-first styling |
| Framer Motion | Page transitions and animations |
| Apollo Client | GraphQL client |
| Socket.io Client | Real-time chat (WebSocket) |
| Leaflet / React-Leaflet | Interactive maps |
| Sanity (`next-sanity`) | Blog content CMS |
| React Testing Library | Component testing |
| Jest | Test runner |
| ESLint | Linting |

---

## Project Structure

```
frontend/
├── public/                   # Static assets (images, icons, fonts)
├── src/
│   ├── app/                  # App Router pages and layouts
│   │   ├── layout.tsx        # Root layout (fonts, providers, metadata)
│   │   ├── page.tsx          # Homepage
│   │   ├── vendor-dashboard/ # Vendor portal pages
│   │   ├── visitor-dashboard/# Couple/visitor portal pages
│   │   ├── vendor-search/    # Vendor search and browse
│   │   ├── vendors/          # Individual vendor profile pages
│   │   ├── blog/             # Blog (Sanity CMS)
│   │   ├── login/            # Visitor login
│   │   ├── sign-up/          # Visitor registration
│   │   ├── vendor-login/     # Vendor login
│   │   ├── vendor-signup/    # Vendor registration
│   │   └── api/              # Next.js API route handlers
│   │
│   ├── components/
│   │   ├── shared/           # Layout components (Header, Footer, Nav, SearchBar)
│   │   ├── home/             # Homepage sections
│   │   ├── vendor-dashboard/ # Vendor dashboard widgets
│   │   ├── visitor-dashboard/# Visitor dashboard widgets (budget, checklist, calendar)
│   │   ├── vendor-search/    # Search and filter components
│   │   ├── ai/               # AI chatbot and recommendation UI
│   │   ├── chat/             # Real-time chat components
│   │   ├── auth/             # Auth modals and wrappers
│   │   └── ui/               # Base UI primitives (Radix UI, shadcn-style)
│   │
│   ├── contexts/
│   │   ├── VisitorAuthContext.tsx  # Visitor authentication state
│   │   ├── VendorAuthContext.tsx   # Vendor authentication state
│   │   └── ThemeContext.tsx        # Dark/light mode state
│   │
│   ├── graphql/
│   │   ├── queries.ts        # All GraphQL queries
│   │   └── mutations.ts      # All GraphQL mutations
│   │
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility functions (validation, error handling)
│   ├── models/               # Client-side data models
│   ├── sanity/               # Sanity CMS client and schema types
│   ├── styles/               # Global styles
│   └── types/                # TypeScript type definitions
│
└── test/                     # Unit and component tests
    └── header.test.jsx       # Header routing tests
```

---

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 20.x LTS | Required |
| npm | 10.x | Bundled with Node.js |

The frontend also requires the **backend to be running** at `http://localhost:4000` for API and GraphQL calls. See [`../backend/README.md`](../backend/README.md) for backend setup.

---

## Local Setup

**1. Navigate to the frontend directory**

```bash
cd frontend
```

**2. Install dependencies**

```bash
npm install
```

**3. Copy the environment variable template**

```bash
cp .env.example .env
```

**4. Fill in your values** — see [Environment Variables](#environment-variables) below.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values. All variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend REST API base URL | Yes |
| `NEXT_PUBLIC_GRAPHQL_URL` | GraphQL endpoint | Yes |
| `NEXT_PUBLIC_BACKEND_URL` | Backend base URL (used for WebSocket) | Yes |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes |
| `NEXT_PUBLIC_BLOG_API_URL` | Blog API URL | Optional |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project ID | Optional (blog only) |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity dataset name | Optional (blog only) |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Sanity API version (e.g. `2024-03-01`) | Optional (blog only) |

For local development, the minimum required `.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

> **Security:** `.env` and `.env.local` are listed in `.gitignore` and must never be committed.

---

## Running the Application

```bash
# Development server with hot reload (recommended)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> Make sure the backend is running at `http://localhost:4000` before starting the frontend.

```bash
# Lint the codebase
npm run lint

# Type check only (without building)
npx tsc --noEmit
```

> **Note:** `next.config.mjs` has `typescript.ignoreBuildErrors: true` set intentionally so TypeScript errors do not block the build. Use `npx tsc --noEmit` to check types manually.

---

## Key Routes

| Route | Description | Auth Required |
|---|---|---|
| `/` | Homepage | No |
| `/vendors` | Vendor browse and listings | No |
| `/vendor-search` | Filtered vendor search | No |
| `/vendors/[id]` | Individual vendor profile | No |
| `/blog` | Blog listing (Sanity CMS) | No |
| `/login` | Visitor login | No |
| `/sign-up` | Visitor registration | No |
| `/vendor-login` | Vendor login | No |
| `/vendor-signup` | Vendor registration | No |
| `/visitor-dashboard` | Couple planning dashboard | Visitor |
| `/visitor-profile` | Visitor profile management | Visitor |
| `/guest-list` | Guest list manager | Visitor |
| `/vendor-dashboard` | Vendor management portal | Vendor |
| `/vendor-onboarding` | Vendor setup wizard | Vendor |
| `/about` | About page | No |
| `/contact` | Contact page | No |
| `/help` | Help center | No |

---

## Testing

Tests are in the `test/` directory. The test suite uses **Jest** and **React Testing Library** with a `jsdom` environment.

```bash
# Run all tests (exits 0 even with no tests — safe for CI)
npm test

# Watch mode (reruns on file changes)
npm test -- --watch

# Generate a coverage report
npm test -- --coverage
```

### Current Test Coverage

| File | Tests | Description |
|---|---|---|
| `test/header.test.jsx` | 4 cases | Authentication routing: visitor, vendor, unauthenticated, and visitor-over-vendor precedence |

The Jest configuration is in `jest.config.js`. Path aliases (`@/`) are resolved via `moduleNameMapper`.

To run the header authentication routing tests directly:

```bash
npm test -- --runInBand test/header.test.jsx
```

The current result is 4 passing tests.

### Writing New Tests

Place new test files in `test/` with a `.test.ts` or `.test.jsx` extension. Import components using the `@/` alias (e.g. `@/components/shared/Footer`).

```tsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

---

## Code Quality

```bash
# Run ESLint
npm run lint

# Format with Prettier (if configured)
npx prettier --write "src/**/*.{ts,tsx}"
```

ESLint is configured in `.eslintrc.json` using the Next.js core-web-vitals ruleset.
