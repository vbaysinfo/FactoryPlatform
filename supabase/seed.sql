-- ============================================================
-- AquaNurseryPro - Seed Data
-- Safe to re-run: uses ON CONFLICT DO NOTHING
-- Run AFTER schema.sql in Supabase SQL Editor
-- ============================================================

-- ── Sheds ──────────────────────────────────────────────────
INSERT INTO sheds (id, name, tank_count, type, shape, color, description) VALUES
(1,'Shed A',5,'culture',  'circle',   '#00d4aa','Main Culture Tanks'),
(2,'Shed B',6,'culture',  'circle',   '#0099ff','Main Culture Tanks'),
(3,'Shed C',6,'treatment','rectangle','#a855f7','Water Treatment'),
(4,'Shed D',6,'treatment','rectangle','#f59e0b','Water Treatment'),
(5,'Shed E',6,'treatment','rectangle','#ec4899','Water Treatment')
ON CONFLICT (id) DO NOTHING;

-- ── Tanks ──────────────────────────────────────────────────
INSERT INTO tanks (id, shed_id, shed, name, shape, type, status, batch_id) VALUES
(1, 1,'Shed A','A-1','circle',   'culture',  'active',     1),
(2, 1,'Shed A','A-2','circle',   'culture',  'active',     2),
(3, 1,'Shed A','A-3','circle',   'culture',  'harvest',    3),
(4, 1,'Shed A','A-4','circle',   'culture',  'active',     4),
(5, 1,'Shed A','A-5','circle',   'culture',  'empty',      NULL),
(6, 2,'Shed B','B-1','circle',   'culture',  'active',     5),
(7, 2,'Shed B','B-2','circle',   'culture',  'active',     6),
(8, 2,'Shed B','B-3','circle',   'culture',  'active',     7),
(9, 2,'Shed B','B-4','circle',   'culture',  'harvest',    8),
(10,2,'Shed B','B-5','circle',   'culture',  'active',     9),
(11,2,'Shed B','B-6','circle',   'culture',  'maintenance',NULL),
(12,3,'Shed C','C-1','rectangle','treatment','active',     10),
(13,3,'Shed C','C-2','rectangle','treatment','active',     11),
(14,3,'Shed C','C-3','rectangle','treatment','active',     12),
(15,3,'Shed C','C-4','rectangle','treatment','empty',      NULL),
(16,3,'Shed C','C-5','rectangle','treatment','active',     13),
(17,3,'Shed C','C-6','rectangle','treatment','active',     14),
(18,4,'Shed D','D-1','rectangle','treatment','active',     15),
(19,4,'Shed D','D-2','rectangle','treatment','active',     16),
(20,4,'Shed D','D-3','rectangle','treatment','harvest',    17),
(21,4,'Shed D','D-4','rectangle','treatment','active',     18),
(22,4,'Shed D','D-5','rectangle','treatment','empty',      NULL),
(23,4,'Shed D','D-6','rectangle','treatment','maintenance',NULL),
(24,5,'Shed E','E-1','rectangle','treatment','active',     19),
(25,5,'Shed E','E-2','rectangle','treatment','active',     20),
(26,5,'Shed E','E-3','rectangle','treatment','empty',      NULL),
(27,5,'Shed E','E-4','rectangle','treatment','active',     21),
(28,5,'Shed E','E-5','rectangle','treatment','active',     22),
(29,5,'Shed E','E-6','rectangle','treatment','harvest',    23)
ON CONFLICT (id) DO NOTHING;

