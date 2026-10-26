# Say I Do — Backend

The NestJS 10 API server for [Say I Do](https://sayido.lk) — Sri Lanka's wedding directory and planning platform. Exposes a **GraphQL API** and **REST endpoints**, backed by PostgreSQL (TypeORM) and MongoDB (Mongoose), with real-time WebSocket support via Socket.io.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Modules](#modules)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Code Quality](#code-quality)

---

## Overview

The backend is a **NestJS 10** application structured around feature modules. It serves:

- A **GraphQL API** (Apollo Server) for vendor/visitor data, services, packages, reviews, recommendations, and planning tools
- **REST endpoints** for file uploads (AWS S3), PayHere payment webhooks, and auth callbacks
- A **WebSocket gateway** (Socket.io) for real-time chat between couples and vendors

### Key Design Decisions

- **Dual database:** PostgreSQL via TypeORM handles all relational data; MongoDB via Mongoose handles chat messages (document model suits high-volume, append-only chat history)
- **Global validation:** All incoming payloads are validated with `class-validator`, sanitized with a custom `SanitizePayloadInterceptor`, and transformed via NestJS `ValidationPipe`
- **Rate limiting:** Upload endpoints are throttled via `@nestjs/throttler`
- **AI:** OpenAI generates service embeddings stored in PostgreSQL with `pgvector`; Groq generates review summaries and vendor ranking explanations

---

## Tech Stack

| Technology | Purpose |
|---|---|
| NestJS 10 | Framework (modules, providers, guards, interceptors) |
| TypeScript 5 | Static typing |
| Apollo Server 4 | GraphQL server |
| TypeORM 0.3 | PostgreSQL ORM and entity management |
| Mongoose 8 | MongoDB ODM (chat messages) |
| Passport.js | Authentication strategies (JWT, Local, Google OAuth) |
| bcryptjs | Password hashing |
| Nodemailer | OTP and notification emails |
| Multer + AWS S3 SDK | File upload handling |
| OpenAI SDK | Vector embeddings and AI chatbot |
| Groq API | Review summaries and vendor recommendations |
| Socket.io | WebSocket gateway for real-time chat |
| PayHere | Sri Lankan payment gateway integration |
| sanitize-html | HTML sanitisation for user-submitted content |
| class-validator | DTO validation |
| Jest | Unit and integration test runner |

---

## Project Structure

```
backend/
├── src/
│   ├── main.ts                   # Application bootstrap, CORS, global pipes and interceptors
│   ├── app.module.ts             # Root module — imports all feature modules and DB connections
│   │
│   ├── modules/                  # Feature modules (one folder per domain)
│   │   ├── auth/                 # JWT, Google OAuth, local strategy, guards
│   │   ├── vendor/               # Vendor CRUD (GraphQL)
│   │   ├── visitor/              # Visitor/couple CRUD (GraphQL)
│   │   ├── service/              # Vendor service listings (GraphQL)
│   │   ├── package/              # Service packages (GraphQL)
│   │   ├── package-approval/     # Admin package approval workflow
│   │   ├── review/               # Review creation and retrieval (GraphQL)
│   │   ├── recommendation/       # AI-powered vendor recommendations (Groq)
│   │   ├── chat/                 # Real-time chat (MongoDB + Socket.io)
│   │   ├── guestlist/            # Guest list management (GraphQL)
│   │   ├── budget/               # Budget tool and budget items (GraphQL)
│   │   ├── checklist/            # Wedding checklist (GraphQL)
│   │   ├── myVendors/            # Visitor's saved vendors (GraphQL)
│   │   ├── upload/               # AWS S3 file upload (REST)
│   │   ├── payhere/              # PayHere payment gateway (REST)
│   │   ├── payment/              # Payment records (GraphQL)
│   │   ├── mail/                 # Email sending (Nodemailer, OTP)
│   │   └── ai/                   # OpenAI chatbot, vector search, embeddings
│   │
│   ├── database/
│   │   ├── entities/             # TypeORM entities (PostgreSQL schema)
│   │   └── run-migration.ts      # Migration runner script
│   │
│   ├── graphql/
│   │   ├── inputs/               # GraphQL input types (DTOs)
│   │   └── types/                # GraphQL object types
│   │
│   ├── common/
│   │   └── interceptors/         # SanitizePayloadInterceptor (global)
│   │
│   ├── utils/                    # Shared utility functions
│   └── scripts/                  # One-off scripts
│       ├── generate-schema.ts    # Generate GraphQL schema file
│       ├── generate-embeddings.ts# Seed OpenAI embeddings into pgvector
│       └── migrate-chat-service-ids.ts
│
└── test/
    ├── unit/                     # Mocked unit tests — no database required
    │   ├── vendor.service.spec.ts
    │   ├── visitor.services.spec.ts
    │   ├── review.service.spec.ts
    │   ├── guestlist.service.spec.ts
    │   ├── mail.service.spec.ts
    │   ├── offering.service.spec.ts
    │   └── recommendation.service.spec.ts
    └── integration/              # Live database integration tests
        ├── vendor.service.spec.ts
        ├── visitor.service.spec.ts
        └── offering.service.spec.ts
```

---

## Modules

| Module | Protocol | Description |
|---|---|---|
| `auth` | REST + GraphQL | JWT issue/refresh, Google OAuth, OTP |
| `vendor` | GraphQL | Vendor registration, profile, CRUD |
| `visitor` | GraphQL | Visitor registration, profile, CRUD |
| `service` | GraphQL | Vendor service listings |
| `package` | GraphQL | Service packages and pricing |
| `package-approval` | GraphQL | Admin approval workflow for packages |
| `review` | GraphQL | Client reviews and AI-generated summaries |
| `recommendation` | GraphQL | Groq-powered vendor recommendations |
| `chat` | WebSocket | Real-time messaging (MongoDB-backed) |
| `guestlist` | GraphQL | Wedding guest list management |
| `budget` | GraphQL | Budget planner and itemised expenses |
| `checklist` | GraphQL | Wedding task checklist |
| `myVendors` | GraphQL | Visitor-saved vendor lists |
| `upload` | REST | Multipart file upload to AWS S3 |
| `payhere` | REST | Payment initiation and webhook notify |
| `payment` | GraphQL | Payment records |
| `mail` | Internal | Nodemailer email (OTP, notifications) |
| `ai` | GraphQL + Internal | Chatbot (OpenAI), vector search, embeddings |

---

## Prerequisites

| Tool | Minimum Version | Purpose |
|---|---|---|
| Node.js | 20.x LTS | Runtime |
| npm | 10.x | Package management |
| PostgreSQL | 14+ | Primary database |
| MongoDB | 6+ | Chat message storage |

External service accounts required:

| Service | Used For | Required |
|---|---|---|
| AWS S3 | Media and portfolio image uploads | Yes |
| Google OAuth | Social sign-in (vendor and visitor) | Yes |
| OpenAI | Vector embeddings, AI chatbot | Yes |
| Groq | Review summaries, vendor ranking | Yes |
| SMTP (Gmail App Password) | OTP and notification emails | Yes |
| PayHere | Payments (sandbox mode available) | Yes |

---

## Local Setup

**1. Navigate to the backend directory**

```bash
cd backend
```

**2. Install dependencies**

```bash
npm install
```

**3. Copy the environment variable template**

```bash
cp .env.example .env
```

**4. Create the PostgreSQL database**

```bash
psql -U postgres -c "CREATE DATABASE sayido;"
```

**5. Fill in your `.env` values** — see [Environment Variables](#environment-variables) below.

**6. Start the backend**

```bash
npm run start:dev
```

---

## Environment Variables

Copy `.env.example` to `.env`. The full list of variables is documented with descriptions in [`backend/.env.example`](./.env.example).

### Minimum required for local development

```env
# PostgreSQL
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/sayido
TYPEORM_SYNC=true

# MongoDB
MONGODB_URI=mongodb://localhost:27017/sayido-chat

# Server
PORT=4000
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:3000

# Auth
JWT_SECRET=your_secure_random_jwt_secret_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_web_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Groq
GROQ_API_KEY=your_groq_api_key
```

### Variable Groups

| Group | Key Variables | Notes |
|---|---|---|
| **Database** | `DATABASE_URL`, `TYPEORM_SYNC`, `DB_SSL` | Set `TYPEORM_SYNC=true` for local dev; use migrations in production |
| **MongoDB** | `MONGODB_URI` | Used only by the chat module |
| **Server** | `PORT`, `HOST`, `CORS_ORIGIN`, `FRONTEND_URL` | CORS allows localhost and LAN by default |
| **Auth / Cookies** | `COOKIE_SECURE`, `COOKIE_SAMESITE`, `COOKIE_DOMAIN` | Set `COOKIE_SECURE=false` for local HTTP |
| **AWS S3** | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_REGION`, `AWS_S3_BUCKET_NAME` | Required for file uploads |
| **AI** | `OPENAI_API_KEY`, `GROQ_API_KEY`, `GROQ_*` | Required for recommendation and review features |
| **Email** | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | OTPs are logged to terminal when `SMTP_PASS` is blank |
| **Payments** | `PAYHERE_MERCHANT_ID`, `PAYHERE_MERCHANT_SECRET`, `PAYHERE_SANDBOX` | Set `PAYHERE_SANDBOX=true` for testing |

> **Security:** `.env` is listed in `.gitignore` and must never be committed.

---

## Running the Application

```bash
# Development — watch mode (auto-restarts on file changes)
npm run start:dev

# Development — standard (no watch)
npm run start

# Debug mode
npm run start:debug

# Production (requires a prior build)
npm run build
npm run start:prod
```

Once running:

| Endpoint | URL |
|---|---|
| REST API base | http://localhost:4000 |
| GraphQL Playground | http://localhost:4000/graphql |

### One-off Scripts

> ⚠️ Only run these scripts if you know what they do — some modify the database.

```bash
# Generate the GraphQL schema file (dist/graphql/schema.gql)
npm run generate-schema

# Seed OpenAI vector embeddings into PostgreSQL (pgvector)
npm run generate-embeddings

# Run database migrations
npm run migration:run
```

---

## API Reference

### GraphQL

The GraphQL Playground is available at `http://localhost:4000/graphql` when running locally.

All GraphQL operations are code-first, auto-generated from NestJS decorators into `dist/graphql/schema.gql`.

**Example query — list all vendors:**
```graphql
query {
  findAllVendors {
    id
    fname
    lname
    busname
    city
    service {
      id
      category
    }
  }
}
```

### REST Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| `POST` | `/auth/login` | Visitor email/password login | No |
| `POST` | `/auth/vendor-login` | Vendor email/password login | No |
| `POST` | `/auth/google` | Google OAuth token exchange | No |
| `POST` | `/auth/logout` | Clear auth cookie | Yes |
| `POST` | `/upload` | Upload file to AWS S3 | Yes |
| `POST` | `/api/payhere/notify` | PayHere payment webhook | No (HMAC verified) |

### WebSocket

The chat gateway listens on the same port as the HTTP server (Socket.io).

| Event | Direction | Description |
|---|---|---|
| `join_room` | Client → Server | Join a chat room by vendor/visitor pair |
| `send_message` | Client → Server | Send a chat message |
| `receive_message` | Server → Client | Broadcast new message to room |

---

## Testing

### Unit Tests — Safe, No Database Required

All external dependencies (TypeORM, Mongoose, Nodemailer, AWS S3) are mocked. These tests are safe to run at any time.

```bash
# Run all unit tests
npm test -- --testPathPattern=test/unit

# Watch mode
npm run test:watch -- --testPathPattern=test/unit

# Coverage report
npm run test:cov
```

**Current unit test coverage:**

| File | Service Tested | Cases |
|---|---|---|
| `test/unit/vendor.service.spec.ts` | `VendorService` | CRUD, password change, duplicate email |
| `test/unit/visitor.services.spec.ts` | `VisitorService` | CRUD, auth |
| `test/unit/review.service.spec.ts` | `ReviewService` | Creation, retrieval |
| `test/unit/guestlist.service.spec.ts` | `GuestListService` | List management |
| `test/unit/mail.service.spec.ts` | `MailService` | OTP sending (mocked SMTP) |
| `test/unit/offering.service.spec.ts` | `ServiceOfferingService` | Service CRUD |
| `test/unit/recommendation.service.spec.ts` | `RecommendationService` | AI recommendation logic |

### Integration Tests — Requires Running Databases

Integration tests connect to real PostgreSQL and MongoDB instances.

> ⚠️ **Ensure `backend/.env` is configured and both databases are running before executing these.**

```bash
npm run test:integration
```

**Integration test files:**

| File | Tests |
|---|---|
| `test/integration/vendor.service.spec.ts` | Vendor CRUD against live DB |
| `test/integration/visitor.service.spec.ts` | Visitor CRUD against live DB |
| `test/integration/offering.service.spec.ts` | Service offering CRUD against live DB |

---

## Code Quality

```bash
# Run ESLint (with auto-fix)
npm run lint

# Format with Prettier
npm run format
```

ESLint is configured in `.eslintrc.js` using `@typescript-eslint` and `eslint-plugin-prettier`. Prettier config is in `.prettierrc`.
