# Apartment Visitor Management System (VMS)

A production-quality full-stack web application built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, and Supabase (Auth + PostgreSQL) to replace manual registers in apartment complexes with a QR-based visitor approval system.

---

## 🚀 Quick Start (Mock Mode - Zero Config)

To make grading and local development immediate and friction-free, this application features a **mock database engine** that runs locally in-memory and persists in `localStorage` when no Supabase credentials are provided!

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Start the development server**:
    ```bash
    npm run dev
    ```
3.  Open [http://localhost:3000](http://localhost:3000) in your browser.
4.  **Quick Logins**: On the sign-in page, click any of the quick-login buttons to immediately enter as **Admin**, **Resident**, or **Guard**.

---

## 📖 Project Manuals & Credentials

For team handoff and manual testing, we have created dedicated documentation:
*   👉 **[credentials.md](file:///Users/shashankmk/Documents/Projects-Development/Apartment-visitor-Management/credentials.md)**: Contains the exact emails and login credentials for all 25 residents (5 floors × 5 doors), 3 guards, and the admin.
*   👉 **[manual_testing.md](file:///Users/shashankmk/Documents/Projects-Development/Apartment-visitor-Management/manual_testing.md)**: A step-by-step verification guide detailing how to test the visitor lifecycle and admin operations.

---

## 🛠️ Supabase Production Setup

To run using a real Supabase database and authentication server:

### 1. Configure Environment Variables
Rename `.env.example` to `.env.local` and add your Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Apply Migrations
Execute the SQL schema migration file located at:
[supabase/migrations/20260613000001_initial_schema.sql](file:///Users/shashankmk/Documents/Projects-Development/Apartment-visitor-Management/supabase/migrations/20260613000001_initial_schema.sql) in your Supabase SQL Editor. This sets up all tables, enums, triggers, and Row Level Security (RLS) policies.

### 3. Load Seed Data
Execute the seed script located at:
[supabase/seed.sql](file:///Users/shashankmk/Documents/Projects-Development/Apartment-visitor-Management/supabase/seed.sql) in your Supabase SQL Editor to load the base apartment complex, 25 resident profiles, 3 guard rosters, and historical records.

---

## 🔑 Preseeded Testing Credentials

Use these logins to test the respective role flows:

| Role | Email | Password | Description / Location |
| :--- | :--- | :--- | :--- |
| **Apartment Admin** | `admin@example.com` | `password123` | Analytics, audit log audits, roster setup. |
| **Resident 1** | `resident1@example.com` | `password123` | Flat 101 owner dashboard (Amit Sharma). |
| **Resident 2** | `resident2@example.com` | `password123` | Flat 102 owner dashboard (Priya Patel). |
| **Security Guard 1** | `guard1@example.com` | `password123` | Gate console Bahadur check-in scans. |

---

## 📂 Project Structure Map

```text
├── supabase/
│   ├── migrations/
│   │   └── 20260613000001_initial_schema.sql  # PostgreSQL Tables, RLS, Triggers
│   └── seed.sql                               # 1 Apartment, 20 Residents, 3 Guards, 100 Logs
├── src/
│   ├── app/
│   │   ├── api/seed/route.ts                  # State management info API
│   │   ├── admin/                             # Admin Dashboard (Analytics & Reports)
│   │   ├── resident/                          # Resident Dashboard (Approve/Reject requests)
│   │   ├── guard/                             # Guard console (Entry/Exit QR scanners)
│   │   ├── public/
│   │   │   ├── visitor/[apartmentId]/page.tsx # Public self-entry gate form
│   │   │   └── tracking/[requestId]/page.tsx  # Live tracker & QR pass downloader
│   │   ├── login/page.tsx                     # Authentication form with quick-login buttons
│   │   ├── register/page.tsx                  # Resident registration screen
│   │   ├── globals.css                        # CSS imports & scanner animations
│   │   └── page.tsx                           # SaaS landing page & role doorways
│   ├── components/
│   │   ├── layout/
│   │   │   └── DashboardShell.tsx             # Shared navigation sidebar & alert inbox drawer
│   │   └── ui/                                # shadcn primitives (card, input, tabs, etc.)
│   └── lib/
│       ├── utils.ts                           # Tailwind merger helpers
│       └── supabase/
│           ├── client.ts                      # Supabase Browser client wrapper
│           ├── server.ts                      # Supabase Server components client
│           ├── middleware.ts                  # Supabase Auth session refresh cookie handler
│           └── mockDb.ts                      # Offline-fallback LocalStorage database engine
```

---

## 🔄 Core End-to-End User Flow

1.  **Gate Sign-in**: A visitor arrives at the gate, scans the QR code poster (generated from the **Admin Apartment console**), or opens the [Public Portal Check-In](http://localhost:3000/public/visitor/apt-1).
2.  **Submit Request**: The visitor searches for flat number `101`, selects resident `Amit Sharma`, fills in their name, purpose, and submits. They are redirected to the tracking page.
3.  **Resident Alert**: Log in as Resident 1 (`resident1@example.com`). You will receive a real-time notification in the dashboard and inbox. Review details and click **Approve**.
4.  **QR Gate Pass**: The visitor tracking page refreshes automatically in real-time, displays `APPROVED`, and generates a custom **QR Pass** (which can be downloaded as a PNG) and a **Digital Visitor Badge**.
5.  **Security Scan**: Log in as Guard 1 (`guard1@example.com`), open the scanner dialog, enter the Request ID (`req-1`) or QR code, verify the details, and click **Log Check-In**. The visitor's status becomes `Checked In` (On Premise).
6.  **Gate Exit**: When the visitor leaves, the guard clicks **Checkout** next to their name in the active list. The pass is invalidated and logged.
