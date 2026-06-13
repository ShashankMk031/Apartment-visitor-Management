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
