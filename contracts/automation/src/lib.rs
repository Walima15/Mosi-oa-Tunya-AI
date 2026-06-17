#![no_std]
//! Automation Contract — Mosi-oa-Tunya AI
//!
//! Stores and executes programmable finance rules ("save 10% of every
//! transfer", "send 500 USDC monthly to mother"). Each rule has a trigger and
//! an action that moves USDC from a funder to a destination when executed.
//! Rules can be paused/resumed and track their run count on-chain.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, token, Address, Env, Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    NotAuthorized = 3,
    RuleNotFound = 4,
    RulePaused = 5,
    InvalidAmount = 6,
}

#[contracttype]
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum RuleStatus {
    Active,
    Paused,
}

#[contracttype]
#[derive(Clone)]
pub struct Rule {
    pub id: Symbol,
    pub trigger: Symbol,     // e.g. "schedule" | "on_transfer" | "rate_target"
    pub action: Symbol,      // e.g. "transfer" | "save" | "convert"
    pub destination: Address,
    pub amount: i128,        // fixed USDC amount (stroops); 0 if percentage-based
    pub bps: u32,            // basis points for percentage rules
    pub status: RuleStatus,
    pub run_count: u32,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Owner,
    Usdc,
    Rule(Symbol),
}

#[contract]
pub struct AutomationContract;

#[contractimpl]
impl AutomationContract {
    pub fn init(env: Env, owner: Address, usdc: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Owner) {
            return Err(Error::AlreadyInitialized);
        }
        owner.require_auth();
        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage().instance().set(&DataKey::Usdc, &usdc);
        Ok(())
    }

    /// create_rule — register a programmable finance rule.
    pub fn create_rule(
        env: Env,
        id: Symbol,
        trigger: Symbol,
        action: Symbol,
        destination: Address,
        amount: i128,
        bps: u32,
    ) -> Result<(), Error> {
        let owner = Self::owner(&env)?;
        owner.require_auth();
        if amount < 0 {
            return Err(Error::InvalidAmount);
        }
        let rule = Rule {
            id: id.clone(),
            trigger,
            action,
            destination,
            amount,
            bps,
            status: RuleStatus::Active,
            run_count: 0,
        };
        env.storage().persistent().set(&DataKey::Rule(id.clone()), &rule);
        env.events()
            .publish((Symbol::new(&env, "rule_created"), id), ());
        Ok(())
    }

    /// pause_rule — temporarily disable a rule.
    pub fn pause_rule(env: Env, id: Symbol) -> Result<(), Error> {
        Self::set_status(&env, id, RuleStatus::Paused, "rule_paused")
    }

    /// resume_rule — re-enable a paused rule.
    pub fn resume_rule(env: Env, id: Symbol) -> Result<(), Error> {
        Self::set_status(&env, id, RuleStatus::Active, "rule_resumed")
    }

    /// execute_rule — run an active rule once, moving USDC for the given base
    /// amount (used by percentage rules) from the funder to the destination.
    pub fn execute_rule(
        env: Env,
        id: Symbol,
        funder: Address,
        base_amount: i128,
    ) -> Result<i128, Error> {
        let owner = Self::owner(&env)?;
        owner.require_auth();
        let mut rule: Rule = env
            .storage()
            .persistent()
            .get(&DataKey::Rule(id.clone()))
            .ok_or(Error::RuleNotFound)?;
        if rule.status != RuleStatus::Active {
            return Err(Error::RulePaused);
        }

        let pay_amount = if rule.amount > 0 {
            rule.amount
        } else {
            (base_amount.saturating_mul(rule.bps as i128)) / 10_000
        };

        if pay_amount > 0 {
            let usdc = Self::usdc(&env)?;
            funder.require_auth();
            token::Client::new(&env, &usdc).transfer(&funder, &rule.destination, &pay_amount);
        }

        rule.run_count += 1;
        env.storage().persistent().set(&DataKey::Rule(id.clone()), &rule);
        env.events()
            .publish((Symbol::new(&env, "rule_executed"), id), pay_amount);
        Ok(pay_amount)
    }

    /// get_rule_status — current status + run count of a rule.
    pub fn get_rule_status(env: Env, id: Symbol) -> Result<Rule, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Rule(id))
            .ok_or(Error::RuleNotFound)
    }

    // ── internal helpers ──────────────────────────────────────────
    fn set_status(
        env: &Env,
        id: Symbol,
        status: RuleStatus,
        event: &str,
    ) -> Result<(), Error> {
        let owner = Self::owner(env)?;
        owner.require_auth();
        let mut rule: Rule = env
            .storage()
            .persistent()
            .get(&DataKey::Rule(id.clone()))
            .ok_or(Error::RuleNotFound)?;
        rule.status = status;
        env.storage().persistent().set(&DataKey::Rule(id.clone()), &rule);
        env.events().publish((Symbol::new(env, event), id), ());
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
