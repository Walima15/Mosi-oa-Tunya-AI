#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    token::{StellarAssetClient, TokenClient},
    Address, Env, Symbol, Vec,
};

#[test]
fn test_split_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let owner = Address::generate(&env);
    let mother = Address::generate(&env);
    let school = Address::generate(&env);
    let emergency = Address::generate(&env);
    let house = Address::generate(&env);

    let sac = env.register_stellar_asset_contract_v2(owner.clone());
    let usdc_id = sac.address();
    StellarAssetClient::new(&env, &usdc_id).mint(&owner, &1_000_0000000);

    let contract_id = env.register(SplitPaymentContract, ());
    let client = SplitPaymentContractClient::new(&env, &contract_id);
    client.init(&owner, &usdc_id);

    let mut legs = Vec::new(&env);
    legs.push_back(Leg { label: Symbol::new(&env, "mother"), destination: mother.clone(), bps: 6_000 });
    legs.push_back(Leg { label: Symbol::new(&env, "school"), destination: school.clone(), bps: 2_000 });
    legs.push_back(Leg { label: Symbol::new(&env, "emerg"), destination: emergency.clone(), bps: 1_000 });
    legs.push_back(Leg { label: Symbol::new(&env, "house"), destination: house.clone(), bps: 1_000 });
    client.create_split_rule(&legs);

    let amounts = client.execute_split_payment(&owner, &300_0000000); // 300 USDC
    assert_eq!(amounts.len(), 4);

    let usdc = TokenClient::new(&env, &usdc_id);
    assert_eq!(usdc.balance(&mother), 180_0000000); // 60%
    assert_eq!(usdc.balance(&school), 60_0000000); // 20%
    assert_eq!(usdc.balance(&emergency), 30_0000000); // 10%
    assert_eq!(usdc.balance(&house), 30_0000000); // 10%

    assert_eq!(client.get_split_history().len(), 1);
}