-- ── Batches (active) ────────────────────────────────────────
INSERT INTO batches (id,t_id,batch_no,start_date,pl_stage,count,hatchery,location,cost_per_k,total_cost,doc,harvest_date,status,survival_rate,biomass,feed_kg,fcr) VALUES
(1, 1, 'B2024-001','2024-05-15','PL-10',500000,'Blue Ocean',  'Nellore',    180,90000, 18,'2024-06-07','active',       82,41.0, 62.3, 1.52),
(2, 2, 'B2024-002','2024-05-18','PL-12',480000,'Aqua Star',   'Vijayawada', 200,96000, 15,'2024-06-10','active',       78,33.8, 47.2, 1.40),
(3, 3, 'B2024-003','2024-05-10','PL-8', 520000,'Blue Ocean',  'Nellore',    160,83200, 23,'2024-06-02','harvest-ready',85,66.3, 112.5,1.70),
(4, 4, 'B2024-004','2024-05-20','PL-10',460000,'Sea Pearl',   'Bapatla',    190,87400, 13,'2024-06-12','active',       80,28.5, 38.1, 1.34),
(5, 6, 'B2024-005','2024-05-22','PL-12',510000,'Aqua Star',   'Vijayawada', 200,102000,11,'2024-06-14','active',       79,22.6, 29.0, 1.28),
(6, 7, 'B2024-006','2024-05-16','PL-10',490000,'Marine Gold', 'Guntur',     185,90650, 17,'2024-06-08','active',       76,37.2, 55.8, 1.50),
(7, 8, 'B2024-007','2024-05-19','PL-8', 530000,'Blue Ocean',  'Nellore',    165,87450, 14,'2024-06-11','active',       83,31.4, 43.0, 1.37),
(8, 9, 'B2024-008','2024-05-14','PL-10',470000,'Sea Pearl',   'Bapatla',    190,89300, 19,'2024-06-06','harvest-ready',81,48.2, 72.3, 1.50),
(9, 10,'B2024-009','2024-05-21','PL-12',500000,'Aqua Star',   'Vijayawada', 205,102500,12,'2024-06-13','active',       77,26.1, 34.5, 1.32),
(10,12,'B2024-010','2024-05-17','PL-10',495000,'Marine Gold', 'Guntur',     188,93060, 16,'2024-06-09','active',       84,35.5, 51.2, 1.44),
(11,13,'B2024-011','2024-05-23','PL-8', 540000,'Blue Ocean',  'Nellore',    160,86400, 10,'2024-06-15','active',       82,21.3, 27.1, 1.27),
(12,14,'B2024-012','2024-05-11','PL-12',480000,'Sea Pearl',   'Bapatla',    200,96000, 22,'2024-06-03','harvest-ready',86,62.8, 100.5,1.60),
(13,16,'B2024-013','2024-05-24','PL-10',460000,'Aqua Star',   'Vijayawada', 195,89700, 9, '2024-06-16','active',       78,18.9, 23.6, 1.25),
(14,17,'B2024-014','2024-05-13','PL-8', 510000,'Marine Gold', 'Guntur',     170,86700, 20,'2024-06-05','active',       80,52.4, 81.7, 1.56),
(15,18,'B2024-015','2024-05-25','PL-12',500000,'Blue Ocean',  'Nellore',    200,100000,8, '2024-06-17','active',       79,16.5, 20.0, 1.21),
(16,19,'B2024-016','2024-05-12','PL-10',490000,'Sea Pearl',   'Bapatla',    185,90650, 21,'2024-06-04','active',       83,57.9, 92.6, 1.60),
(17,20,'B2024-017','2024-05-10','PL-8', 520000,'Aqua Star',   'Vijayawada', 165,85800, 23,'2024-06-03','harvest-ready',81,60.1, 96.2, 1.60),
(18,21,'B2024-018','2024-05-15','PL-12',470000,'Marine Gold', 'Guntur',     205,96350, 18,'2024-06-07','active',       77,39.6, 59.4, 1.50),
(19,24,'B2024-019','2024-05-27','PL-10',500000,'Blue Ocean',  'Nellore',    190,95000, 6, '2024-06-19','active',       82,14.2, 17.1, 1.20),
(20,25,'B2024-020','2024-05-09','PL-8', 535000,'Sea Pearl',   'Bapatla',    162,86670, 24,'2024-06-02','harvest-ready',88,74.5, 126.7,1.70),
(21,27,'B2024-021','2024-05-28','PL-12',480000,'Aqua Star',   'Vijayawada', 200,96000, 5, '2024-06-20','active',       80,12.0, 13.9, 1.16),
(22,28,'B2024-022','2024-05-18','PL-10',505000,'Marine Gold', 'Guntur',     188,94940, 15,'2024-06-10','active',       79,34.8, 50.5, 1.45),
(23,29,'B2024-023','2024-05-10','PL-8', 510000,'Blue Ocean',  'Nellore',    160,81600, 23,'2024-06-03','harvest-ready',84,65.5, 111.2,1.70)
ON CONFLICT (id) DO NOTHING;

