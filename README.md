# Mosi-oa-Tunya AI

> **"Making money move across Africa as freely as water flows over Victoria Falls."**

Africa's AI-powered cross-border financial operating system. Send money home, automate family finances, save, invest, and interact with your personal AI financial agent — all through natural language.

---

## Quick start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app runs in **demo mode** without credentials — every screen is fully explorable with rich sample data.

> **Demo mode** is controlled by `NEXT_PUBLIC_DEMO_MODE` (defaults to `true`).
> In demo mode Stellar settlement, mobile-money payouts and FX are simulated
> with realistic behaviour, so the architecture is production-shaped and real
> APIs drop in by adding credentials and setting `NEXT_PUBLIC_DEMO_MODE=false`.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 15 (App Router)                 │
│  Landing · Auth · Dashboard · AI Chat · 12 Module Screens   │
├─────────────────────────────────────────────────────────────┤
│  API Routes          │  Services                            │
│  /api/ai/chat        │  ai-agent · stellar · payments       │
│                      │  exchange                            │
├─────────────────────────────────────────────────────────────┤
│  Supabase            │  External Integrations               │
│  Auth · PostgreSQL   │  OpenAI · Stellar · Flutterwave      │
│  RLS · Realtime      │  PayChangu · Airtel · MTN · Zamtel   │
└─────────────────────────────────────────────────────────────┘
```

### Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS v4, Framer Motion, Recharts |
| Backend | Supabase (Auth, PostgreSQL, Edge Functions) |
| AI | OpenAI GPT-4o, LangChain, agent memory |
| Blockchain | Stellar SDK (stablecoin settlement) |
| Payments | Airtel Money, MTN MoMo, Zamtel Kwacha, Flutterwave, PayChangu |
| Deploy | Vercel + Supabase |

---

## Project structure

```
src/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── (auth)/                  # Login, signup, onboarding
│   ├── (app)/                   # Authenticated app shell
│   │   ├── dashboard/           # Financial dashboard
│   │   ├── ai/                  # Mosi AI agent (primary)
│   │   ├── transfer/            # Cross-border remittance
│   │   ├── wallet/              # Multi-currency wallets
│   │   ├── savings/             # Savings goals
│   │   ├── investments/         # Investment hub
│   │   ├── family/              # Family support center
│   │   ├── school-fees/         # School fees hub
│   │   ├── bills/               # Bill payments
│   │   ├── automations/         # Smart automations
│   │   ├── business/            # Business payroll portal
│   │   ├── admin/               # Admin & compliance portal
│   │   └── settings/            # Security & preferences
│   └── api/ai/chat/             # AI agent endpoint
├── components/
│   ├── brand/                   # Logo, design tokens
│   ├── ui/                      # Button, Card, Input, Badge…
│   ├── layout/                  # AppShell, PageHeader
│   ├── landing/                 # Marketing sections
│   ├── dashboard/               # Charts
│   └── ai/                      # Chat interface
└── lib/
    ├── services/                # Stellar, payments, exchange, AI
    ├── supabase/                # Client & server helpers
    ├── types.ts                 # Domain types
    ├── demo-data.ts             # Demo dataset
    └── config.ts                # Runtime config

supabase/
├── migrations/
│   ├── 0001_init.sql          # Full schema (20+ tables)
│   └── 0002_rls.sql           # Row-level security
└── seed.sql                     # Reference data
```

---

## Database schema

20+ PostgreSQL tables with full relationships:

| Domain | Tables |
|--------|--------|
| Users | `profiles`, `kyc_documents`, `devices` |
| Money | `wallets`, `transactions`, `exchange_rates` |
| Family | `beneficiaries` |
| Automation | `automations`, `exchange_alerts` |
| Savings | `savings_goals` |
| Investments | `investment_products`, `investments` |
| Education | `schools`, `school_fees` |
| Bills | `bills` |
| Business | `organizations`, `employees`, `payroll_runs` |
| AI | `ai_conversations`, `ai_messages`, `ai_memories` |
| System | `notifications`, `audit_logs`, `risk_flags` |

Apply migrations:

```bash
# Via Supabase CLI
supabase db push

