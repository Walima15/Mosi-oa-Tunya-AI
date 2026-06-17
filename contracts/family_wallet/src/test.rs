#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    token::{StellarAssetClient, TokenClient},
    Address, Env, String, Symbol,
};

fn create_usdc(env: &Env, admin: &Address) -> (Address, StellarAssetClient) {
    let contract = env.register_stellar_asset_contract_v2(admin.clone());
    let id = contract.address();
    (id.clone(), StellarAssetClient::new(env, &id))
}

#[test]
fn test_family_wallet_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let owner = Address::generate(&env);
    let mother = Address::generate(&env);

    let (usdc_id, usdc_admin) = create_usdc(&env, &owner);
    usdc_admin.mint(&owner, &10_000_0000000); // 10,000 USDC (7 decimals)

    let contract_id = env.register(FamilyWalletContract, ());
    let client = FamilyWalletContractClient::new(&env, &contract_id);

    client.create_family_wallet(&owner, &usdc_id);
    client.add_family_member(
        &Symbol::new(&env, "mum"),
        &String::from_str(&env, "Grace Mwila"),
        &Symbol::new(&env, "parent"),
        &mother,
        &500_0000000, // 500 USDC monthly
        &true,
    );

    client.allocate_support(&2_000_0000000); // fund reserve with 2,000 USDC
    assert_eq!(client.get_family_balance(), 2_000_0000000);

    let released = client.release_support_payment(&Symbol::new(&env, "mum"));
    assert_eq!(released, 500_0000000);

    let usdc = TokenClient::new(&env, &usdc_id);
    assert_eq!(usdc.balance(&mother), 500_0000000);
    assert_eq!(client.get_family_balance(), 1_500_0000000);

    client.emergency_release(&Symbol::new(&env, "mum"), &250_0000000);
    assert_eq!(usdc.balance(&mother), 750_0000000);
}