-- ── Batches (harvested history) ──────────────────────────────
INSERT INTO batches (id,t_id,batch_no,start_date,pl_stage,count,hatchery,location,cost_per_k,total_cost,doc,harvest_date,status,survival_rate,biomass,feed_kg,fcr,harvest_date_actual,sold_to,sale_amount) VALUES
(101,1, 'B2024-H01','2024-03-10','PL-10',500000,'Blue Ocean', 'Nellore',   175,87500, 24,'2024-04-03','harvested',80,68.0,115.6,1.70,'2024-04-04','Ravi Kumar Reddy',136000),
(102,2, 'B2024-H02','2024-03-12','PL-12',480000,'Aqua Star',  'Vijayawada',195,93600, 23,'2024-04-04','harvested',77,62.5,100.0,1.60,'2024-04-06','Suresh Naidu',    120000),
(103,3, 'B2024-H03','2024-03-08','PL-8', 520000,'Sea Pearl',  'Bapatla',   155,80600, 25,'2024-04-02','harvested',83,70.2,119.3,1.70,'2024-04-02','Venkata Rao',     140400),
(104,4, 'B2024-H04','2024-03-15','PL-10',460000,'Marine Gold','Guntur',    182,83720, 22,'2024-04-06','harvested',81,65.8,105.3,1.60,'2024-04-07','Lakshmi Prasad',  131600),
(105,6, 'B2024-H05','2024-03-18','PL-12',510000,'Blue Ocean', 'Nellore',   198,100980,23,'2024-04-10','harvested',79,63.5,101.6,1.60,'2024-04-11','Srinivas Murthy', 127000),
(106,1, 'B2024-H06','2024-01-05','PL-8', 500000,'Aqua Star',  'Vijayawada',168,84000, 24,'2024-01-29','harvested',85,71.3,121.2,1.70,'2024-01-30','Ravi Kumar Reddy',142600),
(107,2, 'B2024-H07','2024-01-08','PL-10',490000,'Sea Pearl',  'Bapatla',   178,87220, 25,'2024-02-02','harvested',78,64.3,102.9,1.60,'2024-02-02','Suresh Naidu',    128600),
(108,7, 'B2024-H08','2024-01-10','PL-12',510000,'Marine Gold','Guntur',    190,96900, 24,'2024-02-03','harvested',82,69.2,117.6,1.70,'2024-02-04','Kishore Babu',    138400),
(109,8, 'B2024-H09','2024-02-12','PL-10',480000,'Blue Ocean', 'Nellore',   180,86400, 23,'2024-03-06','harvested',80,66.0,112.2,1.70,'2024-03-07','Ananda Rao',      132000),
(110,9, 'B2024-H10','2024-02-20','PL-8', 520000,'Aqua Star',  'Vijayawada',162,84240, 22,'2024-03-13','harvested',84,70.8,120.4,1.70,'2024-03-14','Ravi Kumar Reddy',141600)
ON CONFLICT (id) DO NOTHING;

-- ── Farmers ────────────────────────────────────────────────
INSERT INTO farmers (id,name,phone,email,village,district,state,ponds,area_acres,experience,tank_id,total_buys,total_revenue) VALUES
(1,'Ravi Kumar Reddy','9876543210','ravi@gmail.com',  'Kankipadu', 'Krishna',      'AP',4,8, 12,1,3,346400),
(2,'Suresh Naidu',    '9876543211','suresh@gmail.com','Repalle',   'Guntur',       'AP',6,14,8, 2,2,206000),
(3,'Venkata Rao',     '9876543212','',               'Avanigadda','Krishna',      'AP',3,6, 5, 1,1,125000),
(4,'Lakshmi Prasad',  '9876543213','lp@gmail.com',   'Mandapeta', 'East Godavari','AP',8,20,15,3,1,126000),
(5,'Srinivas Murthy', '9876543214','',               'Bhimavaram','West Godavari','AP',5,12,7, 2,1,101200),
(6,'Kishore Babu',    '9876543215','kb@gmail.com',   'Narasapur', 'West Godavari','AP',4,9, 10,3,1,105600),
(7,'Ananda Rao',      '9876543216','',               'Palakollu', 'West Godavari','AP',7,16,18,1,1,122850)
ON CONFLICT (id) DO NOTHING;

