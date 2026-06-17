#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    token::{StellarAssetClient, TokenClient},
    Address, Env, Symbol,
};

#[test]
fn test_automation_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let owner = Address::generate(&env);
    let house_vault = Address::generate(&env);

    let sac = env.register_stellar_asset_contract_v2(owner.clone());
    let usdc_id = sac.address();
    StellarAssetClient::new(&env, &usdc_id).mint(&owner, &10_000_0000000);

    let contract_id = env.register(AutomationContract, ());
    let client = AutomationContractClient::new(&env, &contract_id);
    client.init(&owner, &usdc_id);

    // "Save 10% of every transfer into the house vault"
    let id = Symbol::new(&env, "save10");
    client.create_rule(
        &id,
        &Symbol::new(&env, "on_transfer"),
        &Symbol::new(&env, "save"),
        &house_vault,
        &0,      // percentage-based
        &1_000,  // 10%
    );

    let paid = client.execute_rule(&id, &owner, &1_000_0000000); // base 1,000 USDC
    assert_eq!(paid, 100_0000000); // 10%

    let usdc = TokenClient::new(&env, &usdc_id);
    assert_eq!(usdc.balance(&house_vault), 100_0000000);

    let status = client.get_rule_status(&id);
    assert_eq!(status.run_count, 1);

    client.pause_rule(&id);
    let paused = client.get_rule_status(&id);
    assert_eq!(paused.status, RuleStatus::Paused);

    client.resume_rule(&id);
    let resumed = client.get_rule_status(&id);
    assert_eq!(resumed.status, RuleStatus::Active);
}
