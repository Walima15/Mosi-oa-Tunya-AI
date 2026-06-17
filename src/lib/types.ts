/** Domain types mirroring the Supabase schema (see supabase/migrations). */

export type UserRole = "diaspora" | "recipient" | "business" | "admin";
export type KycStatus = "unverified" | "pending" | "verified" | "rejected";
export type CurrencyCode = "USD" | "ZMW" | "ZAR" | "BWP" | "KES" | "TZS";
export type WalletType = "fiat" | "stablecoin" | "savings";
export type TxType =
  | "transfer"
  | "deposit"
  | "withdrawal"
  | "conversion"
  | "bill"
  | "school_fee"
  | "payroll"
  | "investment"
  | "savings_contribution";
export type TxStatus =
  | "pending"
  | "processing"
  | "settled"
  | "completed"
  | "failed"
  | "reversed";
export type PaymentRail =
  | "airtel"
  | "mtn"
  | "zamtel"
  | "flutterwave"
  | "paychangu"
  | "stellar"
  | "bank";
export type AutomationStatus = "active" | "paused" | "completed" | "cancelled";
export type GoalStatus = "active" | "achieved" | "paused" | "cancelled";
export type RiskProfile = "conservative" | "balanced" | "growth" | "aggressive";
export type BeneficiaryRelation =
  | "parent"
  | "child"
  | "spouse"
  | "sibling"
  | "dependent"
  | "other";
export type MessageRole = "user" | "assistant" | "system" | "tool";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  country?: string | null;
  residence_country?: string | null;
  preferred_currency: CurrencyCode;
  kyc_status: KycStatus;
  mfa_enabled: boolean;
  biometric_enabled: boolean;
  onboarded: boolean;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  type: WalletType;
  currency: CurrencyCode;
  balance: number;
  stellar_public_key?: string | null;
  is_primary: boolean;
}

export interface Beneficiary {
  id: string;
  owner_id: string;
  full_name: string;
  relation: BeneficiaryRelation;
  phone?: string | null;
  country?: string | null;
  currency: CurrencyCode;
  payment_rail?: PaymentRail | null;
  rail_account?: string | null;
  monthly_support: number;
  is_favorite: boolean;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TxType;
  status: TxStatus;
  beneficiary_id?: string | null;
  send_currency: CurrencyCode;
  send_amount: number;
  receive_currency: CurrencyCode;
  receive_amount: number;
  exchange_rate: number;
  fee: number;
  payment_rail?: PaymentRail | null;
  stellar_tx_hash?: string | null;
  reference: string;
  description?: string | null;
  created_at: string;
  settled_at?: string | null;
}

export interface AutomationTrigger {
  kind: "schedule" | "condition";
  cron?: string;
  event?: string;
  metric?: string;
  operator?: ">" | "<" | ">=" | "<=" | "==";
  value?: number;
}

export interface AutomationAction {
  kind: "transfer" | "save" | "convert" | "pay_bill";
  amount?: number;
  percentage?: number;
  currency?: CurrencyCode;
  target?: string;
}

export interface Automation {
  id: string;
  user_id: string;
  name: string;
  status: AutomationStatus;
  trigger: AutomationTrigger;
  action: AutomationAction;
  beneficiary_id?: string | null;
  natural_language?: string | null;
  next_run_at?: string | null;
  run_count: number;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  target_amount: number;
  current_amount: number;
  currency: CurrencyCode;
  target_date?: string | null;
  monthly_contribution: number;
  status: GoalStatus;
}

export interface InvestmentProduct {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  expected_roi: number;
  risk: RiskProfile;
  min_amount: number;
  term_months?: number | null;
  currency: CurrencyCode;
}

export interface AiMessage {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  tool_calls?: unknown;
  created_at: string;
}

export interface AiMemory {
  id: string;
  user_id: string;
  key: string;
  value: string;
  category?: string | null;
  importance: number;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  body?: string | null;
  category?: string | null;
  read: boolean;
  action_url?: string | null;
  created_at: string;
}

/* ── Stellar-native domain types ─────────────────────────────── */

export type StellarNetwork = "testnet" | "public";
export type VaultType =
  | "house"
  | "education"
  | "emergency"
  | "retirement"
  | "school_fees"
  | "general";

export interface StellarWallet {
  id: string;
  user_id: string;
  public_key: string;
  network: StellarNetwork;
  trustline_established: boolean;
  xlm_balance: number;
  usdc_balance: number;
  funded: boolean;
}

export interface FamilyMember {
  id: string;
  family_wallet_id: string;
  full_name: string;
  relation: BeneficiaryRelation;
  stellar_destination?: string | null;
  payout_rail?: PaymentRail | null;
  payout_account?: string | null;
  monthly_support: number;
  emergency_support: boolean;
  memo_tag?: string | null;
}

export interface FamilyWallet {
  id: string;
  user_id: string;
  name: string;
  stellar_public_key?: string | null;
  base_currency: CurrencyCode;
  total_allocated: number;
  emergency_reserve: number;
  members: FamilyMember[];
}

export interface GoalVault {
  id: string;
  user_id: string;
  name: string;
  vault_type: VaultType;
  emoji: string;
  stellar_public_key?: string | null;
  target_amount: number;
  current_amount: number;
  currency: CurrencyCode;
  target_date?: string | null;
  memo_tag?: string | null;
  status: GoalStatus;
}

export interface SplitPaymentItem {
  id: string;
  label: string;
  destination_type: "member" | "vault" | "bill" | "school";
  stellar_destination?: string | null;
  percentage?: number | null;
  amount: number;
  currency: CurrencyCode;
  memo?: string | null;
  stellar_tx_hash?: string | null;
  status: TxStatus;
}

export interface SplitPayment {
  id: string;
  user_id: string;
  total_amount: number;
  currency: CurrencyCode;
  memo?: string | null;
  status: TxStatus;
  items: SplitPaymentItem[];
  created_at: string;
}

export interface FxAlert {
  id: string;
  user_id: string;
  base: CurrencyCode;
  quote: CurrencyCode;
  target_rate: number;
  direction: "above" | "below";
  auto_convert: boolean;
  auto_convert_amount?: number | null;
  triggered: boolean;
  status: string;
}

export interface StellarAutomation {
  id: string;
  user_id: string;
  name: string;
  natural_language?: string | null;
  trigger: AutomationTrigger;
  action: AutomationAction & { memo_tag?: string };
  status: AutomationStatus;
  next_run_at?: string | null;
  run_count: number;
}

export interface AutomationLog {
  id: string;
  automation_id: string;
  status: string;
  detail?: string | null;
  stellar_tx_hash?: string | null;
  amount?: number | null;
  created_at: string;
}