-- ── Sales ──────────────────────────────────────────────────
INSERT INTO sales (id,batch_id,t_id,date,farmer_id,qty,pl_stage,price_per_k,total,payment_method,status,paid_amount,balance,invoice_no) VALUES
(1, 101,1,'2024-04-05',1,200000,'PL-24',450,90000, 'Bank','paid',   90000, 0,     'INV-2024-001'),
(2, 102,2,'2024-04-07',2,180000,'PL-23',480,86400, 'Cash','paid',   86400, 0,     'INV-2024-002'),
(3, 103,3,'2024-04-03',3,250000,'PL-25',500,125000,'Bank','partial',75000, 50000, 'INV-2024-003'),
(4, 104,4,'2024-04-08',4,300000,'PL-22',420,126000,'Cash','paid',   126000,0,     'INV-2024-004'),
(5, 105,6,'2024-04-12',5,220000,'PL-23',460,101200,'Bank','pending',0,     101200,'INV-2024-005'),
(6, 106,1,'2024-02-01',1,280000,'PL-24',430,120400,'Cash','paid',   120400,0,     'INV-2024-006'),
(7, 107,2,'2024-02-04',2,260000,'PL-25',460,119600,'Bank','paid',   119600,0,     'INV-2024-007'),
(8, 108,7,'2024-02-05',6,240000,'PL-24',440,105600,'Cash','paid',   105600,0,     'INV-2024-008'),
(9, 109,8,'2024-03-08',7,270000,'PL-23',455,122850,'Bank','paid',   122850,0,     'INV-2024-009'),
(10,110,9,'2024-03-15',1,310000,'PL-22',440,136400,'Cash','paid',   136400,0,     'INV-2024-010')
ON CONFLICT (id) DO NOTHING;

-- ── Staff ──────────────────────────────────────────────────
INSERT INTO staff (id,name,emp_id,role,dept,phone,email,qualification,join_date,salary,status,assigned_tanks,assigned_farmers) VALUES
(1, 'Mahesh Kumar', 'EMP-001','Technician','Operations',    '9988776655','mahesh@aqua.com', 'B.Sc Aquaculture','2022-01-15',22000,'active', '{1,2,3,4,5}',      '{1,3,7}'),
(2, 'Praveen Raju',  'EMP-002','Technician','Operations',    '9988776656','praveen@aqua.com','M.Sc Marine Bio', '2022-06-10',25000,'active', '{6,7,8,9,10,11}',  '{2,5}'),
(3, 'Subrahmanyam',  'EMP-003','Technician','Operations',    '9988776657','subbu@aqua.com',  'B.Sc Fisheries',  '2023-03-20',20000,'active', '{12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29}','{4,6}'),
(4, 'Rajesh Rao',    'EMP-004','Manager',   'Management',    '9988776658','rajesh@aqua.com', 'MBA Agribusiness','2021-08-01',45000,'active', '{}','{}'),
(5, 'Divya Lakshmi', 'EMP-005','Admin',     'Administration','9988776659','divya@aqua.com',  'B.Com',           '2022-03-05',18000,'active', '{}','{}'),
(6, 'Ramu Naidu',    'EMP-006','Worker',    'Operations',    '9988776660','',               '10th Pass',       '2023-01-10',12000,'active', '{}','{}'),
(7, 'Krishnam Raju', 'EMP-007','Worker',    'Operations',    '9988776661','',               '10th Pass',       '2023-06-15',11000,'active', '{}','{}'),
(8, 'Sunitha Devi',  'EMP-008','HR',        'HR',            '9988776662','sunitha@aqua.com','MBA HR',          '2022-09-01',28000,'active', '{}','{}'),
(9, 'Venkat Swamy',  'EMP-009','Worker',    'Operations',    '9988776663','',               '8th Pass',        '2024-01-20',11000,'active', '{}','{}'),
(10,'Padma Rao',     'EMP-010','Admin',     'Administration','9988776664','padma@aqua.com',  'B.Com Computer',  '2023-11-10',17000,'on-leave','{}','{}')
ON CONFLICT (id) DO NOTHING;

