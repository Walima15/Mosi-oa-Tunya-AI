#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    token::{StellarAssetClient, TokenClient},
    Address, Env, String, Symbol,
};

#[test]
fn test_vault_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let owner = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(owner.clone());
    let usdc_id = sac.address();
    StellarAssetClient::new(&env, &usdc_id).mint(&owner, &100_000_0000000);

    let contract_id = env.register(GoalVaultContract, ());
    let client = GoalVaultContractClient::new(&env, &contract_id);

    client.create_goal_vault(
        &owner,
        &usdc_id,
        &String::from_str(&env, "Build a house"),
        &Symbol::new(&env, "house"),
        &10_000_0000000, // 10,000 USDC target
    );

    client.deposit_to_vault(&owner, &2_500_0000000); // 25%
    assert_eq!(client.get_vault_progress(), 2_500);
    assert_eq!(client.get_vault_balance(), 2_500_0000000);

    client.withdraw_from_vault(&500_0000000);
    assert_eq!(client.get_vault_balance(), 2_000_0000000);
    assert_eq!(client.get_vault_progress(), 2_000);

    let returned = client.close_vault();
    assert_eq!(returned, 2_000_0000000);
    let usdc = TokenClient::new(&env, &usdc_id);
    assert_eq!(usdc.balance(&owner), 100_000_0000000);
}
