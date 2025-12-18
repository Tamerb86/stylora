-- Insert tenant if not exists
INSERT INTO tenants (id, name, email, phone, address, created_at)
VALUES ('tamerb86@gmail.com', 'Tamer Salon', 'tamerb86@gmail.com', '+47 123 45 678', 'Oslo, Norway', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert services
INSERT INTO services (tenant_id, name, description, price, duration_minutes, is_active, created_at)
VALUES 
  ('tamerb86@gmail.com', 'Herreklipp', 'Profesjonell herreklipp med styling', '299', 30, true, NOW()),
  ('tamerb86@gmail.com', 'Skjeggstell', 'Skjeggtrimming og styling', '199', 20, true, NOW()),
  ('tamerb86@gmail.com', 'Hårfarge', 'Profesjonell hårfarge', '599', 90, true, NOW())
ON CONFLICT DO NOTHING;

-- Insert employee
INSERT INTO employees (tenant_id, name, email, phone, is_active, created_at)
VALUES ('tamerb86@gmail.com', 'Tamer', 'tamerb86@gmail.com', '+47 123 45 678', true, NOW())
ON CONFLICT DO NOTHING;