-- ── Maintenance ────────────────────────────────────────────
INSERT INTO maintenance (id,category,sub_category,date,description,cost,vendor,next_due,status,done_by) VALUES
(1,'RO Plant',  'Filter',    '2024-05-25','Membrane cleaning + filter replacement',3500, 'AquaPure Systems','2024-07-25','completed','AquaPure Tech'),
(2,'Generator', 'Oil Change','2024-05-20','Oil change, air filter, coolant',       4200, 'Kirloskar Service','2024-08-20','completed','Kirloskar Tech'),
(3,'Tank',      'Repair',    '2024-05-30','Crack repair lining Tank A-5',          8500, 'Local Contractor', NULL,        'completed','Ramu & Team'),
(4,'Tank',      'Pipe',      '2024-06-10','Pipe replacement Tank B-6',             3200, 'Local Contractor', NULL,        'scheduled','Ramu & Team'),
(5,'RO Plant',  'UV Lamp',   '2024-06-15','UV lamp replacement',                   2800, 'AquaPure Systems','2024-09-15','scheduled','AquaPure Tech'),
(6,'Generator', 'Diesel',    '2024-06-02','Diesel refill 200 litres',              18000,'HP Petrol Pump',   NULL,        'completed','Ramu Naidu'),
(7,'Electrical','Motor',     '2024-05-28','Aerator motor rewinding Shed A',        3800, 'Sai Electricals',  NULL,        'completed','Sai Electricals'),
(8,'Plumbing',  'Pipeline',  '2024-05-15','Water inlet pipe replacement Shed C',   5200, 'Kumar Plumbing',   NULL,        'completed','Kumar Plumbing')
ON CONFLICT (id) DO NOTHING;

-- ── Power Bills ────────────────────────────────────────────
INSERT INTO power_bills (id,month,year,units,amount,paid_date,status) VALUES
(1,'January', 2024,28400,184600,'2024-02-10','paid'),
(2,'February',2024,26800,174200,'2024-03-08','paid'),
(3,'March',   2024,29200,189800,'2024-04-12','paid'),
(4,'April',   2024,31500,204750,'2024-05-09','paid'),
(5,'May',     2024,30800,200200,NULL,'pending')
ON CONFLICT (id) DO NOTHING;

-- ── Monthly Summary ────────────────────────────────────────
INSERT INTO monthly_summary (month,year,revenue,cost,profit) VALUES
('Jan',2024,480000,340000,140000),
('Feb',2024,524000,370000,154000),
('Mar',2024,692000,430000,262000),
('Apr',2024,768000,480000,288000),
('May',2024,845000,510000,335000),
('Jun',2024,648000,390000,258000)
ON CONFLICT DO NOTHING;

-- ── Feed Inventory ─────────────────────────────────────────
INSERT INTO feed_inventory (id,brand,feed_type,stock_kg,purchase_date,cost_per_kg,supplier,expiry_date,min_stock) VALUES
(1,'CP Feeds',   'Starter 0.3mm', 480,'2024-05-28',280,'CP Group',      '2024-11-28',50),
(2,'Growel',     'Grower 0.5mm',  320,'2024-05-25',260,'Growel Aqua',   '2024-11-25',50),
(3,'CP Feeds',   'Finisher 0.8mm',42, '2024-05-20',245,'CP Group',      '2024-11-20',50),
(4,'Higashimaru','Starter 0.2mm', 200,'2024-05-30',310,'HM Aqua India', '2024-10-30',30)
ON CONFLICT (id) DO NOTHING;

