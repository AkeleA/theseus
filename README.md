# **Theseus --- URL Shortener**

Theseus is a minimal, high-performance URL shortener built with **Next.js App Router**, **Postgres**, and **Upstash Redis**, designed for edge-cached 301 redirects and long-term cache semantics.

It is built to be small, auditable, extremely fast, and easy to deploy on Vercel.

---

## **Features**

- Fast 301 redirects served from the Edge runtime

- Redis-accelerated lookups with 1-year cache TTL

- Postgres for durable canonical storage

- Custom alias support (optional)

- Strong input validation (Zod)

- Rate limiting per IP

- Vitest test suite covering backend, edge routes, and UI

- Brutalist UI with QR-code generation

- Fully compatible with Vercel deployment

---

## **Architecture Overview**

`api/shorten (Node runtime) → Postgres
               │
               ▼
      [code] route (Edge runtime)
               │
               ▼
             Redis
               │
               ▼
           301 redirect    `

Flow:

1.  Client sends long URL (optional alias).

2.  `POST /api/shorten` validates input and writes to Postgres.

3.  Redirect route `/[code]` first checks Redis.

4.  If cache miss → fallback to DB → warm Redis.

5.  Response includes `301` + `Cache-Control: max-age=31536000`.

---

## **Technology Choices**

**Next.js App Router** -- combines Node and Edge runtimes cleanly.\
**Postgres** -- structured, durable URL storage.\
**Upstash Redis** -- extremely low-latency lookups.\
**Prisma** -- schema-first DB layer with type safety.\
**Vitest** -- fast test runner used for API and UI tests.\
**Zod** -- robust runtime validation.

---

## **Getting Started**

### 1\. Clone the repository

`git clone https://github.com/<your-user>/theseus.git
cd theseus`

### 2\. Install dependencies

`npm install`

### 3\. Create `.env.local`

`DATABASE_URL="postgresql://..."
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="your-token"
BASE_URL="http://localhost:3000"`

### 4\. Initialize Prisma

`npx prisma generate
npx prisma migrate dev`

### 5\. Start development server

`npm run dev`

Application will be available at:

`http://localhost:3000`

---

## **Database Schema (Prisma)**

`model Url {
  code      String   @id
  long_url  String
  createdAt DateTime @default(now())
}`

---

## **Running Tests**

Tests use Vitest and include mocks for Redis, fetch, DB writes, and Next.js route handlers.

To run the suite:

`npx vitest`

Includes tests for:

- Base62 generator

- Rate limiter

- Shorten API

- Redirect handler

- Admin invalidation

- UI smoke tests

---

## **Deployment on Vercel**

### 1\. Push the repository:

`git add .
git commit -m "Initial Theseus deployment"
git push origin main`

### 2\. Import project on Vercel

Go to:

`https://vercel.com/new`

Select your GitHub repository.

### 3\. Set environment variables

`DATABASE_URL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
BASE_URL=https://your-domain.com`

### 4\. Runtimes

Theseus uses correct runtime declarations:

` /api/shorten
export const runtime = "nodejs";

// /[code]
export const runtime = "edge";`

No further settings required.

---

## **Production Behavior**

- Redirects are served at the edge for low latency.

- Redis stores hot entries for fast resolution.

- Postgres is only used when a cache miss occurs.

- Alias collision returns `409 Conflict`.

- Random codes retry automatically on conflict.

- 301 redirects contain 1-year cache TTL.

---

## **Roadmap**

- Click analytics (geo, device, referrer)

- Expiring links

- Password-protected links

- QR download button

- Admin dashboard

- Link collections

- Edge KV mode