# Or paste supabase/migrations/*.sql into the SQL editor
```

---

## AI agent

The Mosi agent (`src/lib/services/ai-agent.ts`) is the platform's primary interface:

- **Demo mode** (no API key): pattern-matched responses for 6+ financial intents
- **Live mode** (with `OPENAI_API_KEY`): LangChain + GPT-4o with user context, memories, and financial data

Capabilities: transfers, automations, savings planning, rate monitoring, school fees, bill payments, investment guidance, affordability analysis.

### AI tool layer & action cards

The agent never moves money on its own. Each financial intent maps to a typed
tool (`src/lib/ai/tools.ts`) that produces a **structured action card** — a
transaction preview the chat UI renders with a confirmation button. Only after
the user confirms does the UI call the execution endpoint.

| Tool | Purpose | Confirmation |
|------|---------|--------------|
| `create_transfer` | Prepare a cross-border transfer | Required |
| `create_automation` | Recurring / conditional rule | Required |
| `set_rate_alert` | FX alert + optional auto-convert | Required |
| `create_savings_goal` | New goal with forecast | Required |
| `estimate_fee` | Fee + recipient amount | Informational |
| `summarize_spending` | Spend/sent summary | Informational |
| `explain_transaction` | Explain a transaction | Informational |

Tool arguments are validated with Zod schemas, ready to bind as LangChain
structured tools in live mode.

### Settlement engine

`src/lib/services/settlement.ts` runs a transfer through an auditable state
machine — `pending → confirmed → processing → paid_out` (or `failed`) — wrapping
the Stellar and payout-rail services. The `/api/transfer` route executes it and
returns the full step timeline + mock Stellar tx hash, which the chat action
card renders as a live tracker.

---

## Stellar settlement

Cross-border value moves as stablecoin over Stellar:

```
Sender fiat → anchor deposit → USDC → Stellar payment → recipient anchor → mobile money
```

Configure in `.env.local`:

```
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_DISTRIBUTION_SECRET=your_secret_key
STELLAR_SETTLEMENT_ASSET_CODE=USDC
STELLAR_SETTLEMENT_ASSET_ISSUER=issuer_public_key
```

Without secrets, settlement runs in simulation mode.

---

## Payment rails

Each provider implements a common `RailAdapter` interface in `src/lib/services/payments.ts`:

| Provider | Type | Currencies |
|----------|------|-----------|
| Airtel Money | Mobile money | ZMW, KES, TZS |
| MTN Mobile Money | Mobile money | ZMW, ZAR |
| Zamtel Kwacha | Mobile money | ZMW |
| Flutterwave | Aggregator | All 6 |
| PayChangu | Aggregator | ZMW, USD |

---

## Security

- **MFA & biometrics** — TOTP + device biometrics on sensitive actions
- **Row-level security** — every table scoped to `auth.uid()`
- **Encryption** — AES-256 at rest, TLS 1.3 in transit
- **KYC/AML** — document verification + continuous monitoring via `risk_flags`
- **Audit trail** — every action logged in `audit_logs`
- **Security headers** — configured in `vercel.json`

---

## Deployment

### Vercel

```bash
vercel --prod
```

Set environment variables in the Vercel dashboard (see `.env.example`).

### Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations from `supabase/migrations/`
3. Run seed data from `supabase/seed.sql`
4. Copy URL + anon key to Vercel env vars

---

## Environment variables

See [`.env.example`](.env.example) for the full list. Minimum for demo mode: none required. For production:

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Privileged operations |
| `OPENAI_API_KEY` | AI | Live agent responses |
| `STELLAR_DISTRIBUTION_SECRET` | Settlement | Stellar payouts |
| Payment provider keys | Payouts | Mobile money delivery |

---

## Brand

| Token | Value |
|-------|-------|
| Midnight Blue | `#071A35` |
| Gold | `#D4AF37` |
| Cyan Accent | `#00D4FF` |
| Success Green | `#22C55E` |

Fonts: **Sora** (display) + **Manrope** (body).

---

## License

Proprietary — Mosi-oa-Tunya AI. For demonstration purposes. Not a licensed financial institution.
