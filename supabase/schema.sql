-- ============================================================
-- AquaNurseryPro - Supabase Database Schema
-- Safe to re-run: uses IF NOT EXISTS + duplicate policy handling
-- ============================================================

-- ── Sheds ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sheds (
  id          SERIAL PRIMARY KEY,
  name        TEXT        NOT NULL,
  tank_count  INT         NOT NULL DEFAULT 0,
  type        TEXT        NOT NULL CHECK (type IN ('culture','treatment')),
  shape       TEXT        NOT NULL CHECK (shape IN ('circle','rectangle')),
  color       TEXT        NOT NULL,
  description TEXT
);
ALTER TABLE sheds ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth users read sheds"   ON sheds FOR SELECT USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users insert sheds" ON sheds FOR INSERT WITH CHECK (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users update sheds" ON sheds FOR UPDATE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users delete sheds" ON sheds FOR DELETE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Tanks ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tanks (
  id        SERIAL PRIMARY KEY,
  shed_id   INT  NOT NULL REFERENCES sheds(id) ON DELETE CASCADE,
  shed      TEXT NOT NULL,
  name      TEXT NOT NULL,
  shape     TEXT NOT NULL CHECK (shape IN ('circle','rectangle')),
  type      TEXT NOT NULL CHECK (type IN ('culture','treatment')),
  status    TEXT NOT NULL CHECK (status IN ('active','empty','harvest','harvest-ready','maintenance')),
  batch_id  INT
);
ALTER TABLE tanks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth users read tanks"   ON tanks FOR SELECT USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users insert tanks" ON tanks FOR INSERT WITH CHECK (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users update tanks" ON tanks FOR UPDATE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users delete tanks" ON tanks FOR DELETE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Batches ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS batches (
  id                  SERIAL PRIMARY KEY,
  t_id                INT           NOT NULL REFERENCES tanks(id),
  batch_no            TEXT          NOT NULL UNIQUE,
  start_date          DATE          NOT NULL,
  pl_stage            TEXT          NOT NULL,
  count               INT           NOT NULL,
  hatchery            TEXT          NOT NULL,
  location            TEXT          NOT NULL,
  cost_per_k          NUMERIC(10,2) NOT NULL,
  total_cost          NUMERIC(12,2) NOT NULL,
  doc                 INT           NOT NULL DEFAULT 0,
  harvest_date        DATE,
  status              TEXT          NOT NULL CHECK (status IN ('active','harvest-ready','harvested','terminated')),
  survival_rate       NUMERIC(5,2),
  biomass             NUMERIC(10,3),
  feed_kg             NUMERIC(10,3),
  fcr                 NUMERIC(5,2),
  harvest_date_actual DATE,
  sold_to             TEXT,
  sale_amount         NUMERIC(12,2)
);
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth users read batches"   ON batches FOR SELECT USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users insert batches" ON batches FOR INSERT WITH CHECK (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users update batches" ON batches FOR UPDATE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users delete batches" ON batches FOR DELETE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Water Quality ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS water_quality (
  id           SERIAL PRIMARY KEY,
  t_id         INT          NOT NULL REFERENCES tanks(id),
  date         DATE         NOT NULL,
  shift        TEXT         NOT NULL CHECK (shift IN ('morning','afternoon','night')),
  temp         NUMERIC(5,2),
  salinity     NUMERIC(5,2),
  do_value     NUMERIC(5,2),
  ph           NUMERIC(5,2),
  transparency INT,
  ammonia      NUMERIC(6,4),
  nitrite      NUMERIC(6,4),
  alkalinity   INT,
  color        TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE water_quality ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth users read water"   ON water_quality FOR SELECT USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users insert water" ON water_quality FOR INSERT WITH CHECK (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users update water" ON water_quality FOR UPDATE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users delete water" ON water_quality FOR DELETE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Feed Logs ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feed_logs (
  id          SERIAL PRIMARY KEY,
  t_id        INT          NOT NULL REFERENCES tanks(id),
  date        DATE         NOT NULL,
  shift       TEXT         NOT NULL CHECK (shift IN ('morning','afternoon','night')),
  brand       TEXT         NOT NULL,
  feed_type   TEXT         NOT NULL,
  size        TEXT,
  qty_g       INT          NOT NULL,
  cost_per_kg NUMERIC(8,2),
  cost        NUMERIC(10,2),
  biomass     NUMERIC(10,3),
  fcr         NUMERIC(5,2),
  observation TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE feed_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth users read feed"   ON feed_logs FOR SELECT USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users insert feed" ON feed_logs FOR INSERT WITH CHECK (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users update feed" ON feed_logs FOR UPDATE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users delete feed" ON feed_logs FOR DELETE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Medicine / Treatment Logs ──────────────────────────────
CREATE TABLE IF NOT EXISTS medicine_logs (
  id         SERIAL PRIMARY KEY,
  t_id       INT          NOT NULL REFERENCES tanks(id),
  date       DATE         NOT NULL,
  name       TEXT         NOT NULL,
  med_type   TEXT         NOT NULL,
  dose       NUMERIC(10,3),
  unit       TEXT,
  method     TEXT,
  reason     TEXT,
  cost       NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE medicine_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth users read meds"   ON medicine_logs FOR SELECT USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users insert meds" ON medicine_logs FOR INSERT WITH CHECK (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users update meds" ON medicine_logs FOR UPDATE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users delete meds" ON medicine_logs FOR DELETE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Farmers ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS farmers (
  id            SERIAL PRIMARY KEY,
  name          TEXT          NOT NULL,
  phone         TEXT,
  email         TEXT,
  village       TEXT,
  district      TEXT,
  state         TEXT          DEFAULT 'AP',
  ponds         INT,
  area_acres    NUMERIC(8,2),
  experience    INT,
  tank_id       INT           REFERENCES tanks(id),
  total_buys    INT           DEFAULT 0,
  total_revenue NUMERIC(14,2) DEFAULT 0,
  created_at    TIMESTAMPTZ   DEFAULT now()
);
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth users read farmers"   ON farmers FOR SELECT USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users insert farmers" ON farmers FOR INSERT WITH CHECK (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users update farmers" ON farmers FOR UPDATE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users delete farmers" ON farmers FOR DELETE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Sales ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
  id             SERIAL PRIMARY KEY,
  batch_id       INT           REFERENCES batches(id),
  t_id           INT           NOT NULL REFERENCES tanks(id),
  date           DATE          NOT NULL,
  farmer_id      INT           REFERENCES farmers(id),
  qty            INT           NOT NULL,
  pl_stage       TEXT,
  price_per_k    NUMERIC(8,2),
  total          NUMERIC(12,2),
  payment_method TEXT          CHECK (payment_method IN ('Bank','Cash','UPI','Cheque')),
  status         TEXT          CHECK (status IN ('paid','partial','pending')),
  paid_amount    NUMERIC(12,2) DEFAULT 0,
  balance        NUMERIC(12,2) DEFAULT 0,
  invoice_no     TEXT,
  created_at     TIMESTAMPTZ   DEFAULT now()
);
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth users read sales"   ON sales FOR SELECT USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users insert sales" ON sales FOR INSERT WITH CHECK (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users update sales" ON sales FOR UPDATE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users delete sales" ON sales FOR DELETE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Staff ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff (
  id               SERIAL PRIMARY KEY,
  name             TEXT        NOT NULL,
  emp_id           TEXT        NOT NULL UNIQUE,
  role             TEXT        NOT NULL CHECK (role IN ('Technician','Manager','Admin','Worker','HR')),
  dept             TEXT        NOT NULL,
  phone            TEXT,
  email            TEXT,
  qualification    TEXT,
  join_date        DATE,
  salary           NUMERIC(10,2),
  status           TEXT        NOT NULL CHECK (status IN ('active','on-leave','resigned','terminated')),
  assigned_tanks   INT[]       DEFAULT '{}',
  assigned_farmers INT[]       DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth users read staff"   ON staff FOR SELECT USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users insert staff" ON staff FOR INSERT WITH CHECK (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users update staff" ON staff FOR UPDATE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users delete staff" ON staff FOR DELETE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Tech Logs (daily compliance) ──────────────────────────
CREATE TABLE IF NOT EXISTS tech_logs (
  id              SERIAL PRIMARY KEY,
  date            DATE        NOT NULL,
  t_id            INT         NOT NULL REFERENCES tanks(id),
  morning_water   BOOLEAN     DEFAULT FALSE,
  afternoon_water BOOLEAN     DEFAULT FALSE,
  night_water     BOOLEAN     DEFAULT FALSE,
  feed_count      INT         DEFAULT 0,
  med_count       INT         DEFAULT 0,
  pl_count        INT         DEFAULT 0,
  score           INT,
  created_at      TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE tech_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth users read tech_logs"   ON tech_logs FOR SELECT USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users insert tech_logs" ON tech_logs FOR INSERT WITH CHECK (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users update tech_logs" ON tech_logs FOR UPDATE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users delete tech_logs" ON tech_logs FOR DELETE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Maintenance ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maintenance (
  id           SERIAL PRIMARY KEY,
  category     TEXT        NOT NULL,
  sub_category TEXT,
  date         DATE        NOT NULL,
  description  TEXT,
  cost         NUMERIC(10,2),
  vendor       TEXT,
  next_due     DATE,
  status       TEXT        NOT NULL CHECK (status IN ('completed','scheduled','in-progress','cancelled')),
  done_by      TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth users read maint"   ON maintenance FOR SELECT USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users insert maint" ON maintenance FOR INSERT WITH CHECK (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users update maint" ON maintenance FOR UPDATE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users delete maint" ON maintenance FOR DELETE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Power Bills ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS power_bills (
  id         SERIAL PRIMARY KEY,
  month      TEXT        NOT NULL,
  year       INT         NOT NULL,
  units      INT,
  amount     NUMERIC(12,2),
  paid_date  DATE,
  status     TEXT        NOT NULL CHECK (status IN ('paid','pending','overdue')),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE power_bills ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth users read power"   ON power_bills FOR SELECT USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users insert power" ON power_bills FOR INSERT WITH CHECK (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users update power" ON power_bills FOR UPDATE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users delete power" ON power_bills FOR DELETE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Monthly Summary ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS monthly_summary (
  id         SERIAL PRIMARY KEY,
  month      TEXT        NOT NULL,
  year       INT         NOT NULL DEFAULT 2024,
  revenue    NUMERIC(14,2),
  cost       NUMERIC(14,2),
  profit     NUMERIC(14,2),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE monthly_summary ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth users read monthly"   ON monthly_summary FOR SELECT USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users insert monthly" ON monthly_summary FOR INSERT WITH CHECK (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users update monthly" ON monthly_summary FOR UPDATE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users delete monthly" ON monthly_summary FOR DELETE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Feed Inventory ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feed_inventory (
  id            SERIAL PRIMARY KEY,
  brand         TEXT          NOT NULL,
  feed_type     TEXT          NOT NULL,
  stock_kg      NUMERIC(10,2),
  purchase_date DATE,
  cost_per_kg   NUMERIC(8,2),
  supplier      TEXT,
  expiry_date   DATE,
  min_stock     NUMERIC(10,2) DEFAULT 50,
  created_at    TIMESTAMPTZ   DEFAULT now()
);
ALTER TABLE feed_inventory ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth users read feed_inv"   ON feed_inventory FOR SELECT USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users insert feed_inv" ON feed_inventory FOR INSERT WITH CHECK (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users update feed_inv" ON feed_inventory FOR UPDATE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users delete feed_inv" ON feed_inventory FOR DELETE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Medicine Inventory ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS medicine_inventory (
  id            SERIAL PRIMARY KEY,
  name          TEXT          NOT NULL,
  med_type      TEXT          NOT NULL,
  quantity      NUMERIC(10,3),
  unit          TEXT,
  cost_per_unit NUMERIC(8,2),
  expiry_date   DATE,
  supplier      TEXT,
  min_stock     NUMERIC(10,3) DEFAULT 5,
  created_at    TIMESTAMPTZ   DEFAULT now()
);
ALTER TABLE medicine_inventory ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth users read med_inv"   ON medicine_inventory FOR SELECT USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users insert med_inv" ON medicine_inventory FOR INSERT WITH CHECK (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users update med_inv" ON medicine_inventory FOR UPDATE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users delete med_inv" ON medicine_inventory FOR DELETE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Feed Stock Purchases ───────────────────────────────────
CREATE TABLE IF NOT EXISTS feed_stock (
  id          SERIAL PRIMARY KEY,
  brand       TEXT          NOT NULL,
  feed_type   TEXT          NOT NULL,
  qty         NUMERIC(10,2) NOT NULL,
  unit        TEXT          NOT NULL DEFAULT 'kg',
  date        DATE          NOT NULL,
  supplier    TEXT,
  invoice_no  TEXT,
  cost_per_kg NUMERIC(8,2),
  total_cost  NUMERIC(12,2),
  expiry_date DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE feed_stock ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth users read feed_stock"   ON feed_stock FOR SELECT USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users insert feed_stock" ON feed_stock FOR INSERT WITH CHECK (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users update feed_stock" ON feed_stock FOR UPDATE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users delete feed_stock" ON feed_stock FOR DELETE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Medicine Stock Purchases ───────────────────────────────
CREATE TABLE IF NOT EXISTS medicine_stock (
  id            SERIAL PRIMARY KEY,
  name          TEXT          NOT NULL,
  med_type      TEXT          NOT NULL,
  qty           NUMERIC(10,3) NOT NULL,
  unit          TEXT          NOT NULL DEFAULT 'kg',
  date          DATE          NOT NULL,
  supplier      TEXT,
  invoice_no    TEXT,
  cost_per_unit NUMERIC(8,2),
  total_cost    NUMERIC(12,2),
  expiry_date   DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE medicine_stock ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth users read med_stock"   ON medicine_stock FOR SELECT USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users insert med_stock" ON medicine_stock FOR INSERT WITH CHECK (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users update med_stock" ON medicine_stock FOR UPDATE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users delete med_stock" ON medicine_stock FOR DELETE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── General / Other Supplies ───────────────────────────────
CREATE TABLE IF NOT EXISTS general_inventory (
  id            SERIAL PRIMARY KEY,
  category      TEXT          NOT NULL,
  name          TEXT          NOT NULL,
  qty           NUMERIC(10,2) NOT NULL,
  unit          TEXT          NOT NULL DEFAULT 'pcs',
  date          DATE          NOT NULL,
  supplier      TEXT,
  cost_per_unit NUMERIC(10,2),
  total_cost    NUMERIC(12,2),
  min_stock     NUMERIC(10,2) DEFAULT 10,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE general_inventory ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth users read gen_inv"   ON general_inventory FOR SELECT USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users insert gen_inv" ON general_inventory FOR INSERT WITH CHECK (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users update gen_inv" ON general_inventory FOR UPDATE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth users delete gen_inv" ON general_inventory FOR DELETE USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
