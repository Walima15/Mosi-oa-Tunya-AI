-- ════════════════════════════════════════════════════════════════════
-- Mosi-oa-Tunya AI — Soroban smart contracts
-- Deployed contract registry + on-chain event log. RLS on both tables.
-- ════════════════════════════════════════════════════════════════════

create table if not exists soroban_contracts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  contract_kind text not null,          -- family_wallet | goal_vault | split_payment | automation
  contract_id text not null unique,     -- C... Soroban contract address
  wasm_hash text,
  usdc_token text,                      -- USDC SAC contract address used by this deployment
  status text not null default 'active', -- active | paused | closed
  usdc_balance numeric(20,7) default 0,
  last_execution_at timestamptz,
  last_tx_hash text,
  simulated boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_soroban_contracts_user on soroban_contracts(user_id);
create index if not exists idx_soroban_contracts_kind on soroban_contracts(contract_kind);

create table if not exists contract_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  contract_id text not null references soroban_contracts(contract_id) on delete cascade,
  contract_kind text not null,
  event_name text not null,
  topics text[],
  data text,
  tx_hash text not null,
  ledger bigint,
  simulated boolean default true,
  created_at timestamptz default now()
);
create index if not exists idx_contract_events_contract on contract_events(contract_id, created_at desc);
create index if not exists idx_contract_events_user on contract_events(user_id, created_at desc);

create trigger trg_soroban_contract_updated before update on soroban_contracts
  for each row execute function set_updated_at();

alter table soroban_contracts enable row level security;
alter table contract_events enable row level security;

create policy "owner all soroban_contracts" on soroban_contracts
  for all using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid());

create policy "owner all contract_events" on contract_events
  for all using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid());
