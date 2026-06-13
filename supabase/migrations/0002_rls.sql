-- ════════════════════════════════════════════════════════════════════
-- Mosi-oa-Tunya AI — Row Level Security
-- Every user can only touch their own rows. Admins get read/manage access
-- via the is_admin() helper. Service role bypasses RLS for server jobs.
-- ════════════════════════════════════════════════════════════════════

-- Helper: is the current user an admin?
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- Enable RLS on all user-facing tables
alter table profiles            enable row level security;
alter table kyc_documents       enable row level security;
alter table wallets             enable row level security;
alter table beneficiaries       enable row level security;
alter table transactions        enable row level security;
alter table automations         enable row level security;
alter table exchange_alerts     enable row level security;
alter table savings_goals       enable row level security;
alter table investments         enable row level security;
alter table school_fees         enable row level security;
alter table bills               enable row level security;
alter table organizations       enable row level security;
alter table employees           enable row level security;
alter table payroll_runs        enable row level security;
alter table ai_conversations    enable row level security;
alter table ai_messages         enable row level security;
alter table ai_memories         enable row level security;
alter table notifications       enable row level security;
alter table devices             enable row level security;
alter table audit_logs          enable row level security;
alter table risk_flags          enable row level security;

-- Reference tables readable by all authenticated users
alter table exchange_rates      enable row level security;
alter table schools             enable row level security;
alter table investment_products enable row level security;

create policy "rates readable" on exchange_rates for select using (auth.role() = 'authenticated');
create policy "schools readable" on schools for select using (auth.role() = 'authenticated');
create policy "products readable" on investment_products for select using (auth.role() = 'authenticated');

-- ── PROFILES ──
create policy "own profile select" on profiles for select
  using (id = auth.uid() or is_admin());
create policy "own profile update" on profiles for update
  using (id = auth.uid());

-- ── Generic owner policies via a macro-like pattern ──
-- profiles-owned tables keyed by user_id
do $$
declare t text;
begin
  foreach t in array array[
    'kyc_documents','wallets','beneficiaries','transactions','automations',
    'exchange_alerts','savings_goals','investments','school_fees','bills',
    'ai_conversations','ai_memories','notifications','devices'
  ]
  loop
    execute format($f$
      create policy "owner all" on %I
        for all using (user_id = auth.uid() or is_admin())
        with check (user_id = auth.uid());
    $f$, t);
  end loop;
end $$;

-- ai_messages: scoped by user_id too
create policy "owner messages" on ai_messages
  for all using (user_id = auth.uid() or is_admin())
  with check (user_id = auth.uid());

-- ── ORGANIZATIONS / payroll: owner is the business user ──
create policy "org owner" on organizations
  for all using (owner_id = auth.uid() or is_admin())
  with check (owner_id = auth.uid());

create policy "employees by org owner" on employees
  for all using (
    exists (select 1 from organizations o where o.id = organization_id and (o.owner_id = auth.uid() or is_admin()))
  )
  with check (
    exists (select 1 from organizations o where o.id = organization_id and o.owner_id = auth.uid())
  );

create policy "payroll by org owner" on payroll_runs
  for all using (
    exists (select 1 from organizations o where o.id = organization_id and (o.owner_id = auth.uid() or is_admin()))
  )
  with check (
    exists (select 1 from organizations o where o.id = organization_id and o.owner_id = auth.uid())
  );

-- ── AUDIT & RISK: admins read; users read their own audit trail ──
create policy "audit own or admin" on audit_logs for select
  using (user_id = auth.uid() or is_admin());
create policy "risk admin" on risk_flags for all
  using (is_admin() or user_id = auth.uid());
