-- ════════════════════════════════════════════════════════════════════
-- Mosi-oa-Tunya AI — Stellar backbone
-- Stellar wallets, family wallets, goal vaults, split payments, FX alerts,
-- Stellar automations and on-chain receipts. RLS on every table.
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────
do $$ begin
  create type stellar_network as enum ('testnet', 'public');
exception when duplicate_object then null; end $$;

do $$ begin
  create type vault_type as enum ('house', 'education', 'emergency', 'retirement', 'school_fees', 'general');
exception when duplicate_object then null; end $$;

do $$ begin
  create type stellar_op_type as enum ('payment', 'vault_deposit', 'vault_withdraw', 'split_payment', 'path_payment', 'wallet_creation');
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────
-- STELLAR WALLETS — one real Stellar account per user
-- The secret key is AES-256-GCM encrypted server-side before storage.
-- ─────────────────────────────────────────────
create table if not exists stellar_wallets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  public_key text not null unique,
  encrypted_secret text not null,          -- never returned to the client
  network stellar_network not null default 'testnet',
  trustline_established boolean default false,
  xlm_balance numeric(20,7) default 0,
  usdc_balance numeric(20,7) default 0,
  funded boolean default false,
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, network)
);
create index if not exists idx_stellar_wallets_user on stellar_wallets(user_id);

-- ─────────────────────────────────────────────
-- STELLAR TRANSACTIONS + RECEIPTS
-- ─────────────────────────────────────────────
create table if not exists stellar_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  hash text not null,
  operation_type stellar_op_type not null default 'payment',
  source_account text not null,
  destination_account text not null,
  asset text not null default 'XLM',
  amount numeric(20,7) not null,
  fee_stroops int not null default 100,
  memo text,
  network stellar_network not null default 'testnet',
  status tx_status not null default 'completed',
  simulated boolean default true,
  ledger bigint,
  created_at timestamptz default now()
);
create index if not exists idx_stellar_tx_user on stellar_transactions(user_id, created_at desc);
create index if not exists idx_stellar_tx_hash on stellar_transactions(hash);

create table if not exists stellar_receipts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  transaction_id uuid references stellar_transactions(id) on delete cascade,
  reference text not null unique,
  hash text not null,
  operation_type stellar_op_type not null,
  asset text not null,
  source_account text not null,
  destination_account text not null,
  amount text not null,
  fee_stroops int not null default 100,
  memo text,
  network stellar_network not null default 'testnet',
  explorer_url text,
  simulated boolean default true,
  status text not null default 'success',
  created_at timestamptz default now()
);
create index if not exists idx_stellar_receipts_user on stellar_receipts(user_id, created_at desc);

-- ─────────────────────────────────────────────
-- FAMILY WALLETS — shared Stellar finance structure
-- ─────────────────────────────────────────────
create table if not exists family_wallets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null default 'My Family',
  stellar_public_key text,                 -- mapped Stellar account
  base_currency currency_code not null default 'ZMW',
  total_allocated numeric(20,2) not null default 0,
  emergency_reserve numeric(20,2) not null default 0,
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_family_wallets_user on family_wallets(user_id);

