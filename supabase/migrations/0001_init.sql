-- ════════════════════════════════════════════════════════════════════
-- Mosi-oa-Tunya AI — Core Schema
-- PostgreSQL / Supabase · "The Smoke That Thunders"
-- ════════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────
create type user_role as enum ('diaspora', 'recipient', 'business', 'admin');
create type kyc_status as enum ('unverified', 'pending', 'verified', 'rejected');
create type currency_code as enum ('USD', 'ZMW', 'ZAR', 'BWP', 'KES', 'TZS');
create type wallet_type as enum ('fiat', 'stablecoin', 'savings');
create type tx_type as enum ('transfer', 'deposit', 'withdrawal', 'conversion', 'bill', 'school_fee', 'payroll', 'investment', 'savings_contribution');
create type tx_status as enum ('pending', 'processing', 'settled', 'completed', 'failed', 'reversed');
create type payment_rail as enum ('airtel', 'mtn', 'zamtel', 'flutterwave', 'paychangu', 'stellar', 'bank');
create type automation_status as enum ('active', 'paused', 'completed', 'cancelled');
create type goal_status as enum ('active', 'achieved', 'paused', 'cancelled');
create type risk_profile as enum ('conservative', 'balanced', 'growth', 'aggressive');
create type beneficiary_relation as enum ('parent', 'child', 'spouse', 'sibling', 'dependent', 'other');
create type message_role as enum ('user', 'assistant', 'system', 'tool');
create type alert_direction as enum ('above', 'below');

-- ─────────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ─────────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text unique not null,
  phone text,
  avatar_url text,
  role user_role not null default 'diaspora',
  country text,
  residence_country text,
  preferred_currency currency_code not null default 'ZMW',
  kyc_status kyc_status not null default 'unverified',
  language text default 'en',
  mfa_enabled boolean default false,
  biometric_enabled boolean default false,
  onboarded boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- KYC DOCUMENTS
-- ─────────────────────────────────────────────
create table kyc_documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  doc_type text not null,            -- passport, national_id, proof_of_address, selfie
  storage_path text not null,
  status kyc_status not null default 'pending',
  reviewed_by uuid references profiles(id),
  rejection_reason text,
  created_at timestamptz default now(),
  reviewed_at timestamptz
);

-- ─────────────────────────────────────────────
-- WALLETS
-- ─────────────────────────────────────────────
create table wallets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  type wallet_type not null default 'fiat',
  currency currency_code not null,
  balance numeric(20,4) not null default 0 check (balance >= 0),
  stellar_public_key text,           -- for stablecoin wallets
  is_primary boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, currency, type)
);

-- ─────────────────────────────────────────────
-- BENEFICIARIES (Family Support Center)
-- ─────────────────────────────────────────────
create table beneficiaries (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references profiles(id) on delete cascade,
  linked_user_id uuid references profiles(id),  -- if recipient has an account
  full_name text not null,
  relation beneficiary_relation not null default 'other',
  phone text,
  country text,
  currency currency_code not null default 'ZMW',
  payment_rail payment_rail,
  rail_account text,                 -- mobile money number / bank acct
  monthly_support numeric(20,2) default 0,
  photo_url text,
  is_favorite boolean default false,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- EXCHANGE RATES (cache)
-- ─────────────────────────────────────────────
create table exchange_rates (
  id uuid primary key default uuid_generate_v4(),
  base currency_code not null,
  quote currency_code not null,
  rate numeric(20,8) not null,
  source text default 'aggregate',
  fetched_at timestamptz default now(),
  unique (base, quote)
);

-- ─────────────────────────────────────────────
-- TRANSACTIONS
-- ─────────────────────────────────────────────
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  type tx_type not null,
  status tx_status not null default 'pending',
  source_wallet_id uuid references wallets(id),
  beneficiary_id uuid references beneficiaries(id),
  send_currency currency_code not null,
  send_amount numeric(20,4) not null check (send_amount > 0),
  receive_currency currency_code not null,
  receive_amount numeric(20,4) not null,
  exchange_rate numeric(20,8) not null default 1,
  fee numeric(20,4) not null default 0,
  payment_rail payment_rail,
  stellar_tx_hash text,
  reference text unique default ('MOT-' || upper(substr(replace(uuid_generate_v4()::text,'-',''),1,10))),
  description text,
  metadata jsonb default '{}'::jsonb,
  automation_id uuid,
  created_at timestamptz default now(),
  settled_at timestamptz
);
create index idx_tx_user on transactions(user_id, created_at desc);
create index idx_tx_status on transactions(status);

-- ─────────────────────────────────────────────
-- AUTOMATIONS (Smart Automations)
-- ─────────────────────────────────────────────
create table automations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  status automation_status not null default 'active',
  -- trigger: { kind: 'schedule'|'condition', cron, event, metric, operator, value }
  trigger jsonb not null,
  -- action: { kind: 'transfer'|'save'|'convert'|'pay_bill', ... }
  action jsonb not null,
  beneficiary_id uuid references beneficiaries(id),
  natural_language text,             -- original user phrasing
  last_run_at timestamptz,
  next_run_at timestamptz,
  run_count int default 0,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- EXCHANGE ALERTS
