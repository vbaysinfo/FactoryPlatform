-- ============================================================
-- FULL RESET & RECREATE - ModularPro Factory Platform
-- WARNING: Drops all existing data. Run only during setup.
-- ============================================================

-- Drop all tables in reverse FK order
DROP TABLE IF EXISTS design_files CASCADE;
DROP TABLE IF EXISTS maintenance_logs CASCADE;
DROP TABLE IF EXISTS machines CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS dispatch_items CASCADE;
DROP TABLE IF EXISTS dispatch_orders CASCADE;
DROP TABLE IF EXISTS inventory_transactions CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS inventory_categories CASCADE;
DROP TABLE IF EXISTS hardware_items CASCADE;
DROP TABLE IF EXISTS cut_list_panels CASCADE;
DROP TABLE IF EXISTS cut_list_revisions CASCADE;
DROP TABLE IF EXISTS production_stage_logs CASCADE;
DROP TABLE IF EXISTS production_stages_config CASCADE;
DROP TABLE IF EXISTS production_jobs CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS units CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS quotation_line_items CASCADE;
DROP TABLE IF EXISTS quotations CASCADE;
DROP TABLE IF EXISTS invoice_line_items CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- ── Tenants ────────────────────────────────────────────────
CREATE TABLE tenants (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_name        TEXT NOT NULL,
  owner_name          TEXT NOT NULL,
  owner_email         TEXT NOT NULL UNIQUE,
  owner_phone         TEXT,
  address             TEXT,
  gst_number          TEXT,
  plan                TEXT NOT NULL DEFAULT 'basic',
  subscription_status TEXT NOT NULL DEFAULT 'trial',
  trial_end           DATE,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  logo_url            TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "full access tenants" ON tenants USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Users ──────────────────────────────────────────────────
CREATE TABLE users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id          UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id             UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  email                 TEXT NOT NULL UNIQUE,
  phone                 TEXT,
  role                  TEXT NOT NULL DEFAULT 'staff',
  is_active             BOOLEAN NOT NULL DEFAULT true,
  must_change_password  BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "full access users" ON users USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Clients ────────────────────────────────────────────────
CREATE TABLE clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  contact_person  TEXT,
  phone           TEXT,
  email           TEXT,
  address         TEXT,
  city            TEXT,
  state           TEXT,
  pincode         TEXT,
  pan_number      TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "full access clients" ON clients USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Projects ───────────────────────────────────────────────
CREATE TABLE projects (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID REFERENCES tenants(id) ON DELETE CASCADE,
  client_id           UUID REFERENCES clients(id),
  name                TEXT NOT NULL,
  project_type        TEXT DEFAULT 'home',
  status              TEXT NOT NULL DEFAULT 'inquiry',
  site_address        TEXT,
  start_date          DATE,
  expected_completion DATE,
  total_value         NUMERIC(14,2),
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "full access projects" ON projects USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Rooms ──────────────────────────────────────────────────
CREATE TABLE rooms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  room_name   TEXT NOT NULL,
  room_type   TEXT DEFAULT 'bedroom',
  status      TEXT DEFAULT 'pending',
  sort_order  INT DEFAULT 0,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "full access rooms" ON rooms USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Units (furniture items per room) ───────────────────────
CREATE TABLE units (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  room_id     UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  unit_type   TEXT DEFAULT 'wardrobe',
  width_mm    NUMERIC(10,2),
  height_mm   NUMERIC(10,2),
  depth_mm    NUMERIC(10,2),
  quantity    INT DEFAULT 1,
  material    TEXT,
  finish      TEXT,
  unit_cost   NUMERIC(14,2) DEFAULT 0,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "full access units" ON units USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Quotations ─────────────────────────────────────────────
CREATE TABLE quotations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID REFERENCES tenants(id) ON DELETE CASCADE,
  project_id       UUID REFERENCES projects(id),
  quotation_number TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'draft',
  subtotal         NUMERIC(14,2) DEFAULT 0,
  discount_pct     NUMERIC(5,2) DEFAULT 0,
  tax_pct          NUMERIC(5,2) DEFAULT 18,
  tax_amount       NUMERIC(14,2) DEFAULT 0,
  total_amount     NUMERIC(14,2) DEFAULT 0,
  notes            TEXT,
  valid_until      DATE,
  sent_at          TIMESTAMPTZ,
  accepted_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "full access quotations" ON quotations USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Quotation Line Items ────────────────────────────────────
CREATE TABLE quotation_line_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  tenant_id    UUID REFERENCES tenants(id) ON DELETE CASCADE,
  description  TEXT NOT NULL,
  unit         TEXT,
  quantity     NUMERIC(10,2) DEFAULT 1,
  unit_price   NUMERIC(14,2) DEFAULT 0,
  total        NUMERIC(14,2) DEFAULT 0,
  sort_order   INT DEFAULT 0
);
ALTER TABLE quotation_line_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "full access quotation_line_items" ON quotation_line_items USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Invoices ───────────────────────────────────────────────
CREATE TABLE invoices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID REFERENCES tenants(id) ON DELETE CASCADE,
  project_id     UUID REFERENCES projects(id),
  client_id      UUID REFERENCES clients(id),
  invoice_number TEXT NOT NULL,
  invoice_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date       DATE,
  subtotal       NUMERIC(14,2) DEFAULT 0,
  tax_amount     NUMERIC(14,2) DEFAULT 0,
  total_amount   NUMERIC(14,2) DEFAULT 0,
  grand_total    NUMERIC(14,2) DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "full access invoices" ON invoices USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Invoice Line Items ─────────────────────────────────────
CREATE TABLE invoice_line_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity    NUMERIC(10,2) DEFAULT 1,
  unit_price  NUMERIC(14,2) DEFAULT 0,
  total_price NUMERIC(14,2) DEFAULT 0
);
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "full access invoice_line_items" ON invoice_line_items USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Payments ───────────────────────────────────────────────
CREATE TABLE payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id     UUID REFERENCES invoices(id),
  client_id      UUID REFERENCES clients(id),
  amount         NUMERIC(14,2) NOT NULL,
  payment_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  reference      TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "full access payments" ON payments USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Employees ──────────────────────────────────────────────
CREATE TABLE employees (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  emp_code    TEXT,
  role        TEXT,
  department  TEXT,
  phone       TEXT,
  email       TEXT,
  salary      NUMERIC(12,2),
  join_date   DATE,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "full access employees" ON employees USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Attendance ─────────────────────────────────────────────
CREATE TABLE attendance (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  status      TEXT NOT NULL DEFAULT 'present',
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "full access attendance" ON attendance USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Production Jobs ────────────────────────────────────────
CREATE TABLE production_jobs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID REFERENCES tenants(id) ON DELETE CASCADE,
  project_id     UUID REFERENCES projects(id),
  room_id        UUID REFERENCES rooms(id),
  title          TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending',
  priority       TEXT DEFAULT 'medium',
  assigned_to    UUID REFERENCES employees(id),
  start_date     DATE,
  due_date       DATE,
  completed_date DATE,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE production_jobs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "full access production_jobs" ON production_jobs USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Production Stages Config ───────────────────────────────
CREATE TABLE production_stages_config (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  stage_name  TEXT NOT NULL,
  stage_code  TEXT,
  sort_order  INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  color       TEXT DEFAULT '#3b82f6'
);
ALTER TABLE production_stages_config ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "full access production_stages_config" ON production_stages_config USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Production Stage Logs ──────────────────────────────────
CREATE TABLE production_stage_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID REFERENCES tenants(id) ON DELETE CASCADE,
  job_id     UUID NOT NULL REFERENCES production_jobs(id) ON DELETE CASCADE,
  stage      TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending',
  notes      TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE production_stage_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "full access production_stage_logs" ON production_stage_logs USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Cut List Revisions ─────────────────────────────────────
CREATE TABLE cut_list_revisions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
  project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
  room_id         UUID REFERENCES rooms(id) ON DELETE CASCADE,
  revision_number INT NOT NULL DEFAULT 1,
  status          TEXT NOT NULL DEFAULT 'draft',
  notes           TEXT,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE cut_list_revisions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "full access cut_list_revisions" ON cut_list_revisions USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Cut List Panels ────────────────────────────────────────
CREATE TABLE cut_list_panels (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id     UUID NOT NULL REFERENCES cut_list_revisions(id) ON DELETE CASCADE,
  tenant_id       UUID REFERENCES tenants(id) ON DELETE CASCADE,
  panel_label     TEXT NOT NULL,
  category        TEXT DEFAULT 'carcass',
  material        TEXT,
  finish          TEXT,
  grain_direction TEXT DEFAULT 'length',
  length_mm       NUMERIC(10,2),
  width_mm        NUMERIC(10,2),
  thickness_mm    NUMERIC(10,2) DEFAULT 18,
  quantity        INT DEFAULT 1,
  edge_band_top   BOOLEAN DEFAULT false,
  edge_band_bottom BOOLEAN DEFAULT false,
  edge_band_left  BOOLEAN DEFAULT false,
  edge_band_right BOOLEAN DEFAULT false,
  edge_band_type  TEXT,
  sort_order      INT DEFAULT 0,
  notes           TEXT
);
ALTER TABLE cut_list_panels ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "full access cut_list_panels" ON cut_list_panels USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Hardware Items ─────────────────────────────────────────
CREATE TABLE hardware_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  project_id  UUID REFERENCES projects(id),
  room_id     UUID REFERENCES rooms(id),
  name        TEXT NOT NULL,
  category    TEXT,
  brand       TEXT,
  quantity    NUMERIC(10,2) DEFAULT 0,
  unit        TEXT,
  unit_price  NUMERIC(14,2) DEFAULT 0,
  total_price NUMERIC(14,2) DEFAULT 0,
  status      TEXT DEFAULT 'pending',
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE hardware_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "full access hardware_items" ON hardware_items USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Inventory Categories ───────────────────────────────────
CREATE TABLE inventory_categories (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  type      TEXT DEFAULT 'material',
  unit      TEXT
);
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "full access inventory_categories" ON inventory_categories USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Inventory Items ────────────────────────────────────────
CREATE TABLE inventory_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
  category_id   UUID REFERENCES inventory_categories(id),
  name          TEXT NOT NULL,
  sku           TEXT,
  current_stock NUMERIC(12,2) DEFAULT 0,
  reorder_level NUMERIC(12,2) DEFAULT 0,
  unit          TEXT,
  unit_cost     NUMERIC(14,2) DEFAULT 0,
  supplier      TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "full access inventory_items" ON inventory_items USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Inventory Transactions ─────────────────────────────────
CREATE TABLE inventory_transactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID REFERENCES tenants(id) ON DELETE CASCADE,
  item_id    UUID NOT NULL REFERENCES inventory_items(id),
  type       TEXT NOT NULL,
  quantity   NUMERIC(12,2) NOT NULL,
  reference  TEXT,
  notes      TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "full access inventory_transactions" ON inventory_transactions USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Dispatch Orders ────────────────────────────────────────
CREATE TABLE dispatch_orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,
  project_id    UUID REFERENCES projects(id),
  dispatch_date DATE,
  status        TEXT NOT NULL DEFAULT 'pending',
  vehicle_no    TEXT,
  driver_name   TEXT,
  driver_phone  TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE dispatch_orders ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "full access dispatch_orders" ON dispatch_orders USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Dispatch Items ─────────────────────────────────────────
CREATE TABLE dispatch_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_id UUID NOT NULL REFERENCES dispatch_orders(id) ON DELETE CASCADE,
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity    INT DEFAULT 1,
  notes       TEXT
);
ALTER TABLE dispatch_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "full access dispatch_items" ON dispatch_items USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Expenses ───────────────────────────────────────────────
CREATE TABLE expenses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID REFERENCES tenants(id) ON DELETE CASCADE,
  category     TEXT,
  description  TEXT NOT NULL,
  amount       NUMERIC(14,2) NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  paid_by      TEXT,
  reference    TEXT,
  project_id   UUID REFERENCES projects(id),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "full access expenses" ON expenses USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Machines ───────────────────────────────────────────────
CREATE TABLE machines (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  model             TEXT,
  serial_no         TEXT,
  status            TEXT DEFAULT 'active',
  is_active         BOOLEAN DEFAULT true,
  purchase_date     DATE,
  next_service_date DATE,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "full access machines" ON machines USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Maintenance Logs ───────────────────────────────────────
CREATE TABLE maintenance_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id) ON DELETE CASCADE,
  machine_id  UUID REFERENCES machines(id),
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  type        TEXT,
  description TEXT NOT NULL,
  cost        NUMERIC(14,2) DEFAULT 0,
  done_by     TEXT,
  next_due    DATE,
  status      TEXT DEFAULT 'completed',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "full access maintenance_logs" ON maintenance_logs USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Schema reset complete!' as result;
