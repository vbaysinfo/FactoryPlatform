-- ============================================================
-- ModularPro Factory Platform - Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── Tenants ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_name        TEXT NOT NULL,
  owner_name          TEXT NOT NULL,
  owner_email         TEXT NOT NULL UNIQUE,
  owner_phone         TEXT,
  address             TEXT,
  gst_number          TEXT,
  plan                TEXT NOT NULL DEFAULT 'basic' CHECK (plan IN ('basic','pro','enterprise')),
  subscription_status TEXT NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('trial','active','suspended','cancelled')),
  trial_end           DATE,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  logo_url            TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "service role full access tenants" ON tenants USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Users ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id          UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id             UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  email                 TEXT NOT NULL UNIQUE,
  phone                 TEXT,
  role                  TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('super_admin','tenant_admin','manager','staff')),
  is_active             BOOLEAN NOT NULL DEFAULT true,
  must_change_password  BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "service role full access users" ON users USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Clients ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  contact_person  TEXT,
  email           TEXT,
  phone           TEXT,
  address         TEXT,
  city            TEXT,
  state           TEXT,
  pincode         TEXT,
  gst_number      TEXT,
  pan_number      TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Add missing columns if table already exists
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pincode TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pan_number TEXT;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "service role full access clients" ON clients USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Projects ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id       UUID NOT NULL REFERENCES clients(id),
  name            TEXT NOT NULL,
  site_address    TEXT,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','on_hold','cancelled')),
  start_date      DATE,
  end_date        DATE,
  total_value     NUMERIC(14,2),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "service role full access projects" ON projects USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Rooms ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  area_sqft   NUMERIC(10,2),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "service role full access rooms" ON rooms USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Quotations ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id        UUID NOT NULL REFERENCES projects(id),
  quotation_number  TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','approved','rejected','revised')),
  subtotal          NUMERIC(14,2) DEFAULT 0,
  discount_pct      NUMERIC(5,2) DEFAULT 0,
  tax_pct           NUMERIC(5,2) DEFAULT 18,
  tax_amount        NUMERIC(14,2) DEFAULT 0,
  total_amount      NUMERIC(14,2) DEFAULT 0,
  notes             TEXT,
  valid_until       DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "service role full access quotations" ON quotations USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Quotation Line Items ────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotation_line_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id    UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  description     TEXT NOT NULL,
  unit            TEXT,
  quantity        NUMERIC(10,2) DEFAULT 1,
  unit_price      NUMERIC(14,2) DEFAULT 0,
  total_price     NUMERIC(14,2) DEFAULT 0,
  sort_order      INT DEFAULT 0
);
ALTER TABLE quotation_line_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "service role full access quotation_line_items" ON quotation_line_items USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Invoices ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id       UUID NOT NULL REFERENCES projects(id),
  client_id        UUID NOT NULL REFERENCES clients(id),
  invoice_number   TEXT NOT NULL,
  invoice_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date         DATE,
  subtotal         NUMERIC(14,2) DEFAULT 0,
  tax_amount       NUMERIC(14,2) DEFAULT 0,
  total_amount     NUMERIC(14,2) DEFAULT 0,
  grand_total      NUMERIC(14,2) DEFAULT 0,
  payment_status   TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','partial','paid')),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "service role full access invoices" ON invoices USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Invoice Line Items ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id    UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  description   TEXT NOT NULL,
  quantity      NUMERIC(10,2) DEFAULT 1,
  unit_price    NUMERIC(14,2) DEFAULT 0,
  total_price   NUMERIC(14,2) DEFAULT 0
);
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "service role full access invoice_line_items" ON invoice_line_items USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Payments ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id      UUID NOT NULL REFERENCES invoices(id),
  amount          NUMERIC(14,2) NOT NULL,
  payment_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method  TEXT,
  reference       TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "service role full access payments" ON payments USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Employees ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  emp_code      TEXT,
  role          TEXT,
  department    TEXT,
  phone         TEXT,
  email         TEXT,
  salary        NUMERIC(12,2),
  join_date     DATE,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "service role full access employees" ON employees USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Attendance ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  status        TEXT NOT NULL CHECK (status IN ('present','absent','half_day','leave')),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "service role full access attendance" ON attendance USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Production Jobs ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS production_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id      UUID NOT NULL REFERENCES projects(id),
  title           TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','on_hold')),
  priority        TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  assigned_to     UUID REFERENCES employees(id),
  start_date      DATE,
  due_date        DATE,
  completed_date  DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE production_jobs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "service role full access production_jobs" ON production_jobs USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Production Stages Config ───────────────────────────────
