# Architecture — Mosi-oa-Tunya AI

> _"Making money move across Africa as freely as water flows over Victoria Falls."_

Mosi-oa-Tunya AI is a **conversational financial operating system** for the
African diaspora. The product is built around an AI agent (**Mosi**) that turns
natural-language intent into confirmable financial actions. Traditional banking
screens exist as a secondary layer for power users, businesses and compliance.

This document describes the system **as implemented**, and flags items that are
**planned** where relevant.

---

## 1. Technology stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | **Next.js 15.1.3** (App Router) | RSC + Server Actions + Route Handlers |
| UI runtime | **React 19**, **TypeScript 5.7** | Strict mode |
| Styling | **Tailwind CSS v4**, design tokens in `globals.css` | Dark-first, glassmorphism |
| Animation | **Framer Motion** | Reveal, hero flow, action cards |
| Charts | **Recharts** | Dashboard analytics |
| Auth + DB | **Supabase** (`@supabase/ssr`, `@supabase/supabase-js`) | Postgres + Auth + RLS + Storage |
| AI | **OpenAI** (GPT-4o) via **LangChain** (`@langchain/openai`) | Live mode; scripted demo fallback |
| Blockchain | **Stellar SDK** (`@stellar/stellar-sdk`) | Stablecoin settlement |
| Validation | **Zod** | Tool args + API payloads |
| Hosting | **Vercel** + **Supabase** | Region `iad1` (`vercel.json`) |

**Fonts:** Sora (display) + Manrope (body), loaded via `next/font`.

---

## 2. System overview

```
                         ┌──────────────────────────┐
                         │   User (mobile-first web) │
                         └────────────┬──────────────┘
                                      │ HTTPS
                         ┌────────────▼──────────────┐
                         │   Next.js 15 (Vercel)      │
                         │   RSC · Route Handlers     │
                         │   middleware (session)     │
                         └───┬───────────┬────────┬───┘
                             │           │        │
              ┌──────────────▼──┐  ┌─────▼─────┐  ┌▼───────────────┐
              │ Supabase        │  │ OpenAI +  │  │ Stellar Horizon│
              │ Auth · Postgres │  │ LangChain │  │ (testnet/pub)  │
              │ RLS · Storage   │  │ (GPT-4o)  │  └────────────────┘
              └─────────────────┘  └───────────┘
                             │
                  ┌──────────▼───────────┐
                  │  Settlement Engine   │   src/lib/services/settlement.ts
                  │  pending→…→paid_out  │
                  └──────────┬───────────┘
                             │ RailAdapter interface
        ┌────────────┬───────┴───────┬─────────────┬─────────────┐
   ┌────▼────┐  ┌────▼────┐    ┌──────▼─────┐  ┌────▼─────┐  ┌────▼─────┐
   │ Airtel  │  │  MTN    │    │  Zamtel    │  │Flutterw. │  │ PayChangu│
   │ Money   │  │  MoMo   │    │  Kwacha    │  │          │  │          │
   └─────────┘  └─────────┘    └────────────┘  └──────────┘  └──────────┘
```