-- ── Medicine Inventory ─────────────────────────────────────
INSERT INTO medicine_inventory (id,name,med_type,quantity,unit,cost_per_unit,expiry_date,supplier,min_stock) VALUES
(1,'EDTA',              'Mineral',  25,  'kg',200,'2025-03-15','Aqua Pharma',  10),
(2,'Bacillus Probiotic','Probiotic',8,   'kg',700,'2024-09-20','Bio Solutions', 5),
(3,'Vitamin C',         'Vitamin',  15,  'kg',900,'2025-01-10','Aqua Pharma',   5),
(4,'Zeolite',           'Mineral',  3,   'kg',50, '2026-01-01','Local Supplier',20),
(5,'Calcium Carbonate', 'Mineral',  40,  'kg',80, '2025-06-01','Aqua Pharma',  10),
(6,'Biofloc Probiotic', 'Probiotic',6,   'kg',650,'2024-08-15','Bio Solutions', 5)
ON CONFLICT (id) DO NOTHING;

-- ── Water Quality (sample) ─────────────────────────────────
INSERT INTO water_quality (id,t_id,date,shift,temp,salinity,do_value,ph,transparency,ammonia,nitrite,alkalinity,color,notes) VALUES
(1, 1,'2024-06-02','morning',  29.5,18,6.2,7.8,35,0.05,0.03,120,'Light Green','Normal'),
(2, 1,'2024-06-02','afternoon',31.2,18,5.8,8.1,32,0.06,0.04,118,'Light Green',''),
(3, 1,'2024-06-02','night',    28.8,18,6.5,7.9,36,0.04,0.03,122,'Light Green',''),
(4, 2,'2024-06-02','morning',  30.1,20,5.9,7.7,30,0.08,0.05,115,'Green',      'High ammonia'),
(5, 2,'2024-06-02','afternoon',31.5,20,5.6,8.0,28,0.09,0.05,113,'Green',      ''),
(6, 3,'2024-06-02','morning',  29.8,17,6.8,8.0,38,0.03,0.02,125,'Light Green','Excellent'),
(7, 4,'2024-06-02','morning',  30.5,19,5.5,7.6,28,0.12,0.07,110,'Dark Green', 'Treated'),
(8, 6,'2024-06-02','morning',  29.9,18,6.1,7.9,34,0.06,0.04,119,'Light Green','Good'),
(9, 7,'2024-06-02','morning',  30.2,19,5.8,7.8,31,0.07,0.04,116,'Green',      ''),
(10,8,'2024-06-02','morning',  29.6,17,6.4,8.1,37,0.04,0.02,123,'Light Green','Excellent'),
(11,9,'2024-06-02','morning',  29.4,18,6.6,7.9,36,0.03,0.02,124,'Light Green','Ready'),
(12,10,'2024-06-02','morning', 30.3,20,5.7,7.7,29,0.09,0.06,114,'Green',      ''),
(13,12,'2024-06-02','morning', 29.7,16,6.3,8.0,35,0.05,0.03,121,'Light Green','')
ON CONFLICT (id) DO NOTHING;

-- ── Feed Logs (sample) ─────────────────────────────────────
INSERT INTO feed_logs (id,t_id,date,shift,brand,feed_type,size,qty_g,cost_per_kg,cost,biomass,fcr,observation) VALUES
(1, 1,'2024-06-02','morning',  'CP Feeds',   'Starter', '0.3mm',2500,280,700, 41.0,1.52,'Good response'),
(2, 1,'2024-06-02','afternoon','CP Feeds',   'Starter', '0.3mm',3000,280,840, 41.0,1.52,'Excellent'),
(3, 1,'2024-06-02','night',    'CP Feeds',   'Starter', '0.3mm',2800,280,784, 41.0,1.52,'Normal'),
(4, 2,'2024-06-02','morning',  'Growel',     'Grower',  '0.5mm',3500,260,910, 33.8,1.40,'Good'),
(5, 2,'2024-06-02','afternoon','Growel',     'Grower',  '0.5mm',3800,260,988, 33.8,1.40,'Normal'),
(6, 3,'2024-06-02','morning',  'CP Feeds',   'Finisher','0.8mm',5000,245,1225,66.3,1.70,'Very active'),
(7, 4,'2024-06-02','morning',  'CP Feeds',   'Starter', '0.3mm',2200,280,616, 28.5,1.34,'Good'),
(8, 6,'2024-06-02','morning',  'Growel',     'Starter', '0.3mm',1900,280,532, 22.6,1.28,'Normal'),
(9, 7,'2024-06-02','morning',  'CP Feeds',   'Grower',  '0.5mm',3200,260,832, 37.2,1.50,'Good'),
(10,8,'2024-06-02','morning',  'CP Feeds',   'Grower',  '0.5mm',2800,260,728, 31.4,1.37,'Good'),
(11,9,'2024-06-02','morning',  'Growel',     'Finisher','0.8mm',4500,245,1103,48.2,1.50,'Excellent'),
(12,10,'2024-06-02','morning', 'CP Feeds',   'Grower',  '0.5mm',2400,260,624, 26.1,1.32,'Normal'),
(13,12,'2024-06-02','morning', 'Higashimaru','Starter', '0.2mm',2100,310,651, 35.5,1.44,'Good'),
(14,14,'2024-06-02','morning', 'CP Feeds',   'Finisher','0.8mm',4800,245,1176,62.8,1.60,'Pre-harvest')
ON CONFLICT (id) DO NOTHING;