CREATE TABLE IF NOT EXISTS production_stages_config (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  sort_order  INT DEFAULT 0,
  color       TEXT DEFAULT '#3b82f6'
);
ALTER TABLE production_stages_config ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "service role full access production_stages_config" ON production_stages_config USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Production Stage Logs ──────────────────────────────────
CREATE TABLE IF NOT EXISTS production_stage_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_id      UUID NOT NULL REFERENCES production_jobs(id) ON DELETE CASCADE,
  stage       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  notes       TEXT,
  updated_by  UUID REFERENCES users(id),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE production_stage_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "service role full access production_stage_logs" ON production_stage_logs USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Cut List ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cut_list_revisions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  revision    INT NOT NULL DEFAULT 1,
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','sent_to_factory')),
  notes       TEXT,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE cut_list_revisions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "service role full access cut_list_revisions" ON cut_list_revisions USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS cut_list_panels (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id     UUID NOT NULL REFERENCES cut_list_revisions(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  room            TEXT,
  item            TEXT,
  material        TEXT,
  length_mm       NUMERIC(10,2),
  width_mm        NUMERIC(10,2),
  thickness_mm    NUMERIC(10,2),
  quantity        INT DEFAULT 1,
  edge_banding    TEXT,
  notes           TEXT
);
ALTER TABLE cut_list_panels ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "service role full access cut_list_panels" ON cut_list_panels USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Hardware ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hardware_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id    UUID REFERENCES projects(id),
  name          TEXT NOT NULL,
  category      TEXT,
  brand         TEXT,
  quantity      NUMERIC(10,2) DEFAULT 0,
  unit          TEXT,
  unit_price    NUMERIC(14,2) DEFAULT 0,
  total_price   NUMERIC(14,2) DEFAULT 0,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','ordered','received')),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE hardware_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "service role full access hardware_items" ON hardware_items USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Inventory ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  unit        TEXT
);
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "service role full access inventory_categories" ON inventory_categories USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS inventory_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES inventory_categories(id),
  name            TEXT NOT NULL,
  sku             TEXT,
  stock_qty       NUMERIC(12,2) DEFAULT 0,
  min_stock       NUMERIC(12,2) DEFAULT 0,
  unit            TEXT,
  unit_price      NUMERIC(14,2) DEFAULT 0,
  supplier        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "service role full access inventory_items" ON inventory_items USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_id       UUID NOT NULL REFERENCES inventory_items(id),
  type          TEXT NOT NULL CHECK (type IN ('in','out','adjustment')),
  quantity      NUMERIC(12,2) NOT NULL,
  reference     TEXT,
  notes         TEXT,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "service role full access inventory_transactions" ON inventory_transactions USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Dispatch ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dispatch_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id      UUID NOT NULL REFERENCES projects(id),
  dispatch_date   DATE,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','dispatched','delivered')),
  vehicle_no      TEXT,
  driver_name     TEXT,
  driver_phone    TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE dispatch_orders ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "service role full access dispatch_orders" ON dispatch_orders USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS dispatch_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispatch_id     UUID NOT NULL REFERENCES dispatch_orders(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  description     TEXT NOT NULL,
  quantity        INT DEFAULT 1,
  notes           TEXT
);
ALTER TABLE dispatch_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "service role full access dispatch_items" ON dispatch_items USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Expenses ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category      TEXT,
  description   TEXT NOT NULL,
  amount        NUMERIC(14,2) NOT NULL,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  paid_by       TEXT,
  reference     TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "service role full access expenses" ON expenses USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Machines ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS machines (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  model         TEXT,
  serial_no     TEXT,
  status        TEXT DEFAULT 'active' CHECK (status IN ('active','maintenance','inactive')),
  purchase_date DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "service role full access machines" ON machines USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Maintenance Logs ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  machine_id    UUID REFERENCES machines(id),
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  type          TEXT,
  description   TEXT NOT NULL,
  cost          NUMERIC(14,2) DEFAULT 0,
  done_by       TEXT,
  next_due      DATE,
  status        TEXT DEFAULT 'completed' CHECK (status IN ('scheduled','completed')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "service role full access maintenance_logs" ON maintenance_logs USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Design Files ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS design_files (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  file_url      TEXT,
  file_type     TEXT,
  uploaded_by   UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE design_files ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "service role full access design_files" ON design_files USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
