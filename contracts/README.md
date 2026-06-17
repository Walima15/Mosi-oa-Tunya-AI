# Mosi-oa-Tunya AI — Soroban Smart Contracts

Programmable family finance on Stellar. These Rust/Soroban contracts move **real
USDC** (a Stellar Asset Contract token) — they are not internal ledger numbers.

| Contract | Crate | Purpose |
|---|---|---|
| **Family Wallet** | `family_wallet` | Manage family allocations & release USDC support |
| **Goal Vault** | `goal_vault` | Lock & track USDC savings goals |
| **Split Payment** | `split_payment` | Split one USDC payment across many destinations |
| **Automation** | `automation` | Store & execute programmable finance rules |

## Functions

**Family Wallet:** `create_family_wallet`, `add_family_member`, `allocate_support`, `release_support_payment`, `emergency_release`, `get_family_balance`

**Goal Vault:** `create_goal_vault`, `deposit_to_vault`, `withdraw_from_vault`, `get_vault_progress`, `close_vault`

**Split Payment:** `create_split_rule`, `execute_split_payment`, `update_split_percentages`, `get_split_history`

**Automation:** `create_rule`, `pause_rule`, `resume_rule`, `execute_rule`, `get_rule_status`

## Build & test

```bash
# Install toolchain
rustup target add wasm32-unknown-unknown
cargo install --locked stellar-cli   # provides `stellar contract`

# From the contracts/ directory
cargo test                                   # run unit tests (all 4 contracts)
stellar contract build                       # produces target/wasm32-unknown-unknown/release/*.wasm
```

## Deploy to testnet

```bash
stellar keys generate deployer --network testnet --fund

# Deploy each contract
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/family_wallet.wasm \
  --source deployer --network testnet

# Initialise (USDC = the testnet USDC SAC address)
stellar contract invoke --id <CONTRACT_ID> --source deployer --network testnet \
  -- create_family_wallet --owner <G...> --usdc <USDC_CONTRACT_ID>
```

Record the deployed IDs in the app environment:

```
NEXT_PUBLIC_FAMILY_WALLET_CONTRACT_ID=C...
NEXT_PUBLIC_GOAL_VAULT_CONTRACT_ID=C...
NEXT_PUBLIC_SPLIT_PAYMENT_CONTRACT_ID=C...
NEXT_PUBLIC_AUTOMATION_CONTRACT_ID=C...
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
SOROBAN_DEPLOYER_SECRET=S...
```

The frontend (`src/lib/stellar/soroban.ts`, `src/lib/stellar/contracts.ts`) reads
these IDs. When they are absent, the app **simulates** contract execution with
deterministic contract IDs, transaction hashes and event logs so the demo stays
fully functional — the code paths are production-ready.

> USDC uses 7 decimals on Stellar, so amounts are expressed in stroops:
> `500 USDC = 500_0000000`.
