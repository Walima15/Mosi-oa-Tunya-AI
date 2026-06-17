#![no_std]
//! Goal Vault Contract — Mosi-oa-Tunya AI
//!
//! Locks and tracks a USDC savings goal (house, education, emergency, etc.).
//! Deposits pull USDC into the vault; withdrawals send it back to the owner.
//! Progress is computed against a target amount and the contract reports a
//! completion percentage in basis points.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, token, Address, Env, String, Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    InvalidAmount = 3,
    InsufficientBalance = 4,
    VaultClosed = 5,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Owner,
    Usdc,
    Name,
    VaultType,
    Target,
    Deposited,
    Closed,
}

#[contract]
pub struct GoalVaultContract;

#[contractimpl]
impl GoalVaultContract {
    /// create_goal_vault — initialise a vault with a USDC token, name, type and
    /// target amount (in USDC stroops, 7 decimals).
    pub fn create_goal_vault(
        env: Env,
        owner: Address,
        usdc: Address,
        name: String,
        vault_type: Symbol,
        target: i128,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Owner) {
            return Err(Error::AlreadyInitialized);
        }
        if target <= 0 {
            return Err(Error::InvalidAmount);
        }
        owner.require_auth();
        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage().instance().set(&DataKey::Usdc, &usdc);
        env.storage().instance().set(&DataKey::Name, &name);
        env.storage()
            .instance()
            .set(&DataKey::VaultType, &vault_type);
        env.storage().instance().set(&DataKey::Target, &target);
        env.storage().instance().set(&DataKey::Deposited, &0i128);
        env.storage().instance().set(&DataKey::Closed, &false);
        env.events()
            .publish((Symbol::new(&env, "vault_created"), vault_type), target);
        Ok(())
    }

    /// deposit_to_vault — move USDC from a depositor into the vault.
    pub fn deposit_to_vault(env: Env, from: Address, amount: i128) -> Result<i128, Error> {
        Self::ensure_open(&env)?;
        from.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        let usdc = Self::usdc(&env)?;
        token::Client::new(&env, &usdc).transfer(
            &from,
            &env.current_contract_address(),
            &amount,
        );
        let deposited: i128 = env
            .storage()
            .instance()
            .get(&DataKey::Deposited)
            .unwrap_or(0);
        let new_total = deposited + amount;
        env.storage().instance().set(&DataKey::Deposited, &new_total);
        env.events()
            .publish((Symbol::new(&env, "deposit"),), amount);
        Ok(new_total)
    }

    /// withdraw_from_vault — owner pulls USDC back out of the vault.
    pub fn withdraw_from_vault(env: Env, amount: i128) -> Result<i128, Error> {
        Self::ensure_open(&env)?;
        let owner = Self::owner(&env)?;
        owner.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        let usdc = Self::usdc(&env)?;
        let client = token::Client::new(&env, &usdc);
        let balance = client.balance(&env.current_contract_address());
        if balance < amount {
            return Err(Error::InsufficientBalance);
        }
        client.transfer(&env.current_contract_address(), &owner, &amount);
        let deposited: i128 = env
            .storage()
            .instance()
            .get(&DataKey::Deposited)
            .unwrap_or(0);
        let remaining = if deposited >= amount { deposited - amount } else { 0 };
        env.storage().instance().set(&DataKey::Deposited, &remaining);
        env.events()
            .publish((Symbol::new(&env, "withdraw"),), amount);
        Ok(remaining)
    }

    /// get_vault_progress — completion in basis points (10000 = 100%).
    pub fn get_vault_progress(env: Env) -> u32 {
        let deposited: i128 = env
            .storage()
            .instance()
            .get(&DataKey::Deposited)
            .unwrap_or(0);
        let target: i128 = env.storage().instance().get(&DataKey::Target).unwrap_or(1);
        if target <= 0 {
            return 0;
        }
        let bps = (deposited.saturating_mul(10_000)) / target;
        if bps > 10_000 {
            10_000
        } else {
            bps as u32
        }
    }

    /// get_vault_balance — current USDC held by the vault.
    pub fn get_vault_balance(env: Env) -> i128 {
        let usdc = match Self::usdc(&env) {
            Ok(u) => u,
            Err(_) => return 0,
        };
        token::Client::new(&env, &usdc).balance(&env.current_contract_address())
    }

    /// close_vault — return all remaining USDC to the owner and lock the vault.
    pub fn close_vault(env: Env) -> Result<i128, Error> {
        Self::ensure_open(&env)?;
        let owner = Self::owner(&env)?;
        owner.require_auth();
        let usdc = Self::usdc(&env)?;
        let client = token::Client::new(&env, &usdc);
        let balance = client.balance(&env.current_contract_address());
        if balance > 0 {
            client.transfer(&env.current_contract_address(), &owner, &balance);
        }
        env.storage().instance().set(&DataKey::Closed, &true);
        env.storage().instance().set(&DataKey::Deposited, &0i128);
        env.events()
            .publish((Symbol::new(&env, "vault_closed"),), balance);
        Ok(balance)
    }

    // ── internal helpers ──────────────────────────────────────────
    fn owner(env: &Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Owner)
            .ok_or(Error::NotInitialized)
    }

    fn usdc(env: &Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Usdc)
            .ok_or(Error::NotInitialized)
    }

    fn ensure_open(env: &Env) -> Result<(), Error> {
        if !env.storage().instance().has(&DataKey::Owner) {
            return Err(Error::NotInitialized);
        }
        let closed: bool = env
            .storage()
            .instance()
            .get(&DataKey::Closed)
            .unwrap_or(false);
        if closed {
            return Err(Error::VaultClosed);
        }
        Ok(())
    }
}

mod test;
