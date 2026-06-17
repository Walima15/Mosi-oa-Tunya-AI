#![no_std]
//! Split Payment Contract — Mosi-oa-Tunya AI
//!
//! Splits a single USDC payment across multiple Stellar destinations by
//! percentage (basis points). One on-chain instruction fans value out to
//! family members, goal vaults and bills — each leg is a real USDC transfer
//! and is recorded in the split history.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, token, Address, Env, Symbol, Vec,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    NotAuthorized = 3,
    InvalidPercentages = 4,
    InvalidAmount = 5,
    NoRule = 6,
}

#[contracttype]
#[derive(Clone)]
pub struct Leg {
    pub label: Symbol,
    pub destination: Address,
    pub bps: u32, // basis points of the total (sum must equal 10_000)
}

#[contracttype]
#[derive(Clone)]
pub struct SplitRecord {
    pub total: i128,
    pub legs: u32,
    pub ledger: u32,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Owner,
    Usdc,
    Rule,
    History,
}

#[contract]
pub struct SplitPaymentContract;

#[contractimpl]
impl SplitPaymentContract {
    pub fn init(env: Env, owner: Address, usdc: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Owner) {
            return Err(Error::AlreadyInitialized);
        }
        owner.require_auth();
        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage().instance().set(&DataKey::Usdc, &usdc);
        env.storage()
            .instance()
            .set(&DataKey::History, &Vec::<SplitRecord>::new(&env));
        Ok(())
    }

    /// create_split_rule — store the destination legs and their percentages.
    pub fn create_split_rule(env: Env, legs: Vec<Leg>) -> Result<(), Error> {
        let owner = Self::owner(&env)?;
        owner.require_auth();
        Self::validate(&legs)?;
        env.storage().instance().set(&DataKey::Rule, &legs);
        env.events()
            .publish((Symbol::new(&env, "rule_created"),), legs.len());
        Ok(())
    }

    /// update_split_percentages — replace the legs of the active rule.
    pub fn update_split_percentages(env: Env, legs: Vec<Leg>) -> Result<(), Error> {
        let owner = Self::owner(&env)?;
        owner.require_auth();
        if !env.storage().instance().has(&DataKey::Rule) {
            return Err(Error::NoRule);
        }
        Self::validate(&legs)?;
        env.storage().instance().set(&DataKey::Rule, &legs);
        env.events()
            .publish((Symbol::new(&env, "rule_updated"),), legs.len());
        Ok(())
    }

    /// execute_split_payment — pull `total` USDC from the funder and distribute
    /// it across the rule's legs by basis points in a single transaction.
    pub fn execute_split_payment(
        env: Env,
        funder: Address,
        total: i128,
    ) -> Result<Vec<i128>, Error> {
        Self::owner(&env)?;
        funder.require_auth();
        if total <= 0 {
            return Err(Error::InvalidAmount);
        }
        let legs: Vec<Leg> = env
            .storage()
            .instance()
            .get(&DataKey::Rule)
            .ok_or(Error::NoRule)?;

        let usdc = Self::usdc(&env)?;
        let client = token::Client::new(&env, &usdc);

        let mut amounts = Vec::new(&env);
        let mut distributed: i128 = 0;
        let n = legs.len();
        for (i, leg) in legs.iter().enumerate() {
            // last leg absorbs rounding dust so the full total is sent
            let amount = if i as u32 == n - 1 {
                total - distributed
            } else {
                (total.saturating_mul(leg.bps as i128)) / 10_000
            };
            distributed += amount;
            client.transfer(&funder, &leg.destination, &amount);
            amounts.push_back(amount);
            env.events()
                .publish((Symbol::new(&env, "leg_paid"), leg.label.clone()), amount);
        }

        let mut history: Vec<SplitRecord> = env
            .storage()
            .instance()
            .get(&DataKey::History)
            .unwrap_or_else(|| Vec::new(&env));
        history.push_back(SplitRecord {
            total,
            legs: n,
            ledger: env.ledger().sequence(),
        });
        env.storage().instance().set(&DataKey::History, &history);
        env.events()
            .publish((Symbol::new(&env, "split_executed"),), total);
        Ok(amounts)
    }

    /// get_split_history — past split executions.
    pub fn get_split_history(env: Env) -> Vec<SplitRecord> {
        env.storage()
            .instance()
            .get(&DataKey::History)
            .unwrap_or_else(|| Vec::new(&env))
    }

    // ── internal helpers ──────────────────────────────────────────
    fn validate(legs: &Vec<Leg>) -> Result<(), Error> {
        if legs.is_empty() {
            return Err(Error::InvalidPercentages);
        }
        let mut sum: u32 = 0;
        for leg in legs.iter() {
            sum += leg.bps;
        }
        if sum != 10_000 {
            return Err(Error::InvalidPercentages);
        }
        Ok(())
    }

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
}

mod test;
