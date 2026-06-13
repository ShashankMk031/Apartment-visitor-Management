# VMS Live Demo Script & Playbook

Use this playbook to guide your team or stakeholders through a live demonstration of the Apartment Visitor Management System.

---

## 1. Quick Credentials Reference

For the demo, passwords are bypassable in **Local Mock Mode** (use `password123` in **Supabase Production Mode**).

| Role | Login Email | Name | Flat / Area |
| :--- | :--- | :--- | :--- |
| **Resident 1** | `resident1@example.com` | Amit Sharma | Flat `101` |
| **Resident 2** | `resident2@example.com` | Priya Patel | Flat `102` |
| **Resident 3** | `resident3@example.com` | Rajesh Kumar | Flat `103` |
| **Security Guard** | `guard1@example.com` | Guard Bahadur | Main Gate Desk |
| **System Admin** | `admin@example.com` | Super Admin | Management Office |

---

## 2. Interactive Demo Flow (Step-by-Step Script)

### Step 2.1: The Visitor Gate Check-in
*   **Action**: Go to the Public Gate Portal: `http://localhost:3000/public/visitor/apt-1`.
*   **Script**:
    1. Search for flat `103` and select **Rajesh Kumar (Flat 103)**.
    2. Fill in the form:
       * **Name**: `Alice Walker`
       * **Phone**: `+919876543210`
       * **Type**: `Guest`
       * **Purpose**: `Brought dinner`
    3. Click **Send Approval Request**.
    4. *Result*: Visitor is redirected to the **Live Access Tracker** page showing **PENDING** status. Explain that the resident has been notified instantly.

### Step 2.2: Resident Review & Real-time approval
*   **Action**: Open a new private tab/window and go to `/login`. Sign in as **Resident 3** (`resident3@example.com`).
*   **Script**:
    1. **Show Real-time Toast**: As soon as the dashboard loads, a toast appears: *"New Visitor Request: Alice Walker is waiting at the gate."*
    2. **Show Browser Notification**: Point out the desktop push notification (if permissions were accepted).
    3. **Show Navbar Bell Inbox**: Click the bell icon in the top right. Show the notification details and mark it as read.
    4. Click the green **Approve** button on Alice Walker's card.
    5. *Result*: The request moves to "Approved Passes".

### Step 2.3: Visitor Digital Pass & Badge
*   **Action**: Switch back to the Visitor tab (the tracker page).
*   **Script**:
    1. **Auto-Update**: Show that the page has refreshed automatically to **APPROVED** status.
    2. **Digital Pass**: Point out the generated **QR Access Pass** containing the scan passcode (e.g. `PASS-req-xxxx-1234`).
    3. **Copy Pass Link**: Click **Copy Pass Link** and show that the link is saved to clipboard.
    4. **Lookup Recovery**:
       * Close the visitor tab.
       * Navigate to `http://localhost:3000/public/pass-lookup`.
       * Enter phone `+919876543210` (or the request ID) and retrieve the pass.
       * *Result*: The system resolves the pass, timeline, and visitor badge instantly, demonstrating that guests never lose credentials even if they close their browser.

### Step 2.4: Security Guard WebRTC Scan & Check-in
*   **Action**: Open `/login` in a new window/tab and log in as **Guard 1** (`guard1@example.com`).
*   **Script**:
    1. **Camera Scanner**: Click the **Scan QR Code** button. Show the live camera overlay.
    2. **Scan Simulation**: Click **Simulate Scan: Valid Pass** (or type the pass code manually in the input box).
    3. **Roster Addition**: Confirm Alice Walker's details load and click **Confirm Check-In**.
    4. *Result*: Alice Walker appears in the **Inside Building** roster. Point out that the visitor tracking page now shows **INSIDE (Checked-in)**.

### Step 2.5: Emergency Panic Alert
*   **Action**: Go back to the **Resident 3** dashboard.
*   **Script**:
    1. **FAB Trigger**: Click the red floating **Trigger Emergency** button in the bottom right corner.
    2. Choose **Security Threat** or **Fire** and click **Trigger Alert Now**.
    3. **Guard Banner**: Switch to the **Guard Dashboard**:
       * *Result*: A bright red flashing header banner appears: *"🚨 ACTIVE EMERGENCY: FIRE at Flat 103 (Rajesh Kumar). Action required!"*
    4. **Resolution**: Click **Resolve** on the banner, confirm acknowledgment, and verify it clears. Show that the audit log registers the guard who resolved the panic event.

### Step 2.6: Visitor Blacklist Enforcement
*   **Action**: Log in as **Admin** (`admin@example.com`).
*   **Script**:
    1. Go to the **Blacklist Management** tab.
    2. Click **Add Blacklisted Visitor**:
       * **Name**: `Scammer Joe`
       * **Phone**: `+919000000000`
       * **Reason**: `Suspicious activities/unsolicited sales`
    3. Go to the Gate Portal and attempt to check in a visitor with phone number `+919000000000`.
    4. *Result*: The portal blocks request submission and pops up a warning: *"Access Denied: Visitor is blacklisted."* Show the Admin **Audit Logs** tab to prove the gate block attempt was audited.

### Step 2.7: Historical Search & Analytics
*   **Action**: Navigate to **History Search** on the Guard or Admin dashboard.
*   **Script**:
    1. Search for phone number `+919123456001` or name `Ramesh`.
    2. Click a search record to open the detailed modal.
    3. **Show Aggregate Metrics**: Point out **Total Visits**, **First Visit**, and **Last Visit** analytics.
    4. **Reports**: Under the admin dashboard widgets, click **Export PDF Report** or **Export CSV Report** to demonstrate automated compliance documentation.

### Step 2.8: Sandbox Demo Reset
*   **Action**: Go to the **Demo Mode** tab on the Admin dashboard.
*   **Script**:
    1. Explain that for testing purposes, we can inject mock check-ins or reset the entire memory space.
    2. Click **Reset Mock Database** to restore all initial data back to a clean state.
