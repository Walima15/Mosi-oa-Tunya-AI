# Mosi-oa-Tunya AI

### Africa's First Autonomous Family Finance Agent — Powered by Stellar

> _"Making money move across Africa as freely as water flows over Victoria Falls."_

Mosi-oa-Tunya AI lets Africans in the diaspora **tell an AI what financial outcome they want**, while **Stellar** handles the programmable movement, splitting, saving, conversion and settlement of value across borders. Mobile money (Airtel, MTN, Zamtel, Flutterwave, PayChangu) is used **only for the last-mile payout** — Stellar is the backbone.

**Three Stellar-native layers:**

| Layer | Asset / Tech | Role |
|---|---|---|
| **Network fees** | XLM (native lumens) | Transaction fees & wallet activity |
| **Settlement** | USDC on Stellar | Primary stablecoin for remittances, vaults & family finance |
| **Programmable finance** | Soroban smart contracts | Family Wallet, Goal Vault, Split Payment & Automation contracts |

```
Diaspora user funds account
  → USDC on Stellar (settlement)
  → Soroban contracts (family wallet / goal vault / split / automation)
  → Mobile money payout (last mile only)
```

---

## 1. The problem we solve

Sending money home to Africa is expensive, slow and dumb. People don't want to "send a transfer" — they want to **support a mother, pay school fees, save for a house, and keep an emergency buffer**, every month, reliably. Today that means juggling multiple apps, FX guesswork, and opaque fees.

Mosi turns a single instruction into an organized, on-chain financial plan.

## 2. Why this must be built on Stellar

This is **not** Stellar-as-a-payment-option. Remove Stellar and the product has no core.

| Capability | Why Stellar is required |
|---|---|
| **Low-cost cross-border settlement** | Sub-cent fees make per-family, multi-leg splits economical |
| **Stablecoin movement** | USDC moves value across countries without pre-funded float |
| **Multi-asset support** | One account holds XLM, USDC and tokenized local value |
| **Fast settlement** | 3–5s finality powers a real-time settlement timeline |
| **Memos for financial intent** | `FAMILY_SUPPORT_MOTHER`, `SCHOOL_FEES`, `HOUSE_FUND_DEPOSIT` label every payment on-chain |
| **Path payments for FX** | The order book finds the best USD→local route automatically |
| **Transparent receipts** | Every movement has a verifiable hash + explorer link |
| **Wallet-based family finance** | Family Wallets & Goal Vaults are mapped Stellar accounts |
| **Programmable automations** | "Save 10% of every transfer" executes as a Soroban contract rule |
| **Soroban smart contracts** | Family Wallet, Goal Vault, Split Payment & Automation — real USDC on-chain |

## 3b. Soroban smart contracts

Four Rust/Soroban contracts in `/contracts` move **real USDC** (Stellar Asset Contract token):

| Contract | Key functions |
|---|---|
| **Family Wallet** | `create_family_wallet`, `add_family_member`, `allocate_support`, `release_support_payment`, `emergency_release` |
| **Goal Vault** | `create_goal_vault`, `deposit_to_vault`, `withdraw_from_vault`, `get_vault_progress`, `close_vault` |
| **Split Payment** | `create_split_rule`, `execute_split_payment`, `update_split_percentages`, `get_split_history` |
| **Automation** | `create_rule`, `pause_rule`, `resume_rule`, `execute_rule`, `get_rule_status` |

Frontend integration: `src/lib/stellar/soroban.ts` (`deployContract`, `invokeContract`, `getContractState`, `simulateContractCall`) and `src/lib/stellar/contracts.ts` (typed wrappers). View deployed contracts at **`/smart-contracts`**.

Build: `cd contracts && cargo test && stellar contract build`

## 4. How the AI agent (Mosi) works

- **Propose → Confirm → Execute.** Mosi never moves money on its own. Every money-moving tool returns a confirmable **ActionCard**; the user confirms, then Stellar executes.
- **Stellar-native tools:** `create_stellar_wallet`, `create_family_wallet`, `create_goal_vault`, `create_split_payment`, `create_path_payment`, `create_rate_alert`, `create_stellar_automation`, `explain_stellar_transaction`, `summarize_family_finance`, `generate_financial_plan`.
- Works with OpenAI when configured, and ships with a rich **demo agent** that recognises intents like "take care of my family", "split $300", "build a house", and "convert when ZMW reaches 30".

## 4. Stellar wallets

Every verified user gets a **real Stellar keypair** (generated with the Stellar SDK — even in demo mode). The secret key is **AES-256-GCM encrypted server-side** and never returned to the client. The wallet screen shows the public address, XLM + USDC balances, USDC trustline status, live network status, copy + **Stellar Expert** links, and Friendbot testnet funding.

`src/lib/stellar/` — `client.ts`, `wallet.ts`, `account.ts`, `friendbot.ts`, `payments.ts`, `path-payment.ts`, `receipts.ts`, `explorer.ts`.

## 5. Family Wallets

A shared Stellar financial structure for a diaspora user and their dependents (mother, father, child, school, utility). Each member maps to a **Stellar destination account** and an intent memo. Tables: `family_wallets`, `family_members`, `family_allocations`, `family_wallet_transactions`.

## 6. Goal Vaults

