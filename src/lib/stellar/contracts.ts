/**
 * Typed Soroban contract abstractions — one module per deployed contract.
 *
 * Each function maps 1:1 to a Rust contract method and returns an InvokeResult
 * with events, tx hash and simulated flag. The UI and services call these
 * instead of raw invokeContract().
 *
 * SERVER-ONLY.
 */
import {
  invokeContract,
  getContractState,
  simulateContractCall,
  deployContract,
  simulatedContractId,
  type InvokeResult,
  type ContractState,
  type ContractEvent,
  type DeployResult,
  type ContractKind,
} from "@/lib/stellar/soroban";
import { fromStroops, toStroops } from "@/lib/stellar/assets";

export type { InvokeResult, ContractState, ContractEvent, DeployResult, ContractKind };

// ── Family Wallet Contract ────────────────────────────────────────

export const FamilyWallet = {
  kind: "family_wallet" as const,
  contractId: () =>
    process.env.NEXT_PUBLIC_FAMILY_WALLET_CONTRACT_ID ?? simulatedContractId("family_wallet"),

  create: (owner: string, usdc: string) =>
    invokeContract("family_wallet", "create_family_wallet", { owner, usdc }),

  addMember: (id: string, name: string, relation: string, destination: string, monthlySupport: number, emergency: boolean) =>
    invokeContract("family_wallet", "add_family_member", {
      id, name, relation, destination,
      monthly_support: Number(toStroops(monthlySupport)),
      emergency_support: emergency,
    }),

  allocateSupport: (amountUsdc: number) =>
    invokeContract("family_wallet", "allocate_support", { amount: Number(toStroops(amountUsdc)) }),

  releaseSupport: (memberId: string) =>
    invokeContract("family_wallet", "release_support_payment", { member_id: memberId }),

  emergencyRelease: (memberId: string, amountUsdc: number) =>
    invokeContract("family_wallet", "emergency_release", {
      member_id: memberId,
      amount: Number(toStroops(amountUsdc)),
    }),

  getBalance: async (): Promise<number> => {
    const r = await invokeContract("family_wallet", "get_family_balance", {});
    return fromStroops(Number(r.returnValue ?? 0));
  },

  getState: () => getContractState("family_wallet"),
  deploy: () => deployContract("family_wallet"),
};

// ── Goal Vault Contract ───────────────────────────────────────────

export const GoalVault = {
  kind: "goal_vault" as const,
  contractId: () =>
    process.env.NEXT_PUBLIC_GOAL_VAULT_CONTRACT_ID ?? simulatedContractId("goal_vault"),

  create: (owner: string, usdc: string, name: string, vaultType: string, targetUsdc: number) =>
    invokeContract("goal_vault", "create_goal_vault", {
      owner, usdc, name, vault_type: vaultType,
      target: Number(toStroops(targetUsdc)),
    }),

  deposit: (from: string, amountUsdc: number) =>
    invokeContract("goal_vault", "deposit_to_vault", {
      from, amount: Number(toStroops(amountUsdc)),
    }),

  withdraw: (amountUsdc: number) =>
    invokeContract("goal_vault", "withdraw_from_vault", { amount: Number(toStroops(amountUsdc)) }),

  getProgress: async (): Promise<number> => {
    const r = await invokeContract("goal_vault", "get_vault_progress", {});
    return Number(r.returnValue ?? 0) / 100; // basis points → %
  },

  getBalance: async (): Promise<number> => {
    const r = await invokeContract("goal_vault", "get_vault_balance", {});
    return fromStroops(Number(r.returnValue ?? 0));
  },

  close: () => invokeContract("goal_vault", "close_vault", {}),

  getState: () => getContractState("goal_vault"),
  deploy: () => deployContract("goal_vault"),
};

// ── Split Payment Contract ────────────────────────────────────────

export interface SplitLeg {
  label: string;
  destination: string;
  bps: number; // basis points (6000 = 60%)
}

export const SplitPayment = {
  kind: "split_payment" as const,
  contractId: () =>
    process.env.NEXT_PUBLIC_SPLIT_PAYMENT_CONTRACT_ID ?? simulatedContractId("split_payment"),

  init: (owner: string, usdc: string) =>
    invokeContract("split_payment", "init", { owner, usdc }),

  createRule: (legs: SplitLeg[]) =>
    invokeContract("split_payment", "create_split_rule", { legs }),

  updatePercentages: (legs: SplitLeg[]) =>
    invokeContract("split_payment", "update_split_percentages", { legs }),

  execute: (funder: string, totalUsdc: number) =>
    invokeContract("split_payment", "execute_split_payment", {
      funder, total: Number(toStroops(totalUsdc)),
    }),

  getHistory: () => invokeContract("split_payment", "get_split_history", {}),

  /** Preview a split without submitting. */
  simulate: (funder: string, totalUsdc: number) =>
    simulateContractCall("split_payment", "execute_split_payment", {
      funder, total: Number(toStroops(totalUsdc)),
    }),

  getState: () => getContractState("split_payment"),
  deploy: () => deployContract("split_payment"),
};

// ── Automation Contract ───────────────────────────────────────────

export const Automation = {
  kind: "automation" as const,
  contractId: () =>
    process.env.NEXT_PUBLIC_AUTOMATION_CONTRACT_ID ?? simulatedContractId("automation"),

  init: (owner: string, usdc: string) =>
    invokeContract("automation", "init", { owner, usdc }),

  createRule: (
    id: string,
    trigger: string,
    action: string,
    destination: string,
    amountUsdc: number,
    bps: number
  ) =>
    invokeContract("automation", "create_rule", {
      id, trigger, action, destination,
      amount: Number(toStroops(amountUsdc)),
      bps,
    }),

  pause: (id: string) => invokeContract("automation", "pause_rule", { id }),
  resume: (id: string) => invokeContract("automation", "resume_rule", { id }),

  execute: (id: string, funder: string, baseAmountUsdc: number) =>
    invokeContract("automation", "execute_rule", {
      id, funder, base_amount: Number(toStroops(baseAmountUsdc)),
    }),

  getStatus: (id: string) => invokeContract("automation", "get_rule_status", { id }),

  getState: () => getContractState("automation"),
  deploy: () => deployContract("automation"),
};

/** All four contracts with metadata for the /smart-contracts page. */
export const CONTRACT_REGISTRY = [
  {
    kind: "family_wallet" as const,
    name: "Family Wallet Contract",
    description: "Manage family allocations using Stellar USDC",
    methods: ["create_family_wallet", "add_family_member", "allocate_support", "release_support_payment", "emergency_release", "get_family_balance"],
    getId: FamilyWallet.contractId,
    getState: FamilyWallet.getState,
  },
  {
    kind: "goal_vault" as const,
    name: "Goal Vault Contract",
    description: "Lock and track USDC savings goals on-chain",
    methods: ["create_goal_vault", "deposit_to_vault", "withdraw_from_vault", "get_vault_progress", "close_vault"],
    getId: GoalVault.contractId,
    getState: GoalVault.getState,
  },
  {
    kind: "split_payment" as const,
    name: "Split Payment Contract",
    description: "Split one USDC payment into multiple Stellar destinations",
    methods: ["create_split_rule", "execute_split_payment", "update_split_percentages", "get_split_history"],
    getId: SplitPayment.contractId,
    getState: SplitPayment.getState,
  },
  {
    kind: "automation" as const,
    name: "Automation Contract",
    description: "Store and execute programmable finance rules",
    methods: ["create_rule", "pause_rule", "resume_rule", "execute_rule", "get_rule_status"],
    getId: Automation.contractId,
    getState: Automation.getState,
  },
] as const;
