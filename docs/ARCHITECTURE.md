# Architecture and Environment Guide

This document describes the system design of **Say I Do**, a wedding directory
and planning platform. It is intended as a concise reference for evaluation,
local setup, and deployment.

## 1. System overview

Say I Do is a monorepo with three independently runnable applications:

```text
Browser / mobile client
        |
        | HTTPS, cookies, REST, GraphQL, Socket.io
        v
frontend/ (Next.js App Router, port 3000)
        |
        | HTTP API and GraphQL requests
        v
backend/ (NestJS, port 4000)
   |             |              |
   |             |              +--> External services
   |             |                   (Google, AWS S3, PayHere, SMTP,
   |             |                    OpenAI, Groq)
   |             |
   |             +--> MongoDB
   |                  Chat messages and realtime chat data
   |
   +--> PostgreSQL
        Core transactional data through TypeORM

studio-say-i-do/ (Sanity Studio)
        |
        +--> Sanity project/dataset for blog content
```

The frontend is the user-facing application. The backend owns authentication,
business rules, persistence, integrations, and realtime communication. The
Sanity Studio is a separate content-management application used to edit blog
content consumed by the frontend.

## 2. Repository and deployment boundaries

| Application | Responsibility | Local command | Default port |
|---|---|---|---:|
| `frontend/` | Web UI, dashboards, client state, GraphQL queries, API calls | `npm run dev` | 3000 |
| `backend/` | REST/GraphQL API, authentication, domain modules, integrations | `npm run start:dev` | 4000 |
| `studio-say-i-do/` | Sanity content authoring interface | `npm run dev` | Sanity CLI default |

The frontend and backend can be deployed independently. The frontend build
must receive its `NEXT_PUBLIC_*` values at build time. The backend receives
private configuration at runtime and should be deployed separately from the
frontend.

## 3. Backend architecture

The backend is a NestJS application composed of feature modules. `AppModule`
registers the global configuration, PostgreSQL/TypeORM, MongoDB, GraphQL, and
the feature modules.

### Transport layer

- **REST:** Nest controllers expose authentication, uploads, payments, and
  other request/response endpoints.
- **GraphQL:** Apollo Server uses an automatically generated schema for
  structured domain queries and mutations.
- **WebSocket:** Socket.io powers realtime chat through the chat gateway.
- **Cookies and JWT:** Authentication endpoints issue role-specific JWT
  cookies. Passport guards and JWT strategies protect authenticated routes.

### Feature layer

The main backend modules include:

- Authentication for visitor and vendor login, registration, Google OAuth,
  password reset, OTP verification, and onboarding.
- Visitor and vendor profile management.
- Services, packages, bookings, package approvals, reviews, and payments.
- Budgeting, checklist, guest list, and saved-vendor planning tools.
- File uploads to S3.
- Realtime chat backed by MongoDB.
- AI chatbot, embeddings, recommendations, and review summaries.
- Email delivery for OTPs and transactional notifications.

### Persistence

- **PostgreSQL:** relational application data such as users, vendors,
  services, packages, reviews, bookings, payments, budgets, checklists, and
  guest lists.
- **MongoDB:** chat messages and realtime conversation data.
- **S3:** uploaded media and service images.
- **Sanity:** blog and editorial content.

TypeORM entities are auto-loaded by the backend. `TYPEORM_SYNC` controls schema
synchronization; production deployments should use migrations or a reviewed
schema process rather than enabling destructive synchronization.

## 4. Frontend architecture

The frontend uses the Next.js App Router:

- `src/app/` contains routes, layouts, and page-level composition.
- `src/components/` contains reusable UI and dashboard components.
- `src/contexts/` provides visitor authentication, vendor authentication, and
  theme state.
- `src/graphql/` contains GraphQL queries and mutations.
- `src/api/` and `src/utils/` contain HTTP integrations and shared helpers.
- `src/hooks/` contains client-side hooks such as the chat socket hook.
- `test/` contains Jest and React Testing Library tests.