Savings goals upgraded into **Stellar-backed vaults** (house, education, emergency, retirement, school fees). Deposits/withdrawals are Stellar payments tagged with the vault memo; the UI shows balance, progress and a projected completion date.

## 7. Split Payments

One remittance, fanned across many Stellar destinations — e.g. **60% mother, 20% school fees vault, 10% emergency vault, 10% house fund** — each as its own Stellar payment with its own memo and **transaction hash**. The split builder shows live allocation and per-leg receipts.

## 8. FX Optimizer (Stellar path payments)

Set a target ("convert when USD/ZMW reaches 30"); Mosi tracks the rate, simulates the best **strict-send path payment**, shows the route (USD → USDC → ZMW) and estimated recipient amount, and — only with permission — auto-converts.

## 9. Demo script for judges (`/demo`)

1. Open Mosi AI.
2. Type **"Take care of my family's finances this month."**
3. Mosi proposes a plan: K3,000 to Mother · K2,500 school fees · K1,000 emergency vault · 10% to house fund.
4. The plan is a confirmable **ActionCard**.
5. Confirm → **Soroban Split Payment Contract** executes on Stellar: Family Wallet allocation, Goal Vault deposits, USDC settlement, contract event log + Stellar transaction hashes; mobile-money payout shown only as last-mile.
6. Outcomes update: family wallet balance, vault progress, receipts, automation logs.

> The `/demo` page makes the thesis explicit: **"Without Stellar, this product loses its core."**

## 10. Setup

```bash
npm install
cp .env.example .env.local   # optional — demo mode works without any keys
npm run dev                  # http://localhost:3000
```

Demo mode is on by default (`NEXT_PUBLIC_DEMO_MODE=true`). Stellar keypairs are still real; network operations simulate realistic hashes/receipts when credentials are absent, and use Stellar **testnet + Friendbot** when reachable.

To connect a database, set the Supabase variables and run the migrations in `supabase/migrations/` (`0001` → `0004_stellar.sql`).

## 11. Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_DEMO_MODE` | Keep `true` for judge demo |
| `NEXT_PUBLIC_STELLAR_NETWORK` / `NEXT_PUBLIC_SETTLEMENT_ASSET` | Client-safe network/asset labels |
| `STELLAR_NETWORK` / `STELLAR_HORIZON_URL` | Network + Horizon endpoint |
| `STELLAR_DISTRIBUTION_SECRET` | Funded account to sign/submit real payments (else simulation) |
| `STELLAR_ENCRYPTION_KEY` | AES key encrypting user secret keys at rest |
| `STELLAR_SETTLEMENT_ASSET_CODE` / `_ISSUER` | Anchored stablecoin (e.g. USDC) |
| `NEXT_PUBLIC_FAMILY_WALLET_CONTRACT_ID` | Soroban Family Wallet contract |
| `NEXT_PUBLIC_GOAL_VAULT_CONTRACT_ID` | Soroban Goal Vault contract |
| `NEXT_PUBLIC_SPLIT_PAYMENT_CONTRACT_ID` | Soroban Split Payment contract |
| `NEXT_PUBLIC_AUTOMATION_CONTRACT_ID` | Soroban Automation contract |
| `SOROBAN_RPC_URL` / `SOROBAN_DEPLOYER_SECRET` | Soroban RPC + deployer for live invocation |
| `NEXT_PUBLIC_USD_ZMW_RATE` | ZMW display estimate rate |
| `OPENAI_API_KEY` | Live Mosi agent (optional) |
| `NEXT_PUBLIC_SUPABASE_URL` / `..._ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Database/auth (optional) |

## 12. Security

Supabase RLS on every table, **server-only Stellar secrets** (encrypted, column revoked from `anon`/`authenticated`), KYC gate before real transfers, explicit transaction confirmation, audit logs, risk flags, transaction limits, admin review (`/admin/stellar-monitor`) and a clear demo-mode badge.

## 13. Core pages

`/wallet` · `/family-wallet` · `/goal-vaults` · `/split-payments` · `/fx-optimizer` · `/stellar-receipts` · `/smart-contracts` · `/automations` · `/demo` · `/admin/stellar-monitor`

## 14. Screenshots

_Add screenshots of the demo flow, family wallet, goal vaults, split builder, FX optimizer and a Stellar receipt here._

## 15. Future roadmap

- Real USDC anchor integration with Zambian/regional cash-out partners
- On-chain recurring payments via Stellar smart-contract (Soroban) automations
- Multi-signature Family Wallets with dependent approval
- SEP-24/SEP-31 anchor deposits & withdrawals
- AI memory across sessions and proactive financial nudges

---

## Tech stack

Next.js 15 · React 19 · TypeScript · Tailwind · Framer Motion · Supabase (Postgres + RLS) · OpenAI + LangChain · **Stellar SDK** · Zod · Vercel.

## Architecture

The Stellar core lives in `src/lib/stellar/`. Services (`src/lib/services/`: `split`, `vault`, `fx-optimizer`, `family-finance`, `settlement`) orchestrate Stellar operations and produce receipts. AI tools/ActionCards live in `src/lib/ai/tools.ts`. API routes under `src/app/api/` (`stellar/wallet`, `family-wallet`, `goal-vaults`, `split-payments`, `fx-optimizer`, `automations`, `transfer`, `ai/chat`) execute confirmed actions. See `ARCHITECTURE.md` for the full diagram.
