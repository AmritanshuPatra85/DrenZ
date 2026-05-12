-- Seed data for local testing
-- 5 test users (these reference auth.users so we insert into public.users directly)

insert into public.users (id, alias, college, phone, is_verified, rating, total_reviews) values
  ('00000000-0000-0000-0000-000000000001', 'swift_fox_101', 'KIIT', '9876543210', true, 4.5, 10),
  ('00000000-0000-0000-0000-000000000002', 'calm_owl_202', 'KIIT', '9876543211', true, 4.2, 6),
  ('00000000-0000-0000-0000-000000000003', 'bold_bear_303', 'KIIT', '9876543212', false, 0, 0),
  ('00000000-0000-0000-0000-000000000004', 'bright_hawk_404', 'KIIT', '9876543213', true, 3.8, 4),
  ('00000000-0000-0000-0000-000000000005', 'cool_wolf_505', 'KIIT', '9876543214', true, 5.0, 2);

-- 20 test listings
insert into public.listings (id, seller_id, title, description, price, category, condition, college, status) values
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'White Oversized Tee', 'Worn twice, great condition', 299, 'tops', 'like_new', 'KIIT', 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Black Cargo Pants', 'Streetwear style, size M', 599, 'bottoms', 'good', 'KIIT', 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Nike Air Force 1', 'Size 9, minor sole wear', 1899, 'shoes', 'good', 'KIIT', 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Canvas Tote Bag', 'Never used, still has tags', 199, 'bags', 'new', 'KIIT', 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000002', 'Denim Jacket', 'Classic fit, size L', 799, 'tops', 'good', 'KIIT', 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000002', 'Grey Sweatpants', 'Comfortable, size M', 349, 'bottoms', 'like_new', 'KIIT', 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000002', 'Adidas Slides', 'Size 8, light use', 299, 'shoes', 'good', 'KIIT', 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000002', 'Leather Wallet', 'Brown, barely used', 149, 'accessories', 'like_new', 'KIIT', 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000003', 'Striped Polo Shirt', 'Size S, faded slightly', 199, 'tops', 'fair', 'KIIT', 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000003', 'Slim Fit Chinos', 'Khaki, size 30', 449, 'bottoms', 'good', 'KIIT', 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000003', 'Puma Sneakers', 'Size 10, clean', 999, 'shoes', 'like_new', 'KIIT', 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000003', 'Backpack 20L', 'Black, laptop compartment', 599, 'bags', 'good', 'KIIT', 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000004', 'Graphic Tee', 'Band merch, size M', 249, 'tops', 'good', 'KIIT', 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000004', 'Track Pants', 'Navy blue, size L', 299, 'bottoms', 'like_new', 'KIIT', 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000004', 'Formal Shoes', 'Black oxford, size 9', 1299, 'shoes', 'good', 'KIIT', 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000004', 'Sunglasses', 'Aviator style, UV protected', 199, 'accessories', 'new', 'KIIT', 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Hoodie', 'Olive green, size L', 699, 'tops', 'like_new', 'KIIT', 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Joggers', 'Black, size M', 399, 'bottoms', 'good', 'KIIT', 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Crossbody Bag', 'Small, tan color', 449, 'bags', 'like_new', 'KIIT', 'active'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000005', 'Watch', 'Casio digital, works perfectly', 899, 'accessories', 'good', 'KIIT', 'active');

-- 3 test transactions
insert into public.transactions (id, listing_id, buyer_id, seller_id, amount, platform_fee, seller_payout, status, handoff_code) values
  (gen_random_uuid(), null, '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 299, 14.95, 284.05, 'completed', '123456'),
  (gen_random_uuid(), null, '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 599, 29.95, 569.05, 'paid', '234567'),
  (gen_random_uuid(), null, '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 999, 49.95, 949.05, 'pending', '345678');

-- sample messages
insert into public.conversations (id, listing_id, buyer_id, seller_id) values
  ('00000000-0000-0000-0000-000000000010', null, '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001');

insert into public.messages (conversation_id, sender_id, content) values
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002', 'Hey, is this still available?'),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Yes it is! Come check it out on campus.'),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002', 'Great, can we meet tomorrow near the library?');