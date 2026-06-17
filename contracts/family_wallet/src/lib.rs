#![no_std]
//! Family Wallet Contract — Mosi-oa-Tunya AI
//!
//! Manages family allocations using Stellar USDC. A diaspora owner funds the
//! wallet; each member has a monthly support allocation and an optional
//! emergency flag. Support payments transfer real USDC (a Stellar Asset
//! Contract / SAC token) to a member's mapped destination address.
//!
//! USDC is passed as a token contract address (`token::Client`), so this
//! contract moves genuine on-chain stablecoin — not an internal ledger number.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, token, Address, Env, Map, String, Symbol,
    Vec,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    NotAuthorized = 3,
    MemberExists = 4,
    MemberNotFound = 5,
    InsufficientReserve = 6,
    InvalidAmount = 7,
}

#[contracttype]
#[derive(Clone)]
pub struct Member {
    pub id: Symbol,
    pub name: String,
    pub relation: Symbol,
    pub destination: Address,
    pub monthly_support: i128,
    pub emergency_support: bool,
    pub total_released: i128,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Owner,
    Usdc,
    Members,
    Reserve,
    TotalAllocated,
}

#[contract]
pub struct FamilyWalletContract;

#[contractimpl]
impl FamilyWalletContract {
    /// create_family_wallet — initialise the wallet with an owner and the USDC
    /// token contract address used for all support payments.
    pub fn create_family_wallet(env: Env, owner: Address, usdc: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Owner) {
            return Err(Error::AlreadyInitialized);
        }
        owner.require_auth();
        env.storage().instance().set(&DataKey::Owner, &owner);
        env.storage().instance().set(&DataKey::Usdc, &usdc);
        env.storage()
            .instance()
            .set(&DataKey::Members, &Map::<Symbol, Member>::new(&env));
        env.storage().instance().set(&DataKey::Reserve, &0i128);
        env.storage()
            .instance()
            .set(&DataKey::TotalAllocated, &0i128);
        env.events()
            .publish((Symbol::new(&env, "wallet_created"),), owner);
        Ok(())
    }

    /// add_family_member — register a dependent with a monthly USDC allocation.
    pub fn add_family_member(
        env: Env,
        id: Symbol,
        name: String,
        relation: Symbol,
        destination: Address,
        monthly_support: i128,
        emergency_support: bool,
    ) -> Result<(), Error> {
        let owner = Self::owner(&env)?;
        owner.require_auth();
        if monthly_support < 0 {
            return Err(Error::InvalidAmount);
        }
        let mut members = Self::members(&env);
        if members.contains_key(id.clone()) {
            return Err(Error::MemberExists);
        }
        members.set(
            id.clone(),
            Member {
                id: id.clone(),
                name,
                relation,
                destination,
                monthly_support,
                emergency_support,
                total_released: 0,
            },
        );
        env.storage().instance().set(&DataKey::Members, &members);

        let total: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalAllocated)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::TotalAllocated, &(total + monthly_support));

        env.events()
            .publish((Symbol::new(&env, "member_added"),), id);
        Ok(())
    }

    /// allocate_support — top up the wallet's emergency reserve with USDC,
    /// pulled from the owner's account into this contract.
    pub fn allocate_support(env: Env, amount: i128) -> Result<(), Error> {
        let owner = Self::owner(&env)?;
        owner.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        let usdc = Self::usdc(&env)?;
        token::Client::new(&env, &usdc).transfer(
            &owner,
            &env.current_contract_address(),
            &amount,
        );
        let reserve: i128 = env.storage().instance().get(&DataKey::Reserve).unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::Reserve, &(reserve + amount));
        env.events()
            .publish((Symbol::new(&env, "support_allocated"),), amount);
        Ok(())
    }

    /// release_support_payment — send a member's monthly USDC support from the
    /// reserve to their mapped destination address.
    pub fn release_support_payment(env: Env, member_id: Symbol) -> Result<i128, Error> {
        let owner = Self::owner(&env)?;
        owner.require_auth();
        let mut members = Self::members(&env);
        let mut member = members.get(member_id.clone()).ok_or(Error::MemberNotFound)?;
        let amount = member.monthly_support;
        Self::pay(&env, &member.destination, amount)?;

        member.total_released += amount;
        members.set(member_id.clone(), member);
        env.storage().instance().set(&DataKey::Members, &members);
        env.events()
            .publish((Symbol::new(&env, "support_released"), member_id), amount);
        Ok(amount)
    }

    /// emergency_release — release an arbitrary USDC amount to an
    /// emergency-eligible member outside the monthly schedule.
    pub fn emergency_release(
        env: Env,
        member_id: Symbol,
        amount: i128,
    ) -> Result<(), Error> {
        let owner = Self::owner(&env)?;
        owner.require_auth();
        let mut members = Self::members(&env);
        let mut member = members.get(member_id.clone()).ok_or(Error::MemberNotFound)?;
        if !member.emergency_support {
            return Err(Error::NotAuthorized);
        }
        Self::pay(&env, &member.destination, amount)?;
        member.total_released += amount;
        members.set(member_id.clone(), member);
        env.storage().instance().set(&DataKey::Members, &members);
        env.events()
            .publish((Symbol::new(&env, "emergency_release"), member_id), amount);
        Ok(())
    }

    /// get_family_balance — current USDC reserve held by the contract.
    pub fn get_family_balance(env: Env) -> i128 {
        let usdc = match Self::usdc(&env) {
            Ok(u) => u,
            Err(_) => return 0,
        };
        token::Client::new(&env, &usdc).balance(&env.current_contract_address())
    }

    /// list_members — all registered family members.
    pub fn list_members(env: Env) -> Vec<Member> {
        let members = Self::members(&env);
        let mut out = Vec::new(&env);
        for (_, m) in members.iter() {
            out.push_back(m);
        }
        out
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

    fn members(env: &Env) -> Map<Symbol, Member> {
        env.storage()
            .instance()
            .get(&DataKey::Members)
            .unwrap_or_else(|| Map::new(env))
    }

    fn pay(env: &Env, to: &Address, amount: i128) -> Result<(), Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        let usdc = Self::usdc(env)?;
        let client = token::Client::new(env, &usdc);
        let balance = client.balance(&env.current_contract_address());
        if balance < amount {
            return Err(Error::InsufficientReserve);
        }
        client.transfer(&env.current_contract_address(), to, &amount);
        let reserve: i128 = env.storage().instance().get(&DataKey::Reserve).unwrap_or(0);
        let new_reserve = if reserve >= amount { reserve - amount } else { 0 };
        env.storage().instance().set(&DataKey::Reserve, &new_reserve);
        Ok(())
    }
}

mod test;