All external integrations (Stellar, mobile money, FX) run in **simulation** when
credentials are absent — see [§8 Demo mode](#8-demo-mode).

---

## 3. Application structure

Route groups under `src/app` separate concerns and layouts:

```
src/app/
├── (marketing)/            # Public site — shared nav + footer layout
│   ├── about/  how-it-works/  pricing/  security/  contact/
│   └── layout.tsx
├── page.tsx                # Landing page (hero, AI preview, modules…)
├── (auth)/                 # Brand split-screen layout
│   ├── login/  signup/  forgot-password/
│   ├── role-selection/  mfa-setup/  onboarding/
│   └── layout.tsx
├── (app)/                  # Authenticated shell (sidebar + top bar)
│   ├── dashboard/  ai/  transfer/  wallet/  savings/
│   ├── investments/  family/  school-fees/  bills/
│   ├── automations/  business/  admin/  settings/
│   └── layout.tsx
├── api/
│   ├── ai/chat/route.ts    # AI agent conversation
│   └── transfer/route.ts   # Confirmed transfer → settlement engine
├── layout.tsx              # Root: fonts, metadata, theme
└── globals.css             # Design tokens + utilities
```

### Library layer (`src/lib`)

```
lib/
├── ai/
│   └── tools.ts            # Tool schemas (Zod) + ActionCard builders
├── services/
│   ├── ai-agent.ts         # Mosi agent: demo + live (LangChain/GPT-4o)
│   ├── settlement.ts       # Cross-border settlement state machine
│   ├── stellar.ts          # Stellar payments (real or simulated)
│   ├── payments.ts         # RailAdapter per mobile-money / aggregator
│   └── exchange.ts         # FX rates + transfer quoting
├── supabase/
│   ├── client.ts           # Browser client
│   └── server.ts           # Server client (cookies) + service client
├── config.ts               # env + feature flags (isDemoMode, isAiConfigured…)
├── brand.ts                # Brand constants, currencies, providers, roles
├── types.ts                # Domain types mirroring the DB schema
├── demo-data.ts            # Rich in-memory dataset for demo mode
└── utils.ts                # cn(), money/date formatting, helpers
```

---

## 4. AI agent architecture

The agent is the heart of the product. It **never moves money on its own** — it
proposes a structured, confirmable preview and waits for explicit user action.

```
User message  →  POST /api/ai/chat
      │
      ▼
┌──────────────────────────────────────────────┐
│ Context assembly (route + agent)              │
│ • Profile, preferred currency                 │
│ • ai_memories (long-term facts)               │
│ • Recent transactions, goals, automations     │
│ • Conversation history (short-term)           │
└───────────────┬──────────────────────────────┘
                ▼
┌──────────────────────────────────────────────┐
│ runAgent()  src/lib/services/ai-agent.ts      │
│  • Demo mode  → intent match + heuristics      │
│  • Live mode  → LangChain ChatOpenAI (GPT-4o)  │
└───────────────┬──────────────────────────────┘
                ▼
┌──────────────────────────────────────────────┐
│ AgentResponse                                 │
│  • message                                    │
│  • actionCard?  (structured, confirmable)      │
│  • suggestedActions[]                          │
│  • memoriesExtracted[]                         │
└───────────────┬──────────────────────────────┘
                ▼
┌──────────────────────────────────────────────┐
│ Chat UI renders ActionCard                    │
│  • Transaction preview (fields, FX, fees)      │
│  • Confirm → calls executeEndpoint             │
│  • Live settlement tracker on success          │
└──────────────────────────────────────────────┘
```

### Tool layer (`src/lib/ai/tools.ts`)

Each financial intent maps to a **typed tool** with a Zod argument schema and an
**action-card builder**. Tool descriptors are exported for binding as LangChain
structured tools in live mode.

| Tool | Purpose | Confirmation |
|------|---------|--------------|
| `create_transfer` | Prepare a cross-border transfer | **Required** |
| `create_automation` | Recurring / conditional rule | **Required** |
| `set_rate_alert` | FX alert + optional auto-convert | **Required** |
| `create_savings_goal` | New goal with forecast | **Required** |
| `estimate_fee` | Fee + recipient amount | Informational |
| `summarize_spending` | Spend / sent summary | Informational |
| `explain_transaction` | Explain a transaction's status | Informational |

An `ActionCard` carries `requiresConfirmation`, the labelled preview `fields`, a
validated `payload`, and the `executeEndpoint` the UI calls on confirm. This
**propose → confirm → execute** separation is the core safety guarantee.

### Memory model

- **Short-term:** conversation history (last _N_ messages) sent with each turn.
- **Long-term:** `ai_memories` keyed by `(user_id, key)` with categories
  (`family`, `income`, `preferences`, `goals`) and an `importance` score.

---

## 5. Cross-border settlement

`src/lib/services/settlement.ts` runs every transfer through an **auditable
state machine**. The `/api/transfer` route validates the confirmed payload (Zod)
and invokes it; the response includes a step-by-step timeline the chat action
card renders as a live tracker.

```
 pending  ──▶  confirmed  ──▶  processing  ──▶  paid_out
   │              │               │               │
 created      sender wallet    stablecoin      recipient
             debited (USD)   settled on       credited via
                              Stellar (USDC)   payout rail
                                  │
                                  └──▶  failed  (any step → reversal)
```

1. **Quote** — `exchange.quoteTransfer()` computes rate, 0.5% fee, recipient amount.
2. **pending** — transaction recorded, awaiting confirmation.
3. **confirmed** — sender wallet debited.
4. **processing** — `stellar.sendPayment()` settles stablecoin (real or mock hash).
5. **paid_out** — `payments.executePayout()` credits the recipient via the rail.
6. **failed** — any failed step short-circuits with a recorded reason.

### Payment rails

All providers implement a common `RailAdapter` interface
(`src/lib/services/payments.ts`), so the engine routes payouts without knowing
provider specifics. Each adapter falls back to simulation when its API key is
absent.

| Provider | Type | Currencies |
|----------|------|-----------|
| Airtel Money | Mobile money | ZMW, KES, TZS |
| MTN MoMo | Mobile money | ZMW, ZAR |
| Zamtel Kwacha | Mobile money | ZMW |
| Flutterwave | Aggregator | All 6 |
| PayChangu | Aggregator | ZMW, USD |

**Why Stellar:** sub-second finality, ~$0.00001 fees, native multi-asset support,
and an established anchor network across Africa.

---

## 6. Data model

PostgreSQL schema lives in `supabase/migrations`:

| Migration | Contents |
|-----------|----------|
| `0001_init.sql` | Enums, all core tables, triggers, `handle_new_user()` bootstrap |
| `0002_rls.sql` | Row-level security, `is_admin()`, owner policies |
| `0003_helpers_and_payments.sql` | `is_business_user()`, `owns_profile()`, `log_audit_event()`, `bill_payments`, audit triggers, spec-named views |

**Domain tables (20+):** `profiles`, `kyc_documents`, `wallets`,
`beneficiaries`, `exchange_rates`, `transactions`, `automations`,
`exchange_alerts`, `savings_goals`, `investment_products`, `investments`,
`schools`, `school_fees`, `bills`, `bill_payments`, `organizations`,
`employees`, `payroll_runs`, `ai_conversations`, `ai_messages`, `ai_memories`,
`notifications`, `devices`, `audit_logs`, `risk_flags`.

**Bootstrap:** a Postgres trigger on `auth.users` creates a `profiles` row and a
primary ZMW wallet for every new user.

`src/lib/types.ts` mirrors these tables as TypeScript types used across the UI.

---

## 7. Security & compliance

| Layer | Implementation |
|-------|---------------|
| Authentication | Supabase Auth (email, OAuth-ready); MFA setup flow in `(auth)/mfa-setup` |
| Session | `middleware.ts` refreshes the Supabase session cookie and guards `(app)` routes |
| Authorization | PostgreSQL **RLS** on every user table; `is_admin()` / `is_business_user()` helpers |
| Ownership | `owns_profile()` helper; owner-scoped policies via `user_id = auth.uid()` |
| Encryption | TLS 1.3 in transit, AES-256 at rest (Supabase managed) |
| Secrets | Server-only env vars; Stellar distribution secret never reaches the client |
| Confirmation | AI proposes, user disposes — no transaction executes without confirmation |
| KYC | `kyc_documents` upload → admin review queue → `kyc_status` on `profiles` |
| AML | `risk_flags` table (severity + resolution) surfaced to the admin portal |
| Audit | `audit_logs` + `log_audit_event()` + automatic transaction-change trigger |
| Headers | `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` (`vercel.json`) |
| Input validation | Zod on tool args and API payloads |

**Roles & access**

| Role | Access |
|------|--------|
| `diaspora` | Full personal finance (default) |
| `recipient` | Receive-only + identity verification |
| `business` | Organizations, employees, payroll |
| `admin` | KYC review, risk flags, monitoring, audit logs |

---

## 8. Demo mode

Controlled by `NEXT_PUBLIC_DEMO_MODE` (defaults to `true`; see `lib/config.ts`).
When on — or whenever Supabase isn't configured — the app is fully explorable:

- **Data:** rich in-memory dataset (`lib/demo-data.ts`) powers every screen.
- **AI:** scripted, intent-matched responses with real action cards (no API key).
- **Stellar:** simulated payments return realistic mock transaction hashes.
- **Payouts / FX:** rail adapters and exchange rates simulate provider behaviour.

The architecture is **production-shaped**: switching to live providers is a
matter of supplying credentials and setting `NEXT_PUBLIC_DEMO_MODE=false`. A
`Demo` badge renders in the app shell whenever simulation is active.

---

## 9. Feature flags & configuration

`src/lib/config.ts` centralises environment detection:

| Flag | Meaning |
|------|---------|
| `isSupabaseConfigured` | Supabase URL + anon key present |
| `isAiConfigured` | `OPENAI_API_KEY` present → live LangChain mode |
| `isDemoMode` | `NEXT_PUBLIC_DEMO_MODE !== "false"` _or_ no Supabase |

See `.env.example` for the full variable list (Supabase, OpenAI, Stellar, and the
five payment providers).

---

## 10. API surface

**Implemented**

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/ai/chat` | POST | Mosi agent conversation → `AgentResponse` (+ action card) |
| `/api/transfer` | POST | Execute a confirmed transfer via the settlement engine |

**Planned expansion**

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/automations` | CRUD | Persist automations & rate alerts |
| `/api/savings` | POST | Create/contribute to savings goals |
| `/api/transfers/[id]` | GET | Poll transfer status |
| `/api/exchange/rates` | GET | Live FX rates with cache |
| `/api/webhooks/{flutterwave,paychangu}` | POST | Payment provider callbacks |

> The AI action cards already reference `executeEndpoint`s (e.g. `/api/automations`,
> `/api/savings`) so wiring these routes is additive — the UI contract exists.

---

## 11. Scaling considerations

- **Frontend:** Vercel edge caching for static assets; ISR for marketing pages.
- **Database:** Supabase connection pooling (PgBouncer); read replicas at scale.
- **AI:** per-user rate limiting; conversation summarisation for long threads;
  cache embeddings/memories.
- **Settlement:** move to queue-based processing (Supabase Edge Functions or a
  durable queue) for high throughput and idempotent retries.
- **FX rates:** Redis/Upstash cache with a short TTL backing the
  `exchange_rates` table.
- **Observability:** structured logs around the settlement state machine and
  the `audit_logs` trail for traceability.

---

## 12. Request lifecycle (example)

_"Send K5,000 to my mother every month"_

1. Chat UI → `POST /api/ai/chat`.
2. Route assembles context; `runAgent()` recognises a recurring-support intent.
3. Agent returns a `create_automation` **ActionCard** (`requiresConfirmation: true`).
4. UI renders the preview (beneficiary, amount, schedule, rail).
5. User taps **Activate automation** → UI calls the card's `executeEndpoint`.
6. (Transfers) the settlement engine runs `pending → … → paid_out`, returning a
   reference + Stellar hash; the card animates the live tracker.
7. Memories (`mother_name`, `monthly_support`) are extracted for future context.

---

_Mosi-oa-Tunya AI — "The Smoke That Thunders." For demonstration purposes; not a
licensed financial institution._
