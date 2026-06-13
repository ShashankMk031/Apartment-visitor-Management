# VMS Architecture Documentation

This document describes the application architecture, database relationships, and key visitor check-in flows in the Apartment Visitor Management System.

---

## 1. System Architecture Diagram

The system follows a modern decoupled React/Next.js client architecture with dual-mode data adapters supporting both local storage (Mock Mode) and Supabase (Production Mode).

```mermaid
graph TD
    subgraph Client [Next.js App Router Client]
        UI[Page Components & UI Layouts]
        State[React Hooks & Component State]
        Adapter{Database Adapter}
    end

    subgraph MockStorage [Mock Database Engine]
        MockDB[mockDb.ts Local Memory Wrapper]
        LS[Browser LocalStorage Cache]
    end

    subgraph SupabaseDB [Production Database Engine]
        SBA[Supabase Auth Services]
        SBT[Supabase Client SDK]
        PostgreSQL[(Supabase PostgreSQL Data Tables)]
    end

    UI --> State
    State --> Adapter
    Adapter -- "offline mode" --> MockDB
    MockDB <--> LS
    Adapter -- "online mode" --> SBT
    SBT <--> SBA
    SBT <--> PostgreSQL
```

---

## 2. Database Schema Relationships

Here is the database schema mapping including the new tables (`frequent_visitors`, `blacklisted_visitors`, `emergency_alerts`) and audit tables:

```mermaid
erDiagram
    apartments {
        uuid id PK
        text name
        text address
        timestamp created_at
    }

    profiles {
        uuid id PK
        text full_name
        text email
        text role "ADMIN, RESIDENT, GUARD"
        timestamp created_at
    }

    residents {
        uuid id PK "Ref profiles.id"
        uuid apartment_id FK
        text flat_number
        text phone
        timestamp created_at
    }

    security_guards {
        uuid id PK "Ref profiles.id"
        uuid apartment_id FK
        text phone
        timestamp created_at
    }

    visitor_requests {
        uuid id PK
        uuid resident_id FK
        text visitor_name
        text visitor_phone
        text visitor_type "GUEST, DELIVERY, etc."
        text purpose
        text vehicle_number
        integer number_of_visitors
        integer expected_duration
        text status "PENDING, APPROVED, REJECTED, EXPIRED"
        timestamp approval_time
        text qr_code_pass
        timestamp created_at
    }

    visitor_entries {
        uuid id PK
        uuid visitor_request_id FK
        timestamp entry_time
        timestamp exit_time
        uuid entered_by_guard FK "Ref security_guards.id"
        uuid exited_by_guard FK "Ref security_guards.id"
    }

    frequent_visitors {
        uuid id PK
        uuid resident_id FK "Ref residents.id"
        text full_name
        text phone
        text category "COOK, MAID, DRIVER, etc."
        text notes
        text qr_code "FREQ-XXXX-XXXX"
        boolean is_active
        timestamp created_at
    }

    blacklisted_visitors {
        uuid id PK
        text full_name
        text phone
        text reason
        uuid created_by FK "Ref profiles.id"
        timestamp created_at
    }

    emergency_alerts {
        uuid id PK
        uuid resident_id FK "Ref residents.id"
        text alert_type "MEDICAL, FIRE, etc."
        text status "ACTIVE, RESOLVED"
        uuid resolved_by FK "Ref profiles.id"
        timestamp resolved_at
        timestamp created_at
    }

    audit_logs {
        uuid id PK
        uuid actor_id FK "Ref profiles.id"
        text actor_name
        text action_type "APPROVE, REJECT, ENTRY, EXIT, ADMIN_ACTION"
        text description
        timestamp created_at
    }

    notifications {
        uuid id PK
        uuid recipient_id FK "Ref profiles.id"
        text title
        text message
        boolean read
        timestamp created_at
    }

    apartments ||--o{ residents : contains
    apartments ||--o{ security_guards : employs
    residents ||--o{ visitor_requests : hosts
    residents ||--o{ frequent_visitors : registers
    residents ||--o{ emergency_alerts : triggers
    visitor_requests ||--o{ visitor_entries : logs
    profiles ||--o| residents : extends
    profiles ||--o| security_guards : extends
```

---

## 3. Visitor Check-in Workflows

### Standard Check-In Flow
```mermaid
sequenceDiagram
    actor Visitor
    actor Guard
    actor Resident
    participant App as VMS Gate Portal

    Visitor->>App: Submits Request at Main Gate
    App->>Resident: Real-time Notification Triggered
    Note over Resident: Reviews details on dashboard
    Resident->>App: Approves Request
    App-->>Visitor: Digital Pass (Passcode & QR) generated
    Visitor->>Guard: Presents Pass Code at Guard Desk
    Guard->>App: Enters/Scans Code
    App-->>Guard: Displays Approval Confirmation
    Guard->>App: Confirms Check-In
    Note over App: Visitor is logged as "Inside"
```

### Trusted Entry Flow (Frequent Visitors)
```mermaid
sequenceDiagram
    actor Helper as Frequent Helper
    actor Guard
    participant App as VMS Gate Portal

    Note over Helper: Presents Permanent QR Pass (FREQ-...)
    Helper->>Guard: Shows QR Pass
    Guard->>App: Scans/Enters QR Pass
    Note over App: Validates Active & Resident association
    Note over App: Auto-creates approved visitor request
    App-->>Guard: Checks in visitor immediately
    Note over App: Visitor is logged as "Inside"
```

### Blacklisted Visitor Attempt Flow
```mermaid
sequenceDiagram
    actor Visitor as Blacklisted Visitor
    participant App as VMS Gate Portal

    Visitor->>App: Attempts submission with phone number
    Note over App: Queries blacklisted_visitors table
    App-->>Visitor: Renders warning dialog (Access Denied)
    Note over App: Rejects entry request creation
    Note over App: Logs system audit report
```
