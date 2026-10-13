# Thikana (ঠিকানা) — Smart Rental Property Platform

> **A modern, bilingual (Bangla & English) rental property discovery and management platform crafted for Bangladesh, featuring explainable rule-based matching, structured landlord workflows, and an editorial motion design system.**

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
  - [Tenant Experience](#tenant-experience)
  - [Landlord Workflows](#landlord-workflows)
  - [Administrative Governance](#administrative-governance)
  - [Design & Motion System](#design--motion-system)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Prerequisites](#prerequisites)
- [Quick Start Guide](#quick-start-guide)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Frontend Setup](#2-frontend-setup)
  - [3. Backend Setup (Optional / Full Stack)](#3-backend-setup-optional--full-stack)
- [Demo Credentials](#demo-credentials)
- [Project Directory Structure](#project-directory-structure)
- [Bilingual Localization (i18n)](#bilingual-localization-i18n)
- [Motion Design & Interaction System](#motion-design--interaction-system)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)
- [Academic & Project Documentation](#academic--project-documentation)
- [License](#license)

---

## Overview

In Bangladesh, rental housing discovery is traditionally fragmented across informal physical signs ("To-Let" boards), unstructured social media groups, and unverified intermediaries. This friction leads to hidden brokerage fees, unconfirmed availability, and a lack of standardized listing information.

**Thikana (ঠিকানা)** solves this by providing a unified, reliable rental ecosystem centered on Khulna and expanding nationwide. It combines verified listing workflows, an explainable rule-based tenant-property matching engine, side-by-side multi-property comparison, and an accessible, responsive user interface inspired by contemporary editorial design.

---

## Key Features

### Tenant Experience
- **Structured Multi-Filter Search:** Filter properties by division, district, thana (e.g., Sonadanga, Boyra, Khalishpur, KUET area), monthly rent range, bedrooms, bathrooms, bachelor/family eligibility, and furnished status.
- **Explainable Match Scoring:** Tenants define their housing preferences (preferred locations, budget range, required amenities); Thikana computes a transparent percentage match with detailed factor breakdowns.
- **3-Way Property Comparison:** Compare up to three properties side-by-side across 14 distinct criteria (rent, advance deposit, utility policies, floor size, bachelor rules, pet policies, etc.).
- **Favorites & Watchlist:** One-click bookmarking of listings with instant synchronization.
- **Direct Landlord Contact & Inquiry:** Submit structured contact requests without intermediary broker fees.
- **Visit Scheduling:** Request on-site property walkthroughs with date/time pickers and status tracking (Pending $\to$ Confirmed $\to$ Completed $\to$ Cancelled).
- **Ratings & Reviews:** Submit post-visit feedback with verified visitor badges.

### Landlord Workflows
- **Guided Listing Creation:** Step-by-step form capturing property type, location hierarchy, pricing terms, utility inclusions, and house rules.
- **5-Image Uploader with Featured Selection:** Upload up to five photos with drag-and-drop or file pickers; the first photo is automatically badged and designated as the primary featured card visual.
- **Availability & Status Controls:** Instantly toggle listings between Active, Rented, and Hidden.
- **Inquiry & Visit Management:** Review incoming tenant messages, respond to inquiries, and approve/reschedule visit requests.

### Administrative Governance
- **Listing Moderation Queue:** Review pending landlord submissions, inspect metadata and uploaded images, and approve or reject with feedback.
- **Simulated Verification Engine:** Conduct property and ownership verifications with visual badge attribution.
- **User Management & Moderation:** Monitor tenant and landlord activity; toggle user account status between Active and Suspended.
- **Immutable Audit Trail:** Review automated system logs recording status transitions, user moderation actions, and administrative overrides.

### Design & Motion System
- **Editorial Aesthetic:** Reconstructed from high-end Framer benchmarks (`furnitureone.framer.ai`), utilizing warm, curated color palettes, generous whitespace, and modern typography.
- **Motion Primitives:** Native, zero-dependency entrance animations (`MotionReveal`), typography line-masking reveals (`TextReveal`), and inset clip-path transitions (`ImageMaskReveal`).
- **Tactile Hover Dynamics:** Fluid card lift (`--ease-lift: cubic-bezier(0.2, 0.7, 0.2, 1)`) with subtle shadow depth changes.
- **Accessible & Reduced Motion Aware:** Automatically respects `prefers-reduced-motion: reduce` by bypassing transforms and rendering instantaneous transitions.

---

## Tech Stack

### Frontend
- **Framework:** [TanStack Start](https://tanstack.com/start) (Full-stack React 19 meta-framework with Nitro SSR)
- **Routing:** [TanStack Router](https://tanstack.com/router) (Fully type-safe, file-based routing)
- **Data Fetching:** [TanStack Query v5](https://tanstack.com/query) (Declarative server state management and caching)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) with custom `@utility` tokens and CSS variables
- **UI Primitives:** [Radix UI](https://www.radix-ui.com/) accessible headless components
- **Icons:** [Lucide React](https://lucide.dev/)
- **Forms & Validation:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Localization:** [i18next](https://www.i18next.com/) + [react-i18next](https://react.i18next.com/)
- **Testing:** [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/) + JSDOM

### Backend (Full-Stack Engine)
- **Framework:** [Laravel 13](https://laravel.com/) (PHP 8.3+)
- **Adapter / API:** Inertia.js with React starter & RESTful endpoints
- **Quality & Static Analysis:** [Larastan](https://github.com/larastan/larastan) (PHPStan), [Laravel Pint](https://laravel.com/docs/pint)
- **Testing:** [Pest PHP](https://pestphp.com/) / PHPUnit
- **Database:** SQLite (default for development/testing), PostgreSQL / MySQL ready

---

## System Architecture

```
                                  ┌────────────────────────┐
                                  │      Client Browser    │
                                  └───────────┬────────────┘
                                              │ HTTP / SSR
                                              ▼
                                  ┌────────────────────────┐
                                  │  TanStack Start App    │
                                  │   (Vite 8 + Nitro)     │
                                  └───────────┬────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
          ┌────────────────────────┐                     ┌────────────────────────┐
          │     AppShell / UI      │                     │    Abstracted API      │
          │  (React 19 + Radix)    │                     │   (src/lib/api/client) │
          └────────────────────────┘                     └───────────┬────────────┘
                                                                     │
                                             ┌───────────────────────┴───────────────────────┐
                                             ▼                                               ▼
                                 ┌────────────────────────┐                     ┌────────────────────────┐
                                 │   Mock Data Adapter    │                     │     Laravel Backend    │
                                 │  (Zero-latency local)  │                     │  (PHP 8.3+ / Artisan)  │
                                 └────────────────────────┘                     └───────────┬────────────┘
                                                                                            │
                                                                                            ▼
                                                                                ┌────────────────────────┐
                                                                                │     Database Layer     │
                                                                                │ (SQLite / PostgreSQL)  │
                                                                                └────────────────────────┘
```

---

## Prerequisites

Ensure your development machine has the following tools installed:

- **Node.js**: `v20.x` or higher (LTS recommended)
- **npm**: `v10.x` or higher (or `pnpm` / `bun`)
- **PHP**: `8.3` or higher *(only required if running the Laravel backend)*
- **Composer**: `2.x` *(only required if running the Laravel backend)*
- **Git**: Installed and configured

---

## Quick Start Guide

### 1. Clone Repository

```bash
git clone https://github.com/AqibJawwad2607/Thikana.git
cd Thikana
```

### 2. Frontend Setup

The frontend operates independently with a complete mock API adapter, allowing immediate end-to-end testing of all tenant, landlord, and administrative workflows without needing a live backend database.

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Open your browser at **`http://localhost:3000`** (or the port indicated in your terminal).

To run validation checks on the frontend:
```bash
# Run TypeScript type check
npx tsc --noEmit

# Run unit and integration tests (71 tests across 7 test suites)
npm test -- --run

# Run production build
npm run build
```

### 3. Backend Setup (Optional / Full Stack)

To run the complementary Laravel API server:

```bash
# Navigate to backend
cd ../backend

# Install PHP dependencies
composer install

# Install node dependencies for assets
npm install

# Copy environment configuration
cp .env.example .env

# Generate application encryption key
php artisan key:generate

# Run database migrations and seed default records
php artisan migrate --seed

# Start the Laravel development server
php artisan serve
```

The backend server will run at **`http://localhost:8000`**.

---

## Demo Credentials

The seeded environment includes preconfigured test accounts across all three platform roles:

| Role | Email Identifier | Phone Identifier | Password | Access Rights |
| :--- | :--- | :--- | :--- | :--- |
| **Tenant** | `tenant@thikana.com` | `01711111111` | `password123` | Search, compare, favorite, message, request visits |
| **Landlord** | `landlord@thikana.com` | `01811111111` | `password123` | Create & manage listings, manage 5 photos, view inquiries |
| **Administrator** | `admin@thikana.com` | `01911111111` | `password123` | Approve listings, simulated verification, audit logs, user management |

---

## Project Directory Structure

```
Thikana/
├── frontend/                     # TanStack Start / React 19 Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/            # Auth forms & verification cards
│   │   │   ├── layout/          # AppShell, Navbar, Footer, Breadcrumbs
│   │   │   ├── motion/          # MotionReveal, TextReveal, ImageMaskReveal
│   │   │   ├── property/        # PropertyCard, ImageGallery, Filters, ComparisonTable
│   │   │   └── ui/              # Radix-based accessible UI primitives
│   │   ├── hooks/               # useInView, useDebounce, custom hooks
│   │   ├── lib/
│   │   │   ├── api/             # API client contracts and mock adapter
│   │   │   ├── i18n.ts          # i18next configuration
│   │   │   └── utils.ts         # Utility helpers (cn, formatBDT, formatArea)
│   │   ├── locales/             # Bilingual translations (bn.json, en.json)
│   │   ├── routes/              # TanStack file-based routes
│   │   │   ├── index.tsx        # Editorial 9-section landing page
│   │   │   ├── auth/            # Login, Register, Forgot Password
│   │   │   ├── properties/      # Search catalog & property detail pages
│   │   │   ├── tenant/          # Tenant dashboard, favorites, visits, preferences
│   │   │   ├── landlord/        # Landlord listing management & inquiry inbox
│   │   │   └── admin/           # Administrative moderation & audit log views
│   │   ├── styles.css           # Tailwind CSS v4 variables & @utility tokens
│   │   └── test/                # Vitest test suite (71 tests)
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                      # Laravel 13 PHP Backend
│   ├── app/                     # Controllers, Models, Policies, Requests
│   ├── config/                  # Framework & package configurations
│   ├── database/                # SQLite/MySQL migrations, factories, seeders
│   ├── routes/                  # Web, API, and console routes
│   ├── tests/                   # Pest / PHPUnit test suites
│   ├── composer.json
│   └── artisan
│
├── All Documents/                # Complete Academic & Engineering Documentation
│   ├── AI.md                    # Core operational specifications
│   ├── DOCUMENTATION-MANIFEST.md# Documentation inventory & index
│   └── docs/                    # 15 detailed engineering guidelines (PRD, Spec, Security)
│
└── README.md                     # This file
```

---

## Bilingual Localization (i18n)

Thikana is built **bilingual-first**, supporting both **Bangla (বাংলা)** and **English (EN)**:

- **Default Locale:** Bangla (`bn`).
- **Engine:** Configured in [`src/lib/i18n.ts`](file:///d:/Thikana/frontend/src/lib/i18n.ts) via `i18next` and `react-i18next`.
- **Locale Files:**
  - Bangla translations: [`src/locales/bn.json`](file:///d:/Thikana/frontend/src/locales/bn.json)
  - English translations: [`src/locales/en.json`](file:///d:/Thikana/frontend/src/locales/en.json)
- **Script Protection:** Typography masks utilize overflow padding (`pb-1 -mb-1`) in [`TextReveal.tsx`](file:///d:/Thikana/frontend/src/components/motion/TextReveal.tsx) to prevent clipping of complex Bangla conjuncts and vowel signs.
- **Language Switcher:** Interactive navbar toggle persisting user preference across sessions.

---

## Motion Design & Interaction System

The motion system reproduces the tactile, high-end feel of modern digital publications without sacrificing performance:

1. **`MotionReveal` ([MotionReveal.tsx](file:///d:/Thikana/frontend/src/components/motion/MotionReveal.tsx)):**
   - Handles spatial coordinate translation and opacity entry triggers as elements enter the viewport.
   - Timing: `cubic-bezier(0.2, 0.7, 0.2, 1)` with durations from 700ms to 900ms.
2. **`TextReveal` ([TextReveal.tsx](file:///d:/Thikana/frontend/src/components/motion/TextReveal.tsx)):**
   - Line-masking reveal creating an editorial headline entrance effect.
3. **`ImageMaskReveal` ([ImageMaskReveal.tsx](file:///d:/Thikana/frontend/src/components/motion/ImageMaskReveal.tsx)):**
   - Clip-path inset wipe (`cubic-bezier(0.65, 0, 0.2, 1)`) combined with scale settling.
4. **Tactile Hover Dynamics:**
   - Card lift elevation utility defined in [`src/styles.css`](file:///d:/Thikana/frontend/src/styles.css) via `@utility hover-lift`.
5. **Accessibility:**
   - Strict conformance to `@media (prefers-reduced-motion: reduce)`, instantly falling back to 0ms transitions.

---

## Environment Variables

### Frontend (`frontend/`)

The frontend runs with mock data by default and does not require mandatory `.env` keys to run locally. For production or custom backend integration, you may define:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL for remote backend API | `http://localhost:8000/api` |
| `VITE_USE_MOCK_API` | Force mock API adapter (`true` / `false`) | `true` |
| `VITE_DEFAULT_LOCALE` | Default application locale (`bn` / `en`) | `bn` |

### Backend (`backend/.env`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `APP_NAME` | Name of the application | `Thikana` |
| `APP_ENV` | Application environment (`local`, `production`) | `local` |
| `APP_KEY` | Laravel 32-character encryption key | Generated via `php artisan key:generate` |
| `APP_URL` | Base URL of the backend application | `http://localhost:8000` |
| `DB_CONNECTION` | Database driver (`sqlite`, `mysql`, `pgsql`) | `sqlite` |
| `SESSION_DRIVER` | Session storage driver | `database` |
| `QUEUE_CONNECTION` | Queue worker driver | `database` |

---

## Available Scripts

### Frontend Scripts (`cd frontend`)

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server on port 3000 |
| `npm run build` | Builds optimized client bundle and Nitro SSR server |
| `npm run preview` | Previews the production build locally |
| `npm test` | Runs the Vitest test runner across all test suites |
| `npm run test:watch` | Starts Vitest in interactive watch mode |
| `npm run lint` | Runs ESLint to check code quality |
| `npm run format` | Runs Prettier to format source files |
| `npx tsc --noEmit` | Validates TypeScript types across the entire project |

### Backend Scripts (`cd backend`)

| Command | Purpose |
| :--- | :--- |
| `php artisan serve` | Starts the PHP development server |
| `php artisan migrate` | Executes pending database migrations |
| `php artisan db:seed` | Populates database with demo users and listings |
| `php artisan test` | Runs Pest / PHPUnit test suites |
| `vendor/bin/pint` | Runs Laravel Pint code style linter/fixer |

---

## Testing & Quality Assurance

### Frontend Testing (Vitest & React Testing Library)

The test suite validates authentication, role-based protection, property discovery, comparison, landlord image constraints, and admin workflows:

```bash
cd frontend
npm test -- --run
```

**Test Coverage Summary:**
- **`auth-screens.test.tsx`**: 14 tests (Tenant, Landlord, Admin auth; password recovery; validation; role state).
- **`property-discovery.test.tsx`**: 11 tests (Search, price formatting in BDT, verified badge rendering, filtering).
- **`tenant-features.test.tsx`**: 10 tests (14-field comparison table, match score calculator, visit requests, favorites).
- **`landlord-features.test.tsx`**: 11 tests (5-image limit enforcement, auto-featured first image badge, image deletion).
- **`admin-features.test.tsx`**: 14 tests (Moderation queue, user suspension, audit log immutability notice, review approval).
- **`integration-quality.test.tsx`**: 10 tests (Popover toggles, visits, review submission, accessibility).
- **`app-routing.test.tsx`**: 1 test (Root routing).

**Total: 71 / 71 tests passing (100% pass rate).**

---

## Production Deployment

### Frontend (Cloudflare / Nitro / Vercel / Node.js)
TanStack Start builds into a Nitro SSR server that can be targeted to multiple platforms:

```bash
cd frontend
npm run build
```
- The production output is created in `.output/`.
- To deploy on Cloudflare Workers / Pages, Nitro compiles to `.output/server/index.mjs` matching Cloudflare's module worker format.
- To deploy on Node.js or Docker, set Nitro preset: `NITRO_PRESET=node-server npm run build` and run `node .output/server/index.mjs`.

### Backend (Laravel on VPS / Forge / Docker)
1. Run `composer install --no-dev --optimize-autoloader`.
2. Configure `.env` with production database credentials and `APP_ENV=production`.
3. Run `php artisan config:cache && php artisan route:cache && php artisan view:cache`.
4. Run `php artisan migrate --force`.
5. Configure web server (Nginx/Caddy) to point to `backend/public/index.php`.

---

## Troubleshooting

### 1. Port Already in Use (3000 / 8000)
- **Issue:** Vite or Artisan warns that the port is occupied.
- **Solution:** Specify an alternative port:
  - Frontend: `npm run dev -- --port 3001`
  - Backend: `php artisan serve --port 8001`

### 2. Missing Translation Key Warning
- **Issue:** Console warns about missing i18n keys.
- **Solution:** Ensure any newly introduced translation strings are present in both [`src/locales/bn.json`](file:///d:/Thikana/frontend/src/locales/bn.json) and [`src/locales/en.json`](file:///d:/Thikana/frontend/src/locales/en.json).

### 3. Motion or Animations Look Abrupt
- **Issue:** Animations skip straight to completed state.
- **Solution:** Verify if your operating system has "Reduce motion" enabled in Accessibility settings. Thikana strictly adheres to `prefers-reduced-motion`.

### 4. Database File Locked (SQLite)
- **Issue:** `database.sqlite` is locked by another process.
- **Solution:** Ensure no background tinker session or zombie PHP process is holding a lock, or run `php artisan migrate:fresh --seed`.

---

## Academic & Project Documentation

For complete design documents, system requirement specifications, and security audits, refer to the [`All Documents/`](file:///d:/Thikana/All%20Documents) directory:

- **[01-prd.md](file:///d:/Thikana/All%20Documents/docs/01-prd.md)**: Product Requirements Document.
- **[04-spec-driven-development.md](file:///d:/Thikana/All%20Documents/docs/04-spec-driven-development.md)**: Spec-Driven Development Guidelines.
- **[05-ui-ux-design-brief.md](file:///d:/Thikana/All%20Documents/docs/05-ui-ux-design-brief.md)**: UI/UX Design Specifications.
- **[06-implementation-plan.md](file:///d:/Thikana/All%20Documents/docs/06-implementation-plan.md)**: Phased Implementation Roadmap.
- **[09-find-security-gaps.md](file:///d:/Thikana/All%20Documents/docs/09-find-security-gaps.md)**: Security Audit & Threat Modeling.

---

## License

This project is developed for educational and demonstration purposes. All rights reserved.