-- ── Medicine Logs (sample) ─────────────────────────────────
INSERT INTO medicine_logs (id,t_id,date,name,med_type,dose,unit,method,reason,cost) VALUES
(1,1,'2024-05-28','EDTA',              'Mineral',  2,  'kg','Water treatment','Heavy metal control',400),
(2,2,'2024-05-30','Bacillus Probiotic','Probiotic',500,'g', 'Direct',          'Gut health',         350),
(3,4,'2024-06-01','Vitamin C',         'Vitamin',  200,'g', 'Premix with feed','Immunity boost',     180),
(4,3,'2024-06-02','Zeolite',           'Mineral',  5,  'kg','Water treatment','Ammonia control',     250),
(5,6,'2024-06-01','Biofloc Probiotic', 'Probiotic',300,'g', 'Direct',          'Water quality',      280),
(6,8,'2024-06-02','Calcium Carbonate', 'Mineral',  3,  'kg','Water treatment','Moulting support',   150),
(7,9,'2024-06-01','Vitamin C',         'Vitamin',  200,'g', 'Premix with feed','Pre-harvest stress', 180)
ON CONFLICT (id) DO NOTHING;

-- ── Tech Logs (sample) ─────────────────────────────────────
INSERT INTO tech_logs (date,t_id,morning_water,afternoon_water,night_water,feed_count,med_count,pl_count,score) VALUES
('2024-06-02',1,true,true, false,8,1,2,85),
('2024-06-02',2,true,true, true, 8,2,3,100),
('2024-06-02',3,true,false,false,6,0,1,60),
('2024-06-01',1,true,true, true, 9,2,4,100),
('2024-06-01',2,true,true, true, 8,1,2,95),
('2024-06-01',3,true,true, false,7,1,2,80)
ON CONFLICT DO NOTHING;

-- ── Feed Stock Purchases ───────────────────────────────────
INSERT INTO feed_stock (id,brand,feed_type,qty,unit,date,supplier,invoice_no,cost_per_kg,total_cost,expiry_date,notes) VALUES
(1,'CP Feeds',   'Starter 0.3mm', 500,'kg','2024-05-28','CP Group',      'INV-F001',280,140000,'2024-11-28','Good quality'),
(2,'Growel',     'Grower 0.5mm',  400,'kg','2024-05-25','Growel Aqua',   'INV-F002',260,104000,'2024-11-25',''),
(3,'CP Feeds',   'Finisher 0.8mm',300,'kg','2024-05-20','CP Group',      'INV-F003',245,73500, '2024-11-20',''),
(4,'Higashimaru','Starter 0.2mm', 250,'kg','2024-05-30','HM Aqua India', 'INV-F004',310,77500, '2024-10-30','Premium brand'),
(5,'CP Feeds',   'Starter 0.3mm', 300,'kg','2024-04-15','CP Group',      'INV-F005',275,82500, '2024-10-15',''),
(6,'Growel',     'Grower 0.5mm',  350,'kg','2024-04-20','Growel Aqua',   'INV-F006',255,89250, '2024-10-20',''),
(7,'CP Feeds',   'Finisher 0.8mm',200,'kg','2024-04-10','CP Group',      'INV-F007',240,48000, '2024-10-10',''),
(8,'Growel',     'Starter 0.3mm', 280,'kg','2024-03-18','Growel Aqua',   'INV-F008',270,75600, '2024-09-18','')
ON CONFLICT (id) DO NOTHING;

