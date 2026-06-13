# System Credentials

This file lists the pre-seeded credentials for testing the Apartment Visitor Management System in **Local Mock Mode** (default offline fallback).

---

## 1. System Roles Overview
*   **Admin**: Manages apartments, residents, guards, audit logs, and analytics.
*   **Security Guard**: Scans/approves visitor check-ins at the gate, marks check-outs.
*   **Resident**: Receives gate notifications, approves/rejects visitor requests.

> [!NOTE]
> In **Mock Mode**, password checking is bypassed for quick testing. You can type any password (e.g. `password123`) or click the quick-login buttons on the Sign In page.
>
> If you connect a **live Supabase DB**, use the email addresses below with the default seed password: **`password123`**.

---

## 2. Admin & Security Guards

### Admin Account
*   **Name**: Super Admin
*   **Email**: `admin@example.com`
*   **Password**: `password123` (Required only in Supabase Mode)
*   **Role**: ADMIN

### Security Guards Roster
*   **Guard 1**:
    *   **Name**: Guard Bahadur
    *   **Email**: `guard1@example.com`
    *   **Phone**: `+919988776651`
*   **Guard 2**:
    *   **Name**: Guard Singh
    *   **Email**: `guard2@example.com`
    *   **Phone**: `+919988776652`
*   **Guard 3**:
    *   **Name**: Guard Patil
    *   **Email**: `guard3@example.com`
    *   **Phone**: `+919988776653`

---

## 3. Resident Accounts (25 Flats: 5 Floors × 5 Doors)

Below is the layout of the 5 floors, showing the exact flat number, resident name, and email address for login.

### Floor 1
| Flat | Resident Name | Email Address | Phone Number |
| :--- | :--- | :--- | :--- |
| **101** | Amit Sharma | `resident1@example.com` | `+919876543200` |
| **102** | Priya Patel | `resident2@example.com` | `+919876543201` |
| **103** | Rajesh Kumar | `resident3@example.com` | `+919876543202` |
| **104** | Sneha Reddy | `resident4@example.com` | `+919876543203` |
| **105** | Vikram Singh | `resident5@example.com` | `+919876543204` |

### Floor 2
| Flat | Resident Name | Email Address | Phone Number |
| :--- | :--- | :--- | :--- |
| **201** | Deepa Nair | `resident6@example.com` | `+919876543205` |
| **202** | Rohan Mehta | `resident7@example.com` | `+919876543206` |
| **203** | Ananya Gupta | `resident8@example.com` | `+919876543207` |
| **204** | Sanjay Dutt | `resident9@example.com` | `+919876543208` |
| **205** | Kavita Rao | `resident10@example.com` | `+919876543209` |

### Floor 3
| Flat | Resident Name | Email Address | Phone Number |
| :--- | :--- | :--- | :--- |
| **301** | Aditya Verma | `resident11@example.com` | `+919876543210` |
| **302** | Nehal Jain | `resident12@example.com` | `+919876543211` |
| **303** | Sandhya Mishra | `resident13@example.com` | `+919876543212` |
| **304** | Arjun Sen | `resident14@example.com` | `+919876543213` |
| **305** | Meera Iyer | `resident15@example.com` | `+919876543214` |

### Floor 4
| Flat | Resident Name | Email Address | Phone Number |
| :--- | :--- | :--- | :--- |
| **401** | Karthik R | `resident16@example.com` | `+919876543215` |
| **402** | Shalini Joy | `resident17@example.com` | `+919876543216` |
| **403** | Vijay Mallya | `resident18@example.com` | `+919876543217` |
| **404** | Nisha Thomas | `resident19@example.com` | `+919876543218` |
| **405** | Rahul Dravid | `resident20@example.com` | `+919876543219` |

### Floor 5
| Flat | Resident Name | Email Address | Phone Number |
| :--- | :--- | :--- | :--- |
| **501** | Suresh Raina | `resident21@example.com` | `+919876543220` |
| **502** | Krunal Pandya | `resident22@example.com` | `+919876543221` |
| **503** | Hardik Pandya | `resident23@example.com` | `+919876543222` |
| **504** | Jasprit Bumrah | `resident24@example.com` | `+919876543223` |
| **505** | Rohit Sharma | `resident25@example.com` | `+919876543224` |

---

## 4. Pre-seeded Frequent Visitors (Trusted QR Codes)
These are recurring help/staff members pre-registered under specific residents:

*   **Raju Milkman** (Category: `COOK`, Host Flat: **101**):
    *   **Phone**: `+919988770011`
    *   **QR Passcode**: `FREQ-MILK-101-9988`
    *   **Status**: Active (Auto check-in allowed)
*   **Shanti Maid** (Category: `MAID`, Host Flat: **101**):
    *   **Phone**: `+919988770022`
    *   **QR Passcode**: `FREQ-MAID-101-7766`
    *   **Status**: Active (Auto check-in allowed)
*   **Ramesh Driver** (Category: `DRIVER`, Host Flat: **102**):
    *   **Phone**: `+919988770033`
    *   **QR Passcode**: `FREQ-DRIV-102-5544`
    *   **Status**: Active (Auto check-in allowed)
*   **Lata Cook** (Category: `COOK`, Host Flat: **201**):
    *   **Phone**: `+919988770044`
    *   **QR Passcode**: `FREQ-COOK-201-1122`
    *   **Status**: Inactive (Scan will reject as deactivated)

---

## 5. Blacklisted Visitors (Banned Entry Contacts)
These phone numbers are barred from checking in. Attempting to enter with these credentials triggers automatic gate rejection:

*   **Scammer Joe**:
    *   **Phone**: `+919000000000`
    *   **Reason**: Suspicious marketing activities inside the building
*   **Rude Delivery Rider**:
    *   **Phone**: `+919111111111`
    *   **Reason**: Altercation with guards at the main gate

