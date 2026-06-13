# Manual Testing Playbook

Follow this step-by-step playbook to manually test the Apartment Visitor Management System end-to-end.

---

## Prerequisites
1. Start the Next.js development server:
   ```bash
   npm run dev
   ```
2. Open your web browser and go to: [http://localhost:3000](http://localhost:3000)

---

## Test Scenario 1: Visitor Lifecycle (End-to-End Gate Entry & Exit)

This scenario tests the entire check-in and check-out workflow between a Visitor, Resident, and Guard.

### Step 1: Submit Visitor Request (Gate Check-In)
1. Open the landing page at [http://localhost:3000](http://localhost:3000).
2. Click the **"New Gate Check-in"** button. This opens the gate portal at `http://localhost:3000/public/visitor/apt-1`.
3. Locate the flat selection field.
4. Type `101` and select **Amit Sharma (Flat 101)**.
5. Complete the visitor request form:
   * **Visitor Name**: `Jane Doe`
   * **Phone**: `+919999988888`
   * **Visitor Type**: Choose `Guest` or `Delivery`
   * **Purpose of Visit**: `Visiting for lunch`
   * **Number of Visitors**: `1`
6. Click **Submit Request**.
7. You will be redirected to the public tracking page: `http://localhost:3000/public/tracking/req-...`.
8. **Verify**: The status shows **PENDING Approval**, indicating that the resident is reviewing the request.

---

### Step 2: Approve Request (Resident Dashboard)
1. Open a new tab or private browser window and go to the sign-in page: [http://localhost:3000/login](http://localhost:3000/login).
2. Scroll to the bottom and click the **Resident 1** quick-access button (or sign in manually with `resident1@example.com`). This logs you in as Amit Sharma (Flat 101).
3. **Verify**:
   * A toast slide-out appears: *"New Visitor Request: Jane Doe is waiting at the gate."*
   * Under the **"Pending Approvals"** tab on your dashboard, Jane Doe's request is visible.
4. Click the green **"Approve"** button.
5. **Verify**: The request disappears from the "Pending Approvals" tab and moves to the "Approved Passes" tab.

---

### Step 3: Get QR Pass (Visitor View)
1. Go back to your first browser tab (the visitor tracking page).
2. **Verify**:
   * The page automatically refreshes to display **APPROVED** status.
   * A **Digital Gate Pass** card is rendered containing a 4-digit Pass Code (e.g. `PASS-req-xx-1234`) and a QR Code.
   * A printable **Visitor Badge** is visible.
3. Note or copy the **Pass Code** shown.

---

### Step 4: Process Entry (Guard Desk)
1. Open a new tab/window and go to the sign-in page: [http://localhost:3000/login](http://localhost:3000/login).
2. Scroll to the bottom and click the **Guard 1** quick-access button (or sign in manually with `guard1@example.com`).
3. Under the **"Verify Visitor Code"** section on the left, type the **Pass Code** you copied in Step 3 (or click the mock scan button).
4. Click **"Verify Pass"**.
5. **Verify**: Jane Doe's request is loaded, displaying details such as name, flat number, and status.
6. Click the green **"Check In Visitor"** button.
7. **Verify**: Jane Doe is added to the **"Inside Building"** roster on the guard desk.
8. Go back to the visitor tracking tab: **Verify** that the status has updated to **INSIDE (Checked-in)**.

---

### Step 5: Process Exit (Guard Desk)
1. On the Guard Desk page, look at the **"Inside Building"** list.
2. Locate Jane Doe's entry card.
3. Click the blue **"Mark Exit"** button.
4. **Verify**: Jane Doe is removed from the active roster and added to the Guard logs list at the bottom.
5. Go back to the visitor tracking tab: **Verify** that the status now displays **COMPLETED (Checked-out)**.

---

## Test Scenario 2: Admin Operations & Reports

This scenario validates the reporting and auditing capability.

1. Go to the login page: [http://localhost:3000/login](http://localhost:3000/login).
2. Click the **Admin** quick-access button (or log in with `admin@example.com`).
3. **Verify Dashboard Charts**:
   * Inspect the visual graphs for daily entries, monthly entries, visitor types, and approval rates.
4. **Export Reports**:
   * Under the analytics charts, click **"Export PDF Report"** and **"Export CSV Report"**.
   * **Verify**: The browser triggers file downloads for the respective visitor logs.
5. **Audit Logs**:
   * Click the **"Audit Logs"** link in the side navigation panel.
   * **Verify**: All activities performed in Test Scenario 1 (the approval, gate entry check-in, and gate exit check-out) are logged with names and timestamps.
6. **Roster Management**:
   * Click **"Residents"** or **"Guards"** in the sidebar.
   * Add a new resident or guard, then verify they appear in the management lists.

---

## Test Scenario 3: Frequent Visitors / Trusted Entry

This scenario tests the resident self-registration of staff and automatic check-in.

1. Log in as **Resident 1** (`resident1@example.com`).
2. Navigate to the **"Frequent Visitors"** tab on the Resident dashboard.
3. Click **"Add Frequent Visitor"** and enter:
   * **Full Name**: `Raju Milkman`
   * **Phone**: `+919988770011`
   * **Category**: Choose `Cook` or `Maid`
   * **Notes**: `Comes daily at 7 AM`
4. Click **Add Visitor**.
5. **Verify**: The new staff card is displayed showing name, category, status, and a **"View QR Pass"** button.
6. Click **"View QR Pass"**:
   * **Verify**: A QR pass dialog appears with a permanent code e.g. `FREQ-MILK-...`.
7. Log out and log in as **Guard 1** (`guard1@example.com`).
8. On the Guard Console, locate **"Verify Visitor Code"** on the left.
9. Type the QR Passcode `FREQ-MILK-101-9988` (or your newly generated frequent QR passcode) and click **"Verify Pass"**.
10. **Verify**: The system automatically approves and checks in the visitor *without* sending a request to the resident.
11. **Verify**: The visitor appears in the **"Inside Building"** list on the Guard Console.

---

## Test Scenario 4: Browser Notifications & Dropdown Navbar Inbox

This scenario validates desktop alerts and the centralized notification dropdown.

1. Log in as **Resident 1** (`resident1@example.com`).
2. **Verify Browser Notification prompt**:
   * The page should request permission to show notifications. Click **Allow**.
3. Keep the Resident dashboard open.
4. Open a private tab, go to the public gate check-in page `http://localhost:3000/public/visitor/apt-1`.
5. Submit a request to Flat **101** (Amit Sharma) for visitor `David Swiggy`.
6. Switch back to the Resident dashboard:
   * **Verify**: A native OS/browser push notification pops up saying *"Visitor Waiting: David Swiggy is waiting at Flat 101."*
   * **Verify**: The bell icon in the top right navbar shows an updated red badge count.
7. Click the **Bell Icon** dropdown:
   * **Verify**: The notification is listed. Click **"Mark as read"** or **"Mark all as read"** and verify the red badge clears.

---

## Test Scenario 5: Camera QR Scanner on Guard Console

This scenario tests the browser-based WebRTC camera scanner frame.

1. Log in as **Guard 1** (`guard1@example.com`).
2. On the Guard dashboard, locate the **"Verify Visitor Code"** section and click the **"Scan QR Code"** button (looks like a camera icon).
3. **Verify**:
   * A scanner dialog overlay opens.
   * If a camera is present, it prompts for camera access. Click **Allow**.
   * Controls are available to "Start Camera", "Stop Camera", "Switch Camera", and a textbox fallback is provided.
4. For rapid mock verification without a real physical printed QR code, click **"Simulate Scan: Valid Pass"** or **"Simulate Scan: Frequent Visitor"** inside the dialog.
5. **Verify**: The scanner automatically captures the code, closes the camera stream, decodes the details, and loads the visitor card for check-in.

---

## Test Scenario 6: Visitor History Search

This scenario tests the historical search query engine.

1. Log in as **Guard 1** (`guard1@example.com`) or **Admin** (`admin@example.com`).
2. Navigate to the **"History Search"** tab.
3. Try searching with various query combinations:
   * Search by **Phone**: Enter `+919123456001`.
   * Search by **Name**: Enter `Ramesh`.
   * Search by **Flat**: Enter `101`.
   * Filter by **Date Range**: Select yesterday and today.
4. **Verify**:
   * Search results populate instantly.
   * Clicking a search item loads the visitor history detail modal showing: **Total Visits**, **First Visit**, and **Last Visit** timestamps.

---

## Test Scenario 7: Visitor Blacklist & Blocked Entry

This scenario tests the admin blacklist controls and entry validation.

1. Log in as **Admin** (`admin@example.com`).
2. Navigate to the **"Blacklist Management"** tab.
3. Click **"Add Blacklisted Visitor"** and enter:
   * **Name**: `Scammer Joe`
   * **Phone**: `+919000000000`
   * **Reason**: `Spamming residents with advertisements.`
4. Click **Blacklist Visitor**.
5. Log out and go to the public check-in gate portal `http://localhost:3000/public/visitor/apt-1`.
6. Try to submit a visitor request to any flat with phone number `+919000000000`.
7. **Verify**:
   * The request is automatically rejected.
   * A red warning modal appears saying: *"Access Denied: Visitor has been blacklisted. The security desk has been notified."*
8. Log in as **Admin** (`admin@example.com`), go to **"Audit Logs"**:
   * **Verify**: There is a system log: *"Blocked entry attempt by blacklisted visitor: Scammer Joe (+919000000000)..."*

---

## Test Scenario 8: Emergency Alert System

This scenario tests the resident panic button and guard resolution.

1. Log in as **Resident 1** (`resident1@example.com`).
2. Locate the red **"Trigger Emergency"** floating button (FAB) in the bottom right corner.
3. Click the button. A modal pops up.
4. Select **"Fire"** or **"Security Threat"** and click **"Trigger Alert Now"**.
5. Log out and log in as **Guard 1** (`guard1@example.com`).
6. **Verify**:
   * A prominent, red flashing emergency banner appears at the top of the screen: *"🚨 ACTIVE EMERGENCY: FIRE at Flat 101 (Amit Sharma). Action required!"*
7. Click the **"Resolve"** button on the banner or under the emergency alerts log.
8. Click **"Acknowledge & Resolve"** in the confirmation modal.
9. **Verify**: The flashing banner disappears, and the audit log records the resolution event.

---

## Test Scenario 9: Demo Enhancements

This scenario tests the sandboxed mock databases and visual states.

1. Log in as **Admin** (`admin@example.com`).
2. Navigate to the **"Demo Mode"** section.
3. **Verify Demo Stats Card**:
   * Displays count of registered Apartments, Residents, Guards, and total Visitors in system database.
4. Click **"Inject Mock Entry"** or **"Trigger Blacklist entry demo"** buttons to run custom simulation events.
5. Click **"Reset Mock Database"** to restore all initial clean datasets.
6. Refresh the page:
   * **Verify**: Dashboard graphs show loading skeleton blocks during simulated queries, providing high visual polish.

