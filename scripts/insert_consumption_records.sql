-- Insert 20 consumption records with varying dates, quantities, and items
-- This script will create sample data for testing the reports page

-- Sealant consumption records
INSERT INTO consumption_records (id, created_at, updated_at, inventory_item_id, user_id, quantity, unit, notes, recorded_at)
VALUES 
  (uuid_generate_v4(), NOW(), NOW(), '90115a36-4af0-4b85-8557-9b46e26c448a', '8d6cc443-19ef-4dd7-a3ea-9f8241fc8631', 0.5, 'kg', 'Used for wing repair', NOW() - INTERVAL '1 day'),
  (uuid_generate_v4(), NOW(), NOW(), '90115a36-4af0-4b85-8557-9b46e26c448a', '4feea842-d51f-49c1-8843-b1421336ca04', 0.3, 'kg', 'Used for door seal', NOW() - INTERVAL '3 days'),
  (uuid_generate_v4(), NOW(), NOW(), 'ae4b0c66-ce1e-4b9d-b042-716de1e79057', 'a7e401be-685a-4186-a59f-4b60405f81e2', 0.7, 'kg', 'Used for window repair', NOW() - INTERVAL '5 days'),
  (uuid_generate_v4(), NOW(), NOW(), 'a2f890b9-426f-431d-8350-f30441994ac1', '8d6cc443-19ef-4dd7-a3ea-9f8241fc8631', 0.4, 'kg', 'Used for fuselage repair', NOW() - INTERVAL '7 days'),
  (uuid_generate_v4(), NOW(), NOW(), '65d610da-bb45-4e44-b788-1b173d99229e', '4feea842-d51f-49c1-8843-b1421336ca04', 0.6, 'kg', 'Used for engine mount', NOW() - INTERVAL '10 days');

-- Paint consumption records
INSERT INTO consumption_records (id, created_at, updated_at, inventory_item_id, user_id, quantity, unit, notes, recorded_at)
VALUES 
  (uuid_generate_v4(), NOW(), NOW(), 'f44c7cba-ce5d-49e0-a7e9-a646c001a388', '8d6cc443-19ef-4dd7-a3ea-9f8241fc8631', 2.5, 'L', 'Used for wing repainting', NOW() - INTERVAL '2 days'),
  (uuid_generate_v4(), NOW(), NOW(), 'f44c7cba-ce5d-49e0-a7e9-a646c001a388', 'a7e401be-685a-4186-a59f-4b60405f81e2', 1.8, 'L', 'Used for door repainting', NOW() - INTERVAL '4 days'),
  (uuid_generate_v4(), NOW(), NOW(), 'f44c7cba-ce5d-49e0-a7e9-a646c001a388', '4feea842-d51f-49c1-8843-b1421336ca04', 3.2, 'L', 'Used for fuselage repainting', NOW() - INTERVAL '8 days'),
  (uuid_generate_v4(), NOW(), NOW(), 'f44c7cba-ce5d-49e0-a7e9-a646c001a388', '8d6cc443-19ef-4dd7-a3ea-9f8241fc8631', 1.5, 'L', 'Used for tail repainting', NOW() - INTERVAL '12 days'),
  (uuid_generate_v4(), NOW(), NOW(), 'f44c7cba-ce5d-49e0-a7e9-a646c001a388', 'a7e401be-685a-4186-a59f-4b60405f81e2', 2.0, 'L', 'Used for cockpit repainting', NOW() - INTERVAL '15 days');

-- Oil consumption records
INSERT INTO consumption_records (id, created_at, updated_at, inventory_item_id, user_id, quantity, unit, notes, recorded_at)
VALUES 
  (uuid_generate_v4(), NOW(), NOW(), '04dec04b-1a1b-4d28-8bb4-6e7130c53d79', '8d6cc443-19ef-4dd7-a3ea-9f8241fc8631', 5.0, 'L', 'Engine oil change', NOW() - INTERVAL '1 day'),
  (uuid_generate_v4(), NOW(), NOW(), '79840655-850a-49bc-aa03-02673802d1e0', '4feea842-d51f-49c1-8843-b1421336ca04', 4.5, 'L', 'Engine oil top-up', NOW() - INTERVAL '6 days'),
  (uuid_generate_v4(), NOW(), NOW(), 'eebda1d1-9aa5-4ee0-af9c-55352d9641c0', 'a7e401be-685a-4186-a59f-4b60405f81e2', 3.8, 'L', 'APU oil change', NOW() - INTERVAL '9 days'),
  (uuid_generate_v4(), NOW(), NOW(), '457fc368-d76e-4ab6-a782-0d2fb1bdb04b', '8d6cc443-19ef-4dd7-a3ea-9f8241fc8631', 2.5, 'L', 'Hydraulic system oil', NOW() - INTERVAL '11 days'),
  (uuid_generate_v4(), NOW(), NOW(), '9f4c0321-a295-4ac8-932a-5135c129cf3d', '4feea842-d51f-49c1-8843-b1421336ca04', 3.0, 'L', 'Landing gear oil', NOW() - INTERVAL '14 days');

-- Previous month consumption records
INSERT INTO consumption_records (id, created_at, updated_at, inventory_item_id, user_id, quantity, unit, notes, recorded_at)
VALUES 
  (uuid_generate_v4(), NOW(), NOW(), '90115a36-4af0-4b85-8557-9b46e26c448a', '8d6cc443-19ef-4dd7-a3ea-9f8241fc8631', 0.8, 'kg', 'Used for emergency repair', NOW() - INTERVAL '30 days'),
  (uuid_generate_v4(), NOW(), NOW(), 'f44c7cba-ce5d-49e0-a7e9-a646c001a388', 'a7e401be-685a-4186-a59f-4b60405f81e2', 2.7, 'L', 'Used for complete repainting', NOW() - INTERVAL '35 days'),
  (uuid_generate_v4(), NOW(), NOW(), '04dec04b-1a1b-4d28-8bb4-6e7130c53d79', '4feea842-d51f-49c1-8843-b1421336ca04', 4.2, 'L', 'Engine maintenance', NOW() - INTERVAL '40 days'),
  (uuid_generate_v4(), NOW(), NOW(), 'ae4b0c66-ce1e-4b9d-b042-716de1e79057', '8d6cc443-19ef-4dd7-a3ea-9f8241fc8631', 0.9, 'kg', 'Used for cabin repair', NOW() - INTERVAL '45 days'),
  (uuid_generate_v4(), NOW(), NOW(), '79840655-850a-49bc-aa03-02673802d1e0', 'a7e401be-685a-4186-a59f-4b60405f81e2', 3.5, 'L', 'Engine overhaul', NOW() - INTERVAL '50 days');