-- ─────────────────────────────────────────────
create table exchange_alerts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  base currency_code not null,
  quote currency_code not null,
  target_rate numeric(20,8) not null,
  direction alert_direction not null default 'above',
  triggered boolean default false,
  auto_convert_amount numeric(20,2),
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- SAVINGS GOALS
-- ─────────────────────────────────────────────
create table savings_goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  emoji text default '🎯',
  target_amount numeric(20,2) not null,
  current_amount numeric(20,2) not null default 0,
  currency currency_code not null default 'ZMW',
  target_date date,
  monthly_contribution numeric(20,2) default 0,
  status goal_status not null default 'active',
  ai_forecast jsonb,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- INVESTMENTS
-- ─────────────────────────────────────────────
create table investment_products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null,            -- bonds, t_bills, agriculture, real_estate, sme
  description text,
  expected_roi numeric(6,2),         -- annualized %
  risk risk_profile not null default 'balanced',
  min_amount numeric(20,2) default 0,
  term_months int,
  currency currency_code not null default 'ZMW',
  active boolean default true
);

create table investments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  product_id uuid not null references investment_products(id),
  amount numeric(20,2) not null,
  current_value numeric(20,2) not null,
  status text default 'active',
  started_at timestamptz default now(),
  matures_at timestamptz
);

-- ─────────────────────────────────────────────
-- SCHOOLS & FEES
-- ─────────────────────────────────────────────
create table schools (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  country text,
  payment_rail payment_rail,
  rail_account text,
  verified boolean default false,
  created_at timestamptz default now()
);

create table school_fees (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  school_id uuid not null references schools(id),
  student_name text not null,
  term text,
  amount numeric(20,2) not null,
  currency currency_code not null default 'ZMW',
  due_date date,
  paid boolean default false,
  paid_at timestamptz,
  automation_id uuid references automations(id),
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- BILLS
-- ─────────────────────────────────────────────
create table bills (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  category text not null,            -- electricity, water, internet, tv
  biller_name text not null,
  account_number text,
  amount numeric(20,2),
  currency currency_code not null default 'ZMW',
  due_date date,
  recurring boolean default false,
  automation_id uuid references automations(id),
  last_paid_at timestamptz,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- BUSINESS PAYROLL
-- ─────────────────────────────────────────────
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  country text,
  base_currency currency_code not null default 'ZMW',
  created_at timestamptz default now()
);

create table employees (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  salary numeric(20,2) not null,
  currency currency_code not null default 'ZMW',
  payment_rail payment_rail,
  rail_account text,
  active boolean default true,
  created_at timestamptz default now()
);

create table payroll_runs (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  period text not null,              -- e.g. 2026-06
  total_amount numeric(20,2) not null default 0,
  status tx_status not null default 'pending',
  employee_count int default 0,
  created_at timestamptz default now(),
  executed_at timestamptz
);

-- ─────────────────────────────────────────────
-- AI AGENT — CONVERSATIONS, MESSAGES, MEMORY
-- ─────────────────────────────────────────────
create table ai_conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text default 'New conversation',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table ai_messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role message_role not null,
  content text not null,
  tool_calls jsonb,
  tokens int,
  created_at timestamptz default now()
);
create index idx_ai_msg_conv on ai_messages(conversation_id, created_at);

-- Long-term agent memory (facts the AI should remember about the user)
create table ai_memories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  key text not null,                 -- e.g. 'mother_name', 'savings_target'
  value text not null,
  category text,                     -- family, goals, preferences, income
  importance int default 1,
  source_message_id uuid references ai_messages(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, key)
);

-- ─────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text,
  category text,                     -- transfer, automation, security, ai, system
  read boolean default false,
  action_url text,
  created_at timestamptz default now()
);
create index idx_notif_user on notifications(user_id, created_at desc);

-- ─────────────────────────────────────────────
-- SECURITY — DEVICES, SESSIONS, AUDIT
-- ─────────────────────────────────────────────
create table devices (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text,
  platform text,
  fingerprint text,
  trusted boolean default false,
  last_active_at timestamptz default now(),
  created_at timestamptz default now()
);

create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete set null,
  actor_role user_role,
  action text not null,
  entity text,
  entity_id uuid,
  ip_address inet,
  user_agent text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create index idx_audit_user on audit_logs(user_id, created_at desc);

-- AML / fraud monitoring flags
create table risk_flags (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  transaction_id uuid references transactions(id) on delete cascade,
  severity text not null default 'low',   -- low, medium, high, critical
  reason text not null,
  resolved boolean default false,
  resolved_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- updated_at triggers
-- ─────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();
create trigger trg_wallets_updated before update on wallets
  for each row execute function set_updated_at();
create trigger trg_ai_conv_updated before update on ai_conversations
  for each row execute function set_updated_at();
create trigger trg_ai_mem_updated before update on ai_memories
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────
-- New user → profile bootstrap
-- ─────────────────────────────────────────────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'diaspora')
  );
  -- create a primary ZMW wallet
  insert into public.wallets (user_id, type, currency, is_primary)
  values (new.id, 'fiat', 'ZMW', true);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
