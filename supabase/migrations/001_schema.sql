-- ============================================================
-- MULTI-TENANT INTERIOR MODULAR FACTORY MANAGEMENT SAAS
-- Supabase Schema — Part A (Tenant Application)
-- ============================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TENANTS (Factory Owners)
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  factory_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_email TEXT UNIQUE NOT NULL,
  owner_phone TEXT,
  address TEXT,
  gst_number TEXT,
  logo_url TEXT,
  plan TEXT DEFAULT 'basic' CHECK (plan IN ('basic', 'standard', 'premium')),
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial','active','suspended','cancelled')),
  subscription_start DATE,
  subscription_end DATE,
  trial_end DATE,
  max_users INTEGER DEFAULT 5,
  max_projects INTEGER DEFAULT 20,
  storage_limit_gb INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USERS (Tenant Employees + Super Admin)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE,  -- references auth.users.id
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('super_admin','tenant_admin','sales_manager','designer','production_manager','stage_operator','inventory_manager','accounts','driver')),
  department TEXT,
  skills TEXT[],
  is_active BOOLEAN DEFAULT true,
  must_change_password BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

-- ============================================================
-- CLIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_code TEXT,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  gst_number TEXT,
  pan_number TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id),
  project_code TEXT,
  name TEXT NOT NULL,
  project_type TEXT NOT NULL CHECK (project_type IN ('office','home')),
  status TEXT DEFAULT 'inquiry' CHECK (status IN (
    'inquiry','quotation_sent','client_accepted','advance_received',
    'in_production','dispatch_logged','final_invoice','payment_received','closed','on_hold','cancelled'
  )),
  site_address TEXT,
  start_date DATE,
  expected_completion DATE,
  actual_completion DATE,
  notes TEXT,
  assigned_manager UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROOMS (sub-projects)
-- ============================================================
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  room_type TEXT NOT NULL,
  room_name TEXT NOT NULL,
  floor_number INTEGER,
  area_sqft NUMERIC,
  status TEXT DEFAULT 'design' CHECK (status IN (
    'design','cut_list_draft','designer_confirmed','validated','hardware_confirmed',
    'released','in_production','completed','dispatched'
  )),
  sort_order INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- UNITS (furniture pieces per room)
-- ============================================================
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  unit_name TEXT NOT NULL,
  unit_type TEXT,
  height_ft NUMERIC,
  width_ft NUMERIC,
  depth_ft NUMERIC,
  height_mm NUMERIC,
  width_mm NUMERIC,
  depth_mm NUMERIC,
  sections INTEGER DEFAULT 1,
  shutters INTEGER DEFAULT 0,
  drawers INTEGER DEFAULT 0,
  shelves INTEGER DEFAULT 0,
  lofts INTEGER DEFAULT 0,
  primary_material TEXT,
  board_thickness_mm NUMERIC DEFAULT 18,
  outer_finish TEXT,
  inner_finish TEXT,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CUT LIST REVISIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS cut_list_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','confirmed','validated','rejected','superseded')),
  confirmed_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMPTZ,
  validated_by UUID REFERENCES users(id),
  validated_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CUT LIST PANELS
-- ============================================================
CREATE TABLE IF NOT EXISTS cut_list_panels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  revision_id UUID NOT NULL REFERENCES cut_list_revisions(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id),
  panel_label TEXT NOT NULL,
  length_mm NUMERIC NOT NULL,
  width_mm NUMERIC NOT NULL,
  thickness_mm NUMERIC NOT NULL DEFAULT 18,
  material TEXT NOT NULL,
  finish TEXT,
  grain_direction TEXT CHECK (grain_direction IN ('length','width','none')),
  edge_band_top BOOLEAN DEFAULT false,
  edge_band_bottom BOOLEAN DEFAULT false,
  edge_band_left BOOLEAN DEFAULT false,
  edge_band_right BOOLEAN DEFAULT false,
  edge_band_type TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  is_verified BOOLEAN DEFAULT false,
  mismatch_notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DESIGN FILES