The root layout composes the authentication providers, Apollo client, theme
provider, Google authentication provider, notifications, and shared UI
behaviors. Browser-visible configuration is intentionally limited to variables
prefixed with `NEXT_PUBLIC_`; secrets must remain in the backend.

## 5. Representative data flows

### Visitor or vendor login

1. The client submits credentials to the role-specific auth endpoint.
2. Passport's local strategy asks `AuthService` to validate the email and
   password against PostgreSQL.
3. `AuthService` signs a role-specific JWT.
4. The controller writes the token to the appropriate cookie and clears the
   opposite role's cookie.
5. Protected requests use the JWT guard and the corresponding role context.

### Vendor discovery and booking

1. The frontend requests vendor/service data through GraphQL or REST.
2. NestJS resolvers/controllers invoke the relevant domain service.
3. TypeORM reads or writes PostgreSQL entities.
4. Booking and approval events can trigger email notifications and payment
   workflows.
5. The frontend refreshes its cached data and dashboard state.

### Realtime chat

1. An authenticated client opens a Socket.io connection to the backend.
2. The chat gateway validates the connection and routes conversation events.
3. Messages are persisted in MongoDB.
4. Connected participants receive the event without polling the API.

### Media upload

1. An authenticated client sends an upload request to the backend.
2. Upload validation and rate limiting run in the NestJS upload module.
3. The backend stores the object in S3 and returns the usable media reference.
4. Domain records retain the reference rather than the binary content.

## 6. Cross-cutting concerns

- **Validation:** Nest's global `ValidationPipe` transforms and whitelists
  request DTOs.
- **Sanitization:** A global payload interceptor removes unsafe control
  characters before application processing.
- **CORS:** The backend allows configured origins and approved local,
  deployment, and platform domains.
- **Rate limiting:** Upload endpoints use configurable TTL and request limits.
- **Configuration:** Environment variables are loaded by the backend's global
  `ConfigModule`; Next.js variables are supplied during frontend builds.
- **Testing:** Backend unit tests mock domain dependencies; integration tests
  exercise database-backed behavior. Frontend tests use Jest and React
  Testing Library.

## 7. Environment variable guide

Copy the example files before running locally:

```text
backend/.env.example  -> backend/.env
frontend/.env.example -> frontend/.env
```

Never commit either `.env` file. Values below are names and purposes only;
production secrets must be supplied by the deployment platform's secret
manager.

### 7.1 Backend: database and server

| Variable | Purpose | Example/local value |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://user:password@localhost:5432/sayido?schema=public` |
| `DB_SSL` | Enables PostgreSQL SSL unless explicitly `false` | `false` locally, `true` in managed production |
| `TYPEORM_SYNC` | Enables TypeORM schema synchronization | `true` only for disposable local development |
| `MONGODB_URI` | MongoDB connection URL for chat data | `mongodb://localhost:27017/sayido-chat` |
| `HOST` | Backend bind address | `0.0.0.0` |
| `PORT` | Backend HTTP/WebSocket port | `4000` |
| `CORS_ORIGIN` | Comma-separated additional allowed origins | `http://localhost:3000` |
| `FRONTEND_URL` | Canonical frontend URL used by integrations | `http://localhost:3000` |
| `BACKEND_URL` | Canonical backend URL used by integrations | `http://localhost:4000` |

### 7.2 Backend: authentication and cookies

| Variable | Purpose | Deployment guidance |
|---|---|---|
| `JWT_SECRET` | Secret used to sign authentication tokens | Required; use a long random secret |
| `GOOGLE_CLIENT_ID` | Google web OAuth client ID | Backend OAuth audience validation |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Keep private |
| `GOOGLE_ANDROID_CLIENT_ID` | Android OAuth audience | Optional when mobile login is enabled |
| `GOOGLE_IOS_CLIENT_ID` | iOS OAuth audience | Optional when mobile login is enabled |
| `COOKIE_SECURE` | Marks auth cookies as HTTPS-only | `false` locally, `true` in HTTPS production |
| `COOKIE_SAMESITE` | Requested SameSite policy | Usually `lax`; cross-site deployments may use `none` with secure cookies |
| `COOKIE_DOMAIN` | Cookie domain | Omit or use the shared production domain; do not use `localhost` for LAN access |

