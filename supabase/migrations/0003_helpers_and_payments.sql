-- ════════════════════════════════════════════════════════════════════════════════════════
-- Mosi-oa-Tunya AI — Security helper functions, audit logging & bill payments
-- Adds the helpers referenced by the product spec and a bill_payments ledger.
-- ════════════════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- Role / ownership helper functions (used by RLS + server code)
-- ─────────────────────────────────────────────

-- Is the current user a business account?
create or replace function is_business_user()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'business'
  );
$$ language sql security definer stable;

-- Does the current user own the given profile id?
create or replace function owns_profile(target uuid)
returns boolean as $$
  select target = auth.uid();
$$ language sql security definer stable;

-- Append an entry to the immutable audit trail. Safe to call from triggers,
-- server actions and API routes. Returns the new audit row id.
create or replace function log_audit_event(
  p_action text,
  p_entity text default null,
  p_entity_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid as $$
declare
  v_id uuid;
  v_role user_role;
begin
  select role into v_role from public.profiles where id = auth.uid();
  insert into public.audit_logs (user_id, actor_role, action, entity, entity_id, metadata)
  values (auth.uid(), v_role, p_action, p_entity, p_entity_id, coalesce(p_metadata, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$ language plpgsql security definer;

-- ─────────────────────────────────────────────
-- BILL PAYMENTS — ledger of executed/scheduled bill payments
-- (the `bills` table holds the biller; this holds each payment)
-- ─────────────────────────────────────────────
create table if not exists bill_payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  bill_id uuid references bills(id) on delete set null,
  transaction_id uuid references transactions(id) on delete set null,
  amount numeric(20,2) not null check (amount > 0),
  currency currency_code not null default 'ZMW',
  status tx_status not null default 'pending',
  payment_rail payment_rail,
  scheduled_for date,
  paid_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_bill_payments_user on bill_payments(user_id, created_at desc);

-- ─────────────────────────────────────────────
-- BUSINESSES / PAYROLL BATCHES — spec-named views over existing tables
-- (organizations + payroll_runs) so either naming convention works.
-- ─────────────────────────────────────────────
create or replace view businesses as
  select id, owner_id, name, country, base_currency, created_at
  from organizations;

create or replace view payroll_batches as
  select id, organization_id, period, total_amount, status, employee_count,
         created_at, executed_at
  from payroll_runs;

-- ─────────────────────────────────────────────
-- RLS for bill_payments
-- ─────────────────────────────────────────────
alter table bill_payments enable row level security;

create policy "owner bill_payments" on bill_payments
  for all using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid() or is_admin());

-- ─────────────────────────────────────────────
-- Audit triggers: log transaction lifecycle changes automatically
-- ─────────────────────────────────────────────
create or replace function audit_transaction_change()
returns trigger as $$
begin
  insert into public.audit_logs (user_id, action, entity, entity_id, metadata)
  values (
    new.user_id,
    case when tg_op = 'INSERT' then 'transaction.created' else 'transaction.updated' end,
    'transaction',
    new.id,
    jsonb_build_object('status', new.status, 'amount', new.send_amount, 'currency', new.send_currency)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_audit_tx on transactions;
create trigger trg_audit_tx
  after insert or update of status on transactions
  for each row execute function audit_transaction_change();