-- ============================================================
CREATE TABLE IF NOT EXISTS design_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  revision_id UUID REFERENCES cut_list_revisions(id),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size_bytes INTEGER,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- HARDWARE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS hardware_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  revision_id UUID REFERENCES cut_list_revisions(id),
  item_name TEXT NOT NULL,
  category TEXT CHECK (category IN ('hinge','drawer_channel','handle','lock','rod','basket','led_profile','glass_shutter','connector','other')),
  brand TEXT,
  model TEXT,
  specification TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'nos',
  unit_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC,
  is_auto_suggested BOOLEAN DEFAULT false,
  stock_available INTEGER,
  stock_status TEXT CHECK (stock_status IN ('available','low','out_of_stock')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- QUOTATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  quotation_number TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  type TEXT DEFAULT 'quotation' CHECK (type IN ('proposal','quotation')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','viewed','accepted','revision_requested','cancelled')),
  subtotal NUMERIC DEFAULT 0,
  discount_percent NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  gst_percent NUMERIC DEFAULT 18,
  gst_amount NUMERIC DEFAULT 0,
  grand_total NUMERIC DEFAULT 0,
  advance_percent NUMERIC DEFAULT 30,
  payment_terms TEXT,
  validity_days INTEGER DEFAULT 30,
  valid_until DATE,
  terms_conditions TEXT,
  notes TEXT,
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotation_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id),
  unit_id UUID REFERENCES units(id),
  description TEXT NOT NULL,
  work_description TEXT,
  material TEXT,
  finish TEXT,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'nos',
  unit_price NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

-- ============================================================
-- PRODUCTION STAGES (configurable per tenant)
-- ============================================================
CREATE TABLE IF NOT EXISTS production_stages_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  stage_code TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  expected_duration_hours NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRODUCTION JOBS
-- ============================================================
CREATE TABLE IF NOT EXISTS production_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id),
  room_id UUID NOT NULL REFERENCES rooms(id),
  job_code TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  total_panels INTEGER DEFAULT 0,
  notes TEXT,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS production_stage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES production_jobs(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES production_stages_config(id),
  stage_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','on_hold','rework')),
  assigned_to UUID REFERENCES users(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expected_hours NUMERIC,
  quantity_processed INTEGER DEFAULT 0,
  quantity_total INTEGER DEFAULT 0,
  qc_status TEXT CHECK (qc_status IN ('pending','pass','fail')),
  qc_notes TEXT,
  rework_reason TEXT,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INVENTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('board','laminate','edge_band','hardware','other')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES inventory_categories(id),
  item_code TEXT,
  name TEXT NOT NULL,
  description TEXT,
  brand TEXT,
  unit TEXT DEFAULT 'nos',
  unit_cost NUMERIC DEFAULT 0,
  current_stock NUMERIC DEFAULT 0,
  reorder_level NUMERIC DEFAULT 0,
  max_stock NUMERIC,
  supplier_name TEXT,
  supplier_contact TEXT,
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventory_items(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase','usage','wastage','return','adjustment','transfer')),
  quantity NUMERIC NOT NULL,
  unit_cost NUMERIC,
  total_cost NUMERIC,
  project_id UUID REFERENCES projects(id),
  room_id UUID REFERENCES rooms(id),
  supplier_name TEXT,
  invoice_number TEXT,
  notes TEXT,
  performed_by UUID REFERENCES users(id),
  transaction_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EMPLOYEES (detailed, beyond just users)
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  employee_code TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT,
  department TEXT,
  date_of_joining DATE,
  date_of_birth DATE,
  address TEXT,
  emergency_contact TEXT,
  salary_type TEXT CHECK (salary_type IN ('monthly','daily','piece_rate')),
  basic_salary NUMERIC,
  bank_account TEXT,
  ifsc_code TEXT,
  skills TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id),
  date DATE NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT DEFAULT 'present' CHECK (status IN ('present','absent','half_day','leave','holiday')),
  overtime_hours NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- ============================================================
-- MACHINES & MAINTENANCE
-- ============================================================
CREATE TABLE IF NOT EXISTS machines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  machine_code TEXT,
  name TEXT NOT NULL,
  type TEXT,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  purchase_date DATE,
  purchase_cost NUMERIC,
  location TEXT,
  status TEXT DEFAULT 'operational' CHECK (status IN ('operational','maintenance','breakdown','retired')),
  last_service_date DATE,
  next_service_date DATE,
  service_interval_days INTEGER DEFAULT 90,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  machine_id UUID NOT NULL REFERENCES machines(id),
  type TEXT CHECK (type IN ('preventive','breakdown','repair','inspection')),
  description TEXT,
  performed_by UUID REFERENCES employees(id),
  vendor TEXT,
  cost NUMERIC DEFAULT 0,
  downtime_hours NUMERIC DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  next_service_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DISPATCH
-- ============================================================
CREATE TABLE IF NOT EXISTS dispatch_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id),
  dispatch_number TEXT NOT NULL,
  scheduled_date DATE,
  actual_dispatch_date DATE,
  vehicle_type TEXT,
  vehicle_number TEXT,
  driver_id UUID REFERENCES employees(id),
  driver_contact TEXT,
  destination_address TEXT,
  total_items INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','scheduled','dispatched','in_transit','delivered','installation_pending')),
  delivery_proof_url TEXT,
  receiver_name TEXT,
  delivery_notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dispatch_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispatch_id UUID NOT NULL REFERENCES dispatch_orders(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id),
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  is_checked BOOLEAN DEFAULT false,
  notes TEXT
);

