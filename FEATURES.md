# Apartment Visitor Management System - Feature Implementations

This document describes the design, implementation, and usage of the 7 new feature enhancements added to the Visitor Management System (VMS).

---

## FEATURE 1: Frequent Visitors / Trusted Visitors

Residents can register recurring service providers or trusted family members to bypass standard security call-outs.

### Database Schema
```sql
CREATE TABLE public.frequent_visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID REFERENCES public.residents(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    category TEXT NOT NULL, -- MAID, DRIVER, COOK, PARENTS, RELATIVES, HELP, TRAINER, OTHER
    notes TEXT,
    qr_code TEXT NOT NULL UNIQUE, -- Unique code prefix (FREQ-XXXX-XXXX)
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### Key Mechanisms
- **Resident Dashboard Management**: A resident can view their active staff list, add new ones (which automatically generates a unique `FREQ-` QR passcode), toggle active/inactive status, or delete records.
- **Guard Pass Scan**: Guards can scan or enter a frequent visitor QR passcode.
- **Seamless Integration**: To avoid database schema breaking changes, when a frequent visitor is scanned, the system creates an auto-approved `visitor_requests` record for the host resident. This ensures that the visitor entry flow, checkout logs, audit trails, and analytics dashboard charts remain 100% functional without modifying existing schema constraints.

---

## FEATURE 2: Browser Notifications & Notification Center

Residents receive real-time updates directly on their desktops or device screens, even if they are focused on other tabs.

### Key Mechanisms
- **Native Browser Notification API**: As soon as the resident logs in, the dashboard requests permission to trigger desktop notifications.
- **Real-time Push**: When a gate request is submitted by a visitor, the app checks if permission is granted and plays a native push notification (e.g. *"Jane Doe is waiting at Flat 101"*). If denied or on legacy browsers, it gracefully falls back to toast notifications.
- **Centralized Dropdown Navbar Inbox**: A bell icon in the dashboard shell tracks unread notification count. Clicking it opens a list of notifications with individual "Mark as read" and "Mark all as read" buttons, syncing with the database.

---

## FEATURE 3: Camera QR Scanner

Guards can quickly verify passes using a physical device camera instead of manual typing.

### Key Mechanisms
- **WebRTC and MediaDevices API**: Invokes the browser's native camera input via `navigator.mediaDevices.getUserMedia` overlaying a premium viewfinder frame.
- **Toggles & Adapters**: Supports switching cameras (front/rear) on smartphones and toggling the stream on/off to preserve battery.
- **Mock Simulator**: For developer testing without a physical webcam, the scanner overlay includes buttons to simulate scanning a valid pass or frequent visitor code, ensuring rapid quality assurance.
- **Fallback**: Guard can switch to manual code entry at any time if camera access is unavailable.

---

## FEATURE 4: Visitor History Search

Allows security guards and administrators to look up past visitor entries to track frequencies and dates.

### Key Mechanisms
- **Multi-Query Engine**: Search by Phone Number, Visitor Name, Flat Number, or Date Range.
- **Aggregate Analytics**: Selecting any search result opens a detail card displaying:
  * Total Visits count
  * First Visit timestamp
  * Last Visit timestamp
  * Full detailed list of all entry and exit occurrences.

---

## FEATURE 5: Visitor Blacklist

Allows apartment administrators to ban malicious or suspicious individuals from entering the premises.

### Database Schema
```sql
CREATE TABLE public.blacklisted_visitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    reason TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### Key Mechanisms
- **Admin Management Panel**: Administrators can view, add, or search blacklisted visitors.
- **Gate Check Validation**: When a visitor attempts to submit an entry request at the public portal, the system checks the blacklist database (both mock and Supabase). If a match is found, request creation is blocked, a warning popup is shown to the visitor, and a system audit log is recorded.

---

## FEATURE 6: Emergency Alert System

Provides residents with a quick-access panic button to instantly alert guards and admins.

### Database Schema
```sql
CREATE TABLE public.emergency_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID REFERENCES public.residents(id) ON DELETE CASCADE NOT NULL,
    alert_type TEXT NOT NULL, -- MEDICAL, SECURITY, FIRE, OTHER
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, RESOLVED
    resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### Key Mechanisms
- **Floating Action Button (FAB)**: A red emergency panic button is pinned to the bottom right of the Resident Dashboard. Clicking it allows selecting the incident type (Medical, Security Threat, Fire, Other).
- **Flashing Banner Notification**: Triggering an emergency places a persistent, bright red flashing banner across all Guard and Admin dashboards showing the exact flat location, resident name, and emergency type.
- **Resolution Control**: Guards or Admins can click "Resolve Alert" on the banner, marking it resolved in the database and logging the actor who closed the ticket.

---

## FEATURE 7: Demo Mode Enhancements

Introduces widgets and sandbox injectors to demonstrate VMS capabilities seamlessly in offline mock mode.

### Key Mechanisms
- **Database Stat Widgets**: Admin dashboard displays counts of Apartments, Residents, Guards, and total Visitors.
- **Loading Skeletons**: Tailwind-based shimmer skeletons are rendered while statistics, charts, or lists are simulated loading.
- **Mock Injectors**: Buttons to trigger mock database actions (e.g. inject an entry, trigger blacklist entry attempt) for debugging.
- **DB Reset**: A "Reset Mock Database" action restores all initial seed records instantly.
