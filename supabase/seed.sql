-- ════════════════════════════════════════════════════════════════════
-- Mosi-oa-Tunya AI — Seed reference data
-- ════════════════════════════════════════════════════════════════════

insert into exchange_rates (base, quote, rate) values
  ('USD','ZMW', 27.40),
  ('USD','ZAR', 18.20),
  ('USD','BWP', 13.60),
  ('USD','KES', 129.0),
  ('USD','TZS', 2510.0),
  ('ZMW','USD', 0.0365),
  ('ZAR','ZMW', 1.505),
  ('KES','ZMW', 0.2124)
on conflict (base, quote) do update set rate = excluded.rate, fetched_at = now();

insert into investment_products (name, category, description, expected_roi, risk, min_amount, term_months, currency) values
  ('Zambia Govt Bond 2029', 'bonds', 'Sovereign bond, semi-annual coupon.', 14.50, 'conservative', 1000, 36, 'ZMW'),
  ('91-Day Treasury Bill', 't_bills', 'Short-term government paper.', 11.20, 'conservative', 500, 3, 'ZMW'),
  ('AgriYield Maize Fund', 'agriculture', 'Pooled smallholder maize financing.', 19.00, 'growth', 2000, 12, 'ZMW'),
  ('Lusaka REIT', 'real_estate', 'Commercial real-estate income trust.', 16.30, 'balanced', 5000, 24, 'ZMW'),
  ('SME Growth Notes', 'sme', 'Diversified SME working-capital notes.', 22.00, 'aggressive', 3000, 18, 'ZMW')
on conflict do nothing;

insert into schools (name, country, payment_rail, verified) values
  ('University of Zambia', 'Zambia', 'flutterwave', true),
  ('Rhodes Park School', 'Zambia', 'airtel', true),
  ('Copperbelt University', 'Zambia', 'paychangu', true)
on conflict do nothing;