create table if not exists family_members (
  id uuid primary key default uuid_generate_v4(),
  family_wallet_id uuid not null references family_wallets(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  full_name text not null,
  relation beneficiary_relation not null default 'other',
  stellar_destination text,                -- mapped Stellar destination account
  payout_rail payment_rail,
  payout_account text,
  monthly_support numeric(20,2) default 0,
  emergency_support boolean default false,
  memo_tag text,                           -- e.g. FAMILY_SUPPORT_MOTHER
  created_at timestamptz default now()
);
create index if not exists idx_family_members_wallet on family_members(family_wallet_id);

create table if not exists family_allocations (
  id uuid primary key default uuid_generate_v4(),
  family_wallet_id uuid not null references family_wallets(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  member_id uuid references family_members(id) on delete set null,
  vault_id uuid,                           -- references goal_vaults(id)
  label text not null,
  percentage numeric(5,2),
  amount numeric(20,2),
  currency currency_code not null default 'ZMW',
  created_at timestamptz default now()
);
create index if not exists idx_family_alloc_wallet on family_allocations(family_wallet_id);

create table if not exists family_wallet_transactions (
  id uuid primary key default uuid_generate_v4(),
  family_wallet_id uuid not null references family_wallets(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  member_id uuid references family_members(id) on delete set null,
  stellar_transaction_id uuid references stellar_transactions(id) on delete set null,
  amount numeric(20,2) not null,
  currency currency_code not null default 'ZMW',
  memo text,
  status tx_status not null default 'completed',
  created_at timestamptz default now()
);
create index if not exists idx_family_tx_wallet on family_wallet_transactions(family_wallet_id, created_at desc);

-- ─────────────────────────────────────────────
-- GOAL VAULTS — Stellar-backed savings vaults
-- ─────────────────────────────────────────────
create table if not exists goal_vaults (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  vault_type vault_type not null default 'general',
  emoji text default '🎯',
  stellar_public_key text,                 -- vault ledger reference / account
  target_amount numeric(20,2) not null,
  current_amount numeric(20,2) not null default 0,
  currency currency_code not null default 'ZMW',
  target_date date,
  memo_tag text,                           -- e.g. HOUSE_FUND_DEPOSIT
  status goal_status not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_goal_vaults_user on goal_vaults(user_id);

create table if not exists vault_transactions (
  id uuid primary key default uuid_generate_v4(),
  vault_id uuid not null references goal_vaults(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  stellar_transaction_id uuid references stellar_transactions(id) on delete set null,
  direction text not null default 'deposit',   -- deposit | withdraw
  amount numeric(20,2) not null,
  currency currency_code not null default 'ZMW',
  memo text,
  created_at timestamptz default now()
);
create index if not exists idx_vault_tx_vault on vault_transactions(vault_id, created_at desc);

-- ─────────────────────────────────────────────
-- SPLIT PAYMENTS — one remittance, many Stellar destinations
-- ─────────────────────────────────────────────
create table if not exists split_payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  family_wallet_id uuid references family_wallets(id) on delete set null,
  total_amount numeric(20,2) not null,
  currency currency_code not null default 'USD',
  memo text,
  status tx_status not null default 'pending',
  created_at timestamptz default now(),
  settled_at timestamptz
);
create index if not exists idx_split_user on split_payments(user_id, created_at desc);

create table if not exists split_payment_items (
  id uuid primary key default uuid_generate_v4(),
  split_payment_id uuid not null references split_payments(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  label text not null,
  destination_type text not null default 'member',   -- member | vault | bill | school
  member_id uuid references family_members(id) on delete set null,
  vault_id uuid references goal_vaults(id) on delete set null,
  stellar_destination text,
  percentage numeric(5,2),
  amount numeric(20,2) not null,
  currency currency_code not null default 'ZMW',
  memo text,
  stellar_transaction_id uuid references stellar_transactions(id) on delete set null,
  status tx_status not null default 'pending',
  created_at timestamptz default now()
);
create index if not exists idx_split_items_parent on split_payment_items(split_payment_id);

-- ─────────────────────────────────────────────
-- FX ALERTS — AI FX Optimizer (path payments)
-- ─────────────────────────────────────────────
create table if not exists fx_alerts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  base currency_code not null,
  quote currency_code not null,
  target_rate numeric(20,8) not null,
  direction alert_direction not null default 'above',
  auto_convert boolean default false,
  auto_convert_amount numeric(20,2),
  vault_id uuid references goal_vaults(id) on delete set null,
  triggered boolean default false,
  triggered_at timestamptz,
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_fx_alerts_user on fx_alerts(user_id);

-- ─────────────────────────────────────────────
-- STELLAR AUTOMATIONS + LOGS
-- ─────────────────────────────────────────────
create table if not exists stellar_automations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  natural_language text,
  trigger jsonb not null,                  -- { kind, cron, event, metric, operator, value }
  action jsonb not null,                   -- { kind, amount, percentage, currency, memo_tag }
  family_wallet_id uuid references family_wallets(id) on delete set null,
  vault_id uuid references goal_vaults(id) on delete set null,
  member_id uuid references family_members(id) on delete set null,
  status automation_status not null default 'active',
  last_run_at timestamptz,
  next_run_at timestamptz,
  run_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_stellar_auto_user on stellar_automations(user_id);

create table if not exists automation_logs (
  id uuid primary key default uuid_generate_v4(),
  automation_id uuid not null references stellar_automations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'success',
  detail text,
  stellar_transaction_id uuid references stellar_transactions(id) on delete set null,
  amount numeric(20,2),
  created_at timestamptz default now()
);
create index if not exists idx_automation_logs_auto on automation_logs(automation_id, created_at desc);

-- family_allocations.vault_id → goal_vaults (added after vault table exists)
do $$ begin
  alter table family_allocations
    add constraint fk_family_alloc_vault
    foreign key (vault_id) references goal_vaults(id) on delete set null;
exception when duplicate_object then null; end $$;

-- updated_at triggers
create trigger trg_stellar_wallet_updated before update on stellar_wallets
  for each row execute function set_updated_at();
create trigger trg_family_wallet_updated before update on family_wallets
  for each row execute function set_updated_at();
create trigger trg_goal_vault_updated before update on goal_vaults
  for each row execute function set_updated_at();
create trigger trg_fx_alert_updated before update on fx_alerts
  for each row execute function set_updated_at();
create trigger trg_stellar_auto_updated before update on stellar_automations
  for each row execute function set_updated_at();

-- ════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY — every Stellar table scoped to its owner (+ admin read)
-- ════════════════════════════════════════════════════════════════════
alter table stellar_wallets             enable row level security;
alter table stellar_transactions        enable row level security;
alter table stellar_receipts            enable row level security;
alter table family_wallets              enable row level security;
alter table family_members              enable row level security;
alter table family_allocations          enable row level security;
alter table family_wallet_transactions  enable row level security;
alter table goal_vaults                 enable row level security;
alter table vault_transactions          enable row level security;
alter table split_payments              enable row level security;
alter table split_payment_items         enable row level security;
alter table fx_alerts                   enable row level security;
alter table stellar_automations         enable row level security;
alter table automation_logs             enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'stellar_wallets','stellar_transactions','stellar_receipts',
    'family_wallets','family_members','family_allocations','family_wallet_transactions',
    'goal_vaults','vault_transactions','split_payments','split_payment_items',
    'fx_alerts','stellar_automations','automation_logs'
  ]
  loop
    execute format($f$
      create policy "owner all" on %I
        for all using (user_id = auth.uid() or is_admin())
        with check (user_id = auth.uid());
    $f$, t);
  end loop;
end $$;

-- IMPORTANT: never expose the encrypted secret column to the anon/auth role.
-- Application code selects explicit columns; revoke the column for safety.
revoke select (encrypted_secret) on stellar_wallets from anon, authenticated;
