# ModularPro — Interior Modular Factory Management SaaS

A multi-tenant SaaS platform for interior modular furniture factory owners.

## Architecture

```
FactoryPlatform/
├── frontend/        React 19 + Vite — Tenant workspace UI
├── backend/         Node.js + Express — API server & Super Admin
├── supabase/        PostgreSQL schema, RLS policies, Edge Functions
└── docker-compose.yml
```

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase project (free tier works)

### 1. Database Setup
Run `supabase/migrations/001_schema.sql` in your Supabase SQL editor.

### 2. Backend
```bash
cd backend
cp .env.example .env   # fill in Supabase credentials + secrets
npm install
npm run dev            # runs on :4000
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env   # fill in Supabase URL/key + backend URL
npm install
npm run dev            # runs on :5173
```

## Environment Variables

### Backend `.env`
```
PORT=4000
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=your-jwt-secret-min-32-chars
FRONTEND_URL=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=app-password
RAZORPAY_KEY_ID=rzp_xxx
RAZORPAY_KEY_SECRET=xxx
```

### Frontend `.env`
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:4000
```

## Features — Part A (Tenant)
- A1  Client & Project Management
- A2  Cut List Generation & Designer Workflow
- A3  Cut List Validation
- A4  Hardware Management
- A5  Client Proposals & Quotation PDF
- A6  Production Workflow Engine
- A7  Material & Inventory Management
- A8  Employee Management
- A9  Machine Maintenance
- A10 Dispatch & Transport
- A11 Accounting & Billing (GST/Tally export)
- A12 Workflow Analytics
- A13 Tenant User Management

## Features — Part B (Super Admin)
- B1  Tenant Provisioning
- B2  Subscription & Billing Plans
- B3  Tenant Overview Dashboard
- B4  Business Volume Tracking
- B5  Platform-Wide Analytics
- B6  Tenant Management Actions
- B7  Alerts & Notifications
