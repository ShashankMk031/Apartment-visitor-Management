-- Seed Apartment
INSERT INTO public.apartments (id, name, address, created_at)
VALUES ('7b129750-705a-45c1-9d95-8e3ad7bb8fb5', 'Green Glen Heights', '123 Orchard Road, Bellandur, Bangalore - 560103', NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed Admin Profile
-- Note: In a real Supabase database, auth.users must be created first. 
-- These inserts populate the public profiles and dependent tables for demo purposes.
INSERT INTO public.profiles (id, full_name, email, role, created_at)
VALUES 
('d3b07384-d113-4bf4-a5bf-4d80a158b0f1', 'Super Admin', 'admin@example.com', 'ADMIN', NOW()),
('d3b07384-d113-4bf4-a5bf-4d80a158b0f2', 'Guard Bahadur', 'guard1@example.com', 'GUARD', NOW()),
('d3b07384-d113-4bf4-a5bf-4d80a158b0f3', 'Guard Singh', 'guard2@example.com', 'GUARD', NOW()),
('d3b07384-d113-4bf4-a5bf-4d80a158b0f4', 'Guard Patil', 'guard3@example.com', 'GUARD', NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed Guards
INSERT INTO public.security_guards (id, apartment_id, phone, created_at)
VALUES
('d3b07384-d113-4bf4-a5bf-4d80a158b0f2', '7b129750-705a-45c1-9d95-8e3ad7bb8fb5', '+919988776651', NOW()),
('d3b07384-d113-4bf4-a5bf-4d80a158b0f3', '7b129750-705a-45c1-9d95-8e3ad7bb8fb5', '+919988776652', NOW()),
('d3b07384-d113-4bf4-a5bf-4d80a158b0f4', '7b129750-705a-45c1-9d95-8e3ad7bb8fb5', '+919988776653', NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed Residents Profiles
INSERT INTO public.profiles (id, full_name, email, role, created_at)
VALUES
('e0000000-0000-0000-0000-000000000001', 'Amit Sharma', 'resident1@example.com', 'RESIDENT', NOW()),
('e0000000-0000-0000-0000-000000000002', 'Priya Patel', 'resident2@example.com', 'RESIDENT', NOW()),
('e0000000-0000-0000-0000-000000000003', 'Rajesh Kumar', 'resident3@example.com', 'RESIDENT', NOW()),
('e0000000-0000-0000-0000-000000000004', 'Sneha Reddy', 'resident4@example.com', 'RESIDENT', NOW()),
('e0000000-0000-0000-0000-000000000005', 'Vikram Singh', 'resident5@example.com', 'RESIDENT', NOW()),
('e0000000-0000-0000-0000-000000000006', 'Deepa Nair', 'resident6@example.com', 'RESIDENT', NOW()),
('e0000000-0000-0000-0000-000000000007', 'Rohan Mehta', 'resident7@example.com', 'RESIDENT', NOW()),
('e0000000-0000-0000-0000-000000000008', 'Ananya Gupta', 'resident8@example.com', 'RESIDENT', NOW()),
('e0000000-0000-0000-0000-000000000009', 'Sanjay Dutt', 'resident9@example.com', 'RESIDENT', NOW()),
('e0000000-0000-0000-0000-000000000010', 'Kavita Rao', 'resident10@example.com', 'RESIDENT', NOW()),
('e0000000-0000-0000-0000-000000000011', 'Aditya Verma', 'resident11@example.com', 'RESIDENT', NOW()),
('e0000000-0000-0000-0000-000000000012', 'Nehal Jain', 'resident12@example.com', 'RESIDENT', NOW()),
('e0000000-0000-0000-0000-000000000013', 'Sandhya Mishra', 'resident13@example.com', 'RESIDENT', NOW()),
('e0000000-0000-0000-0000-000000000014', 'Arjun Sen', 'resident14@example.com', 'RESIDENT', NOW()),
('e0000000-0000-0000-0000-000000000015', 'Meera Iyer', 'resident15@example.com', 'RESIDENT', NOW()),
('e0000000-0000-0000-0000-000000000016', 'Karthik R', 'resident16@example.com', 'RESIDENT', NOW()),
('e0000000-0000-0000-0000-000000000017', 'Shalini Joy', 'resident17@example.com', 'RESIDENT', NOW()),
('e0000000-0000-0000-0000-000000000018', 'Vijay Mallya', 'resident18@example.com', 'RESIDENT', NOW()),
('e0000000-0000-0000-0000-000000000019', 'Nisha Thomas', 'resident19@example.com', 'RESIDENT', NOW()),
('e0000000-0000-0000-0000-000000000020', 'Rahul Dravid', 'resident20@example.com', 'RESIDENT', NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed Residents Flats
INSERT INTO public.residents (id, apartment_id, flat_number, phone, created_at)
VALUES
('e0000000-0000-0000-0000-000000000001', '7b129750-705a-45c1-9d95-8e3ad7bb8fb5', '101', '+919876543201', NOW()),
('e0000000-0000-0000-0000-000000000002', '7b129750-705a-45c1-9d95-8e3ad7bb8fb5', '102', '+919876543202', NOW()),
('e0000000-0000-0000-0000-000000000003', '7b129750-705a-45c1-9d95-8e3ad7bb8fb5', '103', '+919876543203', NOW()),
('e0000000-0000-0000-0000-000000000004', '7b129750-705a-45c1-9d95-8e3ad7bb8fb5', '104', '+919876543204', NOW()),
('e0000000-0000-0000-0000-000000000005', '7b129750-705a-45c1-9d95-8e3ad7bb8fb5', '201', '+919876543205', NOW()),
('e0000000-0000-0000-0000-000000000006', '7b129750-705a-45c1-9d95-8e3ad7bb8fb5', '202', '+919876543206', NOW()),
('e0000000-0000-0000-0000-000000000007', '7b129750-705a-45c1-9d95-8e3ad7bb8fb5', '203', '+919876543207', NOW()),
('e0000000-0000-0000-0000-000000000008', '7b129750-705a-45c1-9d95-8e3ad7bb8fb5', '204', '+919876543208', NOW()),
('e0000000-0000-0000-0000-000000000009', '7b129750-705a-45c1-9d95-8e3ad7bb8fb5', '301', '+919876543209', NOW()),
('e0000000-0000-0000-0000-000000000010', '7b129750-705a-45c1-9d95-8e3ad7bb8fb5', '302', '+919876543210', NOW()),
('e0000000-0000-0000-0000-000000000011', '7b129750-705a-45c1-9d95-8e3ad7bb8fb5', '303', '+919876543211', NOW()),
('e0000000-0000-0000-0000-000000000012', '7b129750-705a-45c1-9d95-8e3ad7bb8fb5', '304', '+919876543212', NOW()),
('e0000000-0000-0000-0000-000000000013', '7b129750-705a-45c1-9d95-8e3ad7bb8fb5', '401', '+919876543213', NOW()),
('e0000000-0000-0000-0000-000000000014', '7b129750-705a-45c1-9d95-8e3ad7bb8fb5', '402', '+919876543214', NOW()),
('e0000000-0000-0000-0000-000000000015', '7b129750-705a-45c1-9d95-8e3ad7bb8fb5', '403', '+919876543215', NOW()),
('e0000000-0000-0000-0000-000000000016', '7b129750-705a-45c1-9d95-8e3ad7bb8fb5', '404', '+919876543216', NOW()),
('e0000000-0000-0000-0000-000000000017', '7b129750-705a-45c1-9d95-8e3ad7bb8fb5', '501', '+919876543217', NOW()),
('e0000000-0000-0000-0000-000000000018', '7b129750-705a-45c1-9d95-8e3ad7bb8fb5', '502', '+919876543218', NOW()),
('e0000000-0000-0000-0000-000000000019', '7b129750-705a-45c1-9d95-8e3ad7bb8fb5', '503', '+919876543219', NOW()),
('e0000000-0000-0000-0000-000000000020', '7b129750-705a-45c1-9d95-8e3ad7bb8fb5', '504', '+919876543220', NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed Visitor Requests and Entries (Sample insert of 10)
-- For full 100 records, the SQL script can be populated programmatically or copy-pasted.
-- Below is a sample block that establishes base records.
INSERT INTO public.visitor_requests (id, resident_id, visitor_name, visitor_phone, visitor_type, purpose, vehicle_number, number_of_visitors, expected_duration, status, approval_time, qr_code_pass, created_at)
VALUES
('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Ramesh Babu', '+919123456001', 'GUEST', 'Social Visit', 'KA-03-MY-1234', 2, 120, 'APPROVED', NOW() - INTERVAL '1 hour', 'PASS-f0001', NOW() - INTERVAL '1 hour 10 minutes'),
('f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002', 'Zomato Rider', '+919123456002', 'DELIVERY', 'Food Delivery', NULL, 1, 30, 'APPROVED', NOW() - INTERVAL '40 minutes', 'PASS-f0002', NOW() - INTERVAL '45 minutes'),
('f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000003', 'Swiggy Delivery', '+919123456003', 'DELIVERY', 'Package Drop', NULL, 1, 30, 'APPROVED', NOW() - INTERVAL '30 minutes', 'PASS-f0003', NOW() - INTERVAL '35 minutes'),
('f0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000004', 'Electrician Bob', '+919123456004', 'MAINTENANCE', 'AC repair', 'KA-01-XX-9876', 1, 90, 'APPROVED', NOW() - INTERVAL '2 hours', 'PASS-f0004', NOW() - INTERVAL '2 hours 10 minutes'),
('f0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000005', 'Anita Sen', '+919123456005', 'FAMILY', 'Guest stay', NULL, 1, 240, 'APPROVED', NOW() - INTERVAL '3 hours', 'PASS-f0005', NOW() - INTERVAL '3 hours 10 minutes'),
('f0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000006', 'Dunzo Runner', '+919123456006', 'DELIVERY', 'Dunzo drop', NULL, 1, 30, 'PENDING', NULL, NULL, NOW() - INTERVAL '5 minutes'),
('f0000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000007', 'DHL Courier', '+919123456007', 'DELIVERY', 'Document courier', NULL, 1, 30, 'REJECTED', NOW() - INTERVAL '15 minutes', NULL, NOW() - INTERVAL '20 minutes')
ON CONFLICT (id) DO NOTHING;

-- Seed Visitor Entries
INSERT INTO public.visitor_entries (id, visitor_request_id, entry_time, exit_time, entered_by_guard, exited_by_guard)
VALUES
('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '50 minutes', NOW() - INTERVAL '10 minutes', 'd3b07384-d113-4bf4-a5bf-4d80a158b0f2', 'd3b07384-d113-4bf4-a5bf-4d80a158b0f2'),
('a0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '35 minutes', NOW() - INTERVAL '5 minutes', 'd3b07384-d113-4bf4-a5bf-4d80a158b0f2', 'd3b07384-d113-4bf4-a5bf-4d80a158b0f2'),
('a0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000003', NOW() - INTERVAL '25 minutes', NULL, 'd3b07384-d113-4bf4-a5bf-4d80a158b0f2', NULL),
('a0000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000004', NOW() - INTERVAL '1 hour 45 minutes', NOW() - INTERVAL '1 hour', 'd3b07384-d113-4bf4-a5bf-4d80a158b0f2', 'd3b07384-d113-4bf4-a5bf-4d80a158b0f2'),
('a0000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000005', NOW() - INTERVAL '2 hours 45 minutes', NULL, 'd3b07384-d113-4bf4-a5bf-4d80a158b0f2', NULL)
ON CONFLICT (id) DO NOTHING;

-- Seed notifications
INSERT INTO public.notifications (recipient_id, title, message, read, created_at)
VALUES
('e0000000-0000-0000-0000-000000000006', 'New Visitor Request', 'Dunzo Runner is waiting at the gate check-in.', FALSE, NOW() - INTERVAL '5 minutes')
ON CONFLICT (id) DO NOTHING;

-- Seed Frequent Visitors
INSERT INTO public.frequent_visitors (id, resident_id, full_name, phone, category, notes, qr_code, is_active, created_at)
VALUES
('b0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Raju Milkman', '+919988770011', 'COOK', 'Comes daily in the morning at 7 AM', 'FREQ-MILK-101-9988', TRUE, NOW() - INTERVAL '15 days'),
('b0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'Shanti Maid', '+919988770022', 'MAID', 'Comes in the afternoon at 2 PM', 'FREQ-MAID-101-7766', TRUE, NOW() - INTERVAL '15 days'),
('b0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000002', 'Ramesh Driver', '+919988770033', 'DRIVER', 'Sunday driver', 'FREQ-DRIV-102-5544', TRUE, NOW() - INTERVAL '10 days'),
('b0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000006', 'Lata Cook', '+919988770044', 'COOK', 'Cooks dinner daily', 'FREQ-COOK-201-1122', FALSE, NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- Seed Blacklisted Visitors
INSERT INTO public.blacklisted_visitors (id, full_name, phone, reason, created_by, created_at)
VALUES
('c0000000-0000-0000-0000-000000000001', 'Scammer Joe', '+919000000000', 'Suspicious marketing activities inside the building', 'd3b07384-d113-4bf4-a5bf-4d80a158b0f1', NOW() - INTERVAL '20 days'),
('c0000000-0000-0000-0000-000000000002', 'Rude Delivery Rider', '+919111111111', 'Altercation with guards at the main gate', 'd3b07384-d113-4bf4-a5bf-4d80a158b0f1', NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- Seed Emergency Alerts
INSERT INTO public.emergency_alerts (id, resident_id, alert_type, status, resolved_by, resolved_at, created_at)
VALUES
('d0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'MEDICAL', 'RESOLVED', 'd3b07384-d113-4bf4-a5bf-4d80a158b0f2', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day 30 minutes')
ON CONFLICT (id) DO NOTHING;