-- ── Medicine Stock Purchases ───────────────────────────────
INSERT INTO medicine_stock (id,name,med_type,qty,unit,date,supplier,invoice_no,cost_per_unit,total_cost,expiry_date,notes) VALUES
(1,'EDTA',              'Mineral',  30,  'kg','2024-05-15','Aqua Pharma',   'INV-M001',200,6000, '2025-03-15','Heavy metal control'),
(2,'Bacillus Probiotic','Probiotic',12,  'kg','2024-05-20','Bio Solutions', 'INV-M002',700,8400, '2024-09-20',''),
(3,'Vitamin C',         'Vitamin',  20,  'kg','2024-05-22','Aqua Pharma',   'INV-M003',900,18000,'2025-01-10','Immunity boost'),
(4,'Zeolite',           'Mineral',  50,  'kg','2024-04-10','Local Supplier','INV-M004',50, 2500, '2026-01-01','Ammonia control'),
(5,'Calcium Carbonate', 'Mineral',  60,  'kg','2024-05-01','Aqua Pharma',   'INV-M005',80, 4800, '2025-06-01','Moulting support'),
(6,'Biofloc Probiotic', 'Probiotic',10,  'kg','2024-05-10','Bio Solutions', 'INV-M006',650,6500, '2024-08-15',''),
(7,'EDTA',              'Mineral',  20,  'kg','2024-03-12','Aqua Pharma',   'INV-M007',195,3900, '2025-01-12',''),
(8,'Vitamin C',         'Vitamin',  15,  'kg','2024-03-18','Aqua Pharma',   'INV-M008',890,13350,'2024-12-18','')
ON CONFLICT (id) DO NOTHING;

-- ── General Inventory ──────────────────────────────────────
INSERT INTO general_inventory (id,category,name,qty,unit,date,supplier,cost_per_unit,total_cost,min_stock,notes) VALUES
(1, 'Chemicals','Lime (CaO)',            200,'kg', '2024-05-20','Local Agro',      25,  5000, 50, 'Pond disinfection'),
(2, 'Chemicals','KMnO4 (Potassium)',     15, 'kg', '2024-05-22','Aqua Pharma',     450, 6750, 10, 'Water treatment'),
(3, 'Fuel',     'Diesel',                500,'L',  '2024-06-02','HP Petrol Pump',  90,  45000,100,'Generator fuel'),
(4, 'Fuel',     'Diesel',                300,'L',  '2024-05-18','HP Petrol Pump',  89,  26700,100,''),
(5, 'Aeration', 'Air Diffuser Stones',   50, 'pcs','2024-05-10','Aqua Equipment',  180, 9000, 20, 'Tank aerators'),
(6, 'Aeration', 'Air Blower Pipes',      20, 'pcs','2024-05-10','Aqua Equipment',  350, 7000, 10, ''),
(7, 'Sampling', 'Sampling Net 500µm',    5,  'pcs','2024-04-15','Aqua Tools',      1200,6000, 3,  'Biomass sampling'),
(8, 'Sampling', 'Weighing Scale 5kg',    3,  'pcs','2024-04-10','Aqua Tools',      2500,7500, 2,  ''),
(9, 'Water Test','pH Test Kit',          12, 'pcs','2024-05-28','Aqua Lab',        250, 3000, 5,  ''),
(10,'Water Test','DO Meter Electrode',   2,  'pcs','2024-05-15','Aqua Lab',        3500,7000, 1,  'Replacement electrode'),
(11,'Packaging','Harvest Bags 40x60cm',  500,'pcs','2024-05-20','Pack Supplies',   12,  6000, 200,'Harvest packing'),
(12,'Packaging','Ice Boxes 20L',         30, 'pcs','2024-05-20','Pack Supplies',   450, 13500,10, '')
ON CONFLICT (id) DO NOTHING;