-- ============================================================
-- ACCOUNTING
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  invoice_number TEXT NOT NULL,
  invoice_type TEXT CHECK (invoice_type IN ('advance','milestone','final','job_work')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','partial','paid','overdue','cancelled')),
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  gst_percent NUMERIC DEFAULT 18,
  gst_amount NUMERIC DEFAULT 0,
  grand_total NUMERIC DEFAULT 0,
  amount_paid NUMERIC DEFAULT 0,
  amount_due NUMERIC DEFAULT 0,
  payment_terms TEXT,
  notes TEXT,
  sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  hsn_sac TEXT,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'nos',
  unit_price NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  gst_rate NUMERIC DEFAULT 18,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id),
  project_id UUID REFERENCES projects(id),
  client_id UUID REFERENCES clients(id),
  payment_number TEXT,
  amount NUMERIC NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  payment_mode TEXT CHECK (payment_mode IN ('cash','bank_transfer','upi','cheque','neft','rtgs','other')),
  reference_number TEXT,
  bank_name TEXT,
  notes TEXT,
  received_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  category TEXT CHECK (category IN ('material','labor','maintenance','transport','utilities','rent','salary','other')),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  expense_date DATE DEFAULT CURRENT_DATE,
  vendor_name TEXT,
  invoice_number TEXT,
  payment_mode TEXT,
  is_billable BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES users(id),
  receipt_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_clients_tenant ON clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_rooms_project ON rooms(project_id);
CREATE INDEX IF NOT EXISTS idx_units_room ON units(room_id);
CREATE INDEX IF NOT EXISTS idx_cut_list_panels_revision ON cut_list_panels(revision_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item ON inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_project ON inventory_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_production_jobs_project ON production_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_invoices_project ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);

-- ============================================================
-- DEFAULT PRODUCTION STAGES (inserted per tenant via app logic)
-- ============================================================

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE cut_list_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cut_list_panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE hardware_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_stages_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_stage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispatch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's tenant_id
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM users WHERE auth_user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE auth_user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies: tenant isolation (all users see only their tenant's data)
-- Using permissive policies keyed on tenant_id

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'clients','projects','rooms','units','cut_list_revisions','cut_list_panels',
    'design_files','hardware_items','quotations','production_stages_config',
    'production_jobs','inventory_categories','inventory_items','inventory_transactions',
    'employees','attendance','machines','maintenance_logs','dispatch_orders',
    'invoices','payments','expenses','audit_logs'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (tenant_id = get_user_tenant_id())',
      'tenant_isolation_' || tbl, tbl
    );
  END LOOP;
END;
$$;

-- Users can see users in same tenant
CREATE POLICY tenant_isolation_users ON users FOR ALL
  USING (tenant_id = get_user_tenant_id() OR role = 'super_admin');

-- Tenants visible to super_admin and own tenant admin
CREATE POLICY tenant_self_access ON tenants FOR ALL
  USING (id = get_user_tenant_id() OR get_user_role() = 'super_admin');

-- quotation_line_items and invoice_line_items and dispatch_items via join
CREATE POLICY tenant_isolation_quotation_line_items ON quotation_line_items FOR ALL
  USING (quotation_id IN (SELECT id FROM quotations WHERE tenant_id = get_user_tenant_id()));

CREATE POLICY tenant_isolation_invoice_line_items ON invoice_line_items FOR ALL
  USING (invoice_id IN (SELECT id FROM invoices WHERE tenant_id = get_user_tenant_id()));

CREATE POLICY tenant_isolation_dispatch_items ON dispatch_items FOR ALL
  USING (dispatch_id IN (SELECT id FROM dispatch_orders WHERE tenant_id = get_user_tenant_id()));

CREATE POLICY tenant_isolation_production_stage_logs ON production_stage_logs FOR ALL
  USING (tenant_id = get_user_tenant_id());
