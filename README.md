# Say I Do
 
**Sri Lanka's wedding directory and planning platform.**
 
Say I Do is a full-stack, multi-vendor platform that helps couples discover, compare, and book verified wedding vendors while managing every part of their wedding in one place. Vendors get the tools to showcase their services, manage bookings, and get paid in LKR.
 
[Live Site](https://sayido.lk) · [Preview Deployment](https://sayido-eta.vercel.app) · [Repository](https://github.com/hirushan666/wedding-directory)
 
---
 
## Table of Contents
 
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Running the Application](#running-the-application)
- [Testing](#testing)
- [Project Links](#project-links)
- [Contributing](#contributing)
- [Acknowledgements](#acknowledgements)
---
 
## Features
 
### For Couples
 
| Feature | Description |
|---|---|
| **Vendor Search** | Filter vendors by service category, city, and availability |
| **Booking & Reservations** | Request and confirm vendor packages |
| **Real-time Chat** | Message vendors directly on the platform |
| **Budget Planner** | Track wedding expenses and payments |
| **Wedding Checklist** | Categorised tasks with progress tracking |
| **Guest List Manager** | Manage invitations and RSVPs |
| **My Vendors** | Save and organise shortlisted vendors |
| **AI Recommendations** | Personalised vendor suggestions powered by Groq |
| **Visitor Dashboard** | A unified planning hub |
 
### For Vendors
 
| Feature | Description |
|---|---|
| **Vendor Profiles** | Showcase services, packages, portfolio, and location |
| **Package Management** | Create and manage tiered service packages |
| **Portfolio Gallery** | Upload and manage service images (AWS S3) |
| **Reviews** | Collect client reviews with AI-generated summaries |
| **Bookings Calendar** | View and manage all reservation requests |
| **Payments** | PayHere integration for LKR transactions (sandbox supported) |
| **Analytics** | Track service views and engagement |
| **Real-time Chat** | Communicate directly with couples |
 
### Platform
 
- **Authentication:** JWT and Google OAuth for both vendor and visitor flows
- **Blog:** Content managed through Sanity CMS
- **Maps:** Leaflet-based location picker and search
- **Dark Mode:** Theme toggle across all dashboard views
---
 
## Tech Stack
 
| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion |
| **Backend** | NestJS 10, TypeScript, GraphQL (Apollo Server), REST |
| **Primary Database** | PostgreSQL via TypeORM, with pgvector |
| **Secondary Database** | MongoDB via Mongoose (chat messages) |
| **Authentication** | JWT, Passport.js, Google OAuth 2.0 |
| **File Storage** | AWS S3 |
| **Payments** | PayHere |
| **AI / ML** | OpenAI (embeddings, chatbot), Groq (review summaries, vendor ranking) |
| **CMS** | Sanity |
| **Maps** | Leaflet / React-Leaflet, Google Maps API |
| **Real-time** | Socket.io |
| **Testing** | Jest, React Testing Library, NestJS Testing Module |
 
---
 
## Architecture
 
The repository is a monorepo containing three applications:
 
```
wedding-directory/
├── frontend/             # Next.js application (port 3000)
│   ├── src/
│   │   ├── app/          # Pages and layouts (App Router)
│   │   ├── components/   # Reusable UI components
│   │   ├── contexts/     # React context providers (auth, theme)
│   │   ├── graphql/      # GraphQL queries and mutations
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility libraries
│   │   └── types/        # TypeScript type definitions
│   └── test/             # Unit tests (Jest + RTL)
│
├── backend/              # NestJS API server (port 4000)
│   ├── src/
│   │   ├── modules/      # Feature modules (vendor, visitor, auth, chat, ai, ...)
│   │   ├── database/     # TypeORM entities and migrations
│   │   ├── graphql/      # GraphQL inputs and types
│   │   ├── common/       # Interceptors, guards, shared utilities
│   │   └── scripts/      # One-off scripts (schema generation, embeddings, migrations)
│   └── test/
│       ├── unit/         # Mocked unit tests (no database required)
│       └── integration/  # Tests requiring a live database
│
└── studio-say-i-do/      # Sanity Studio for blog content
```
 
---
 
## Getting Started
 
### Prerequisites
 
| Tool | Minimum Version | Purpose |
|---|---|---|
| Node.js | 20.x LTS | Frontend and backend runtime |
| npm | 10.x | Package management (bundled with Node.js) |
| PostgreSQL | 14+ | Primary database |
| MongoDB | 6+ | Chat service |
| Git | Any recent version | Cloning the repository |
 
You will also need accounts or API keys for the following services:
 
| Service | Used For | Required |
|---|---|---|
| AWS S3 | Media and image uploads | Yes |
| Google OAuth | Social login | Yes |
| OpenAI | Chatbot and vector embeddings | Yes |
| Groq | Review summaries and vendor recommendations | Yes |
| PayHere | Payments (sandbox mode available) | Yes |
| Sanity | Blog CMS | Optional for local development |
 
### Installation
 
**1. Clone the repository**
 
```bash
git clone https://github.com/hirushan666/wedding-directory.git
cd wedding-directory
```
 
**2. Install the backend**
 
```bash
cd backend
npm install
cp .env.example .env
```
 
**3. Install the frontend**
 
```bash
cd ../frontend
npm install
cp .env.example .env
```
 
**4. Install Sanity Studio (optional)**
 
```bash
cd ../studio-say-i-do
npm install
```
 
The studio requires a Sanity project ID, configured in `studio-say-i-do/sanity.config.ts`.
 
### Configuration
 
Each application ships with a documented `.env.example` listing every variable it needs.
 
| File | Covers |
|---|---|
| [`backend/.env.example`](./backend/.env.example) | Database, auth, AWS, AI, SMTP, payments, CORS |
| [`frontend/.env.example`](./frontend/.env.example) | API endpoints, Google OAuth, Sanity CMS |
 
At a minimum, configure the following.
 
**`backend/.env`**
 
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/sayido
MONGODB_URI=mongodb://localhost:27017/sayido-chat
PORT=4000
JWT_SECRET=your_secret_key_here
```
 
**`frontend/.env`**
 
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```
 
> **Security:** Never commit `.env` files. Both are listed in `.gitignore`.
 
### Running the Application
 
Start each service in its own terminal:
 
```bash
# Terminal 1: Backend
cd backend
npm run start:dev
```
 
```bash
# Terminal 2: Frontend
cd frontend
npm run dev
```
 
```bash
# Terminal 3: Sanity Studio (optional)
cd studio-say-i-do
npm run dev
```
 
| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| GraphQL Playground | http://localhost:4000/graphql |
| Sanity Studio | http://localhost:3333 |
 
---
 
## Testing
 
### Frontend
 
```bash
cd frontend
 
npm test                       # Run all unit tests
npm test -- --watch            # Watch mode
npm test -- --coverage         # Coverage report
```
 
### Backend: Unit Tests
 
All external dependencies (database, email, S3) are mocked, so no database is required.
 
```bash
cd backend
 
npm test -- --testPathPattern=test/unit   # Run unit tests
npm run test:cov                          # Coverage report
```
 
### Backend: Integration Tests
 
Integration tests connect to a real database. Make sure PostgreSQL and MongoDB are running and `backend/.env` is configured first.
 
```bash
cd backend
npm run test:integration
```
 
---
 
## Project Links
 
| Resource | URL |
|---|---|
| Production Site | https://sayido.lk |
| Vercel Preview | https://sayido-eta.vercel.app |
 
---