### 7.3 Backend: storage, payments, and messaging

| Variable | Purpose |
|---|---|
| `AWS_ACCESS_KEY_ID` | AWS access key for S3 |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for S3 |
| `AWS_S3_REGION` | S3 bucket region |
| `AWS_S3_BUCKET_NAME` | S3 bucket for uploaded media |
| `PAYHERE_MERCHANT_ID` | PayHere merchant identifier |
| `PAYHERE_MERCHANT_SECRET` | PayHere signing secret |
| `PAYHERE_SANDBOX` | Uses PayHere sandbox when `true` |
| `PAYHERE_CURRENCY` | Payment currency, normally `LKR` |
| `PAYHERE_NOTIFY_URL` | Public PayHere notification callback |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP server port |
| `SMTP_SECURE` | Enables secure SMTP transport |
| `SMTP_USER` | SMTP account |
| `SMTP_PASS` | SMTP password or app password |
| `SMTP_FROM` | Sender displayed in outgoing mail |
| `SMTP_REPLY_TO` | Reply-to address |
| `ADMIN_EMAIL` | Address for administrative notifications |
| `UPLOAD_RATE_TTL` | Upload rate-limit window in milliseconds |
| `UPLOAD_RATE_LIMIT` | Upload requests allowed per window and IP |

### 7.4 Backend: AI services

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | Chatbot and embedding access |
| `GROQ_API_KEY` | Review summaries and recommendation ranking |
| `GROQ_REVIEW_SUMMARY_ENDPOINT` | OpenAI-compatible Groq endpoint for review summaries |
| `GROQ_REVIEW_SUMMARY_MODEL` | Model used for review summaries |
| `GROQ_RECOMMENDER_ENDPOINT` | Groq endpoint for recommendations |
| `GROQ_RECOMMENDER_MODEL` | Model used for vendor recommendations |

### 7.5 Frontend: public build-time configuration

These values are exposed to browser code and must not contain secrets.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL for REST requests |
| `NEXT_PUBLIC_GRAPHQL_URL` | Apollo GraphQL endpoint |
| `NEXT_PUBLIC_BACKEND_URL` | Backend URL used by realtime/client integrations |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Browser Google OAuth client ID |
| `NEXT_PUBLIC_BLOG_API_URL` | Blog/content API base URL |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project identifier |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity dataset, normally `production` |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Sanity API version |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL used for metadata |

## 8. Deployment checklist

1. Provision PostgreSQL, MongoDB, S3, and the required external service
   accounts.
2. Set backend secrets in the hosting provider; do not place secrets in the
   frontend environment or source control.
3. Set `DATABASE_URL`, `MONGODB_URI`, `JWT_SECRET`, and production URLs.
4. Set `DB_SSL=true`, `COOKIE_SECURE=true`, and an appropriate cookie policy
   when serving over HTTPS.
5. Set `TYPEORM_SYNC=false` in production and apply the reviewed database
   schema/migrations.
6. Configure `CORS_ORIGIN`, OAuth callback origins, PayHere notification URL,
   and SMTP sender details for the deployed domains.
7. Provide all required `NEXT_PUBLIC_*` values before running the frontend
   build.
8. Restrict S3 permissions to the required bucket operations and keep the
   bucket policy appropriate for the intended media access model.
9. Run backend unit tests and frontend tests in CI before deployment.
10. Verify health, login for both roles, GraphQL access, upload behavior,
    payment callbacks, email delivery, and realtime chat after deployment.

## 9. Security notes

- Treat `JWT_SECRET`, database URLs, OAuth secrets, AWS keys, PayHere secrets,
  SMTP passwords, and AI API keys as confidential.
- `NEXT_PUBLIC_*` variables are not secrets because they are embedded into the
  browser bundle.
- Use HTTPS in production so authentication cookies and credentials are
  protected in transit.
- Keep production database synchronization disabled and back up persistent
  PostgreSQL and MongoDB data.
- Rotate credentials if they are exposed, and review deployment logs for
  accidentally printed secrets.
