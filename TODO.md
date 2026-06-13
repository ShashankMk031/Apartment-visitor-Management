# TODO - Final Verification & Edge Cases

## Priority 0 - Submission Blockers

These must work before pushing to GitHub.

### Core Visitor Flow

- [x] Visitor can access public visitor portal
- [x] Apartment selection works
- [x] Flat selection works
- [x] Resident search works
- [x] Visitor request form submits successfully
- [x] Tracking page is created after submission
- [x] Request status starts as PENDING

### Resident Flow

- [x] Resident login works
- [x] Resident only sees requests for their flat
- [x] Resident can approve request
- [x] Resident can reject request
- [x] Dashboard updates after approval/rejection

### Visitor Tracking

- [x] Tracking page refreshes correctly
- [x] PENDING status visible
- [x] APPROVED status visible
- [x] REJECTED status visible
- [x] INSIDE status visible
- [x] COMPLETED status visible

### QR Pass

- [x] QR generated after approval
- [x] QR image renders correctly
- [x] QR contains valid pass code
- [x] Pass code can be copied
- [x] Pass remains accessible after page refresh

### Guard Flow

- [x] Guard login works
- [x] Guard can verify pass
- [x] Guard can check in visitor
- [x] Guard can check out visitor
- [x] Visitor appears in Inside Building list
- [x] Visitor removed after checkout

### Admin Flow

- [x] Admin login works
- [x] Dashboard loads
- [x] Analytics charts render
- [x] Resident management works
- [x] Guard management works
- [x] Audit logs visible

---

## Priority 1 - Security Checks

### Route Protection

- [x] Unauthenticated user cannot access /admin
- [x] Unauthenticated user cannot access /resident
- [x] Unauthenticated user cannot access /guard

### Role Protection

- [x] Resident cannot access admin routes
- [x] Resident cannot access guard routes
- [x] Guard cannot access admin routes
- [x] Guard cannot access resident routes

### Data Isolation

- [x] Resident A cannot see Resident B requests
- [x] Apartment A cannot access Apartment B data
- [x] Visitor cannot access random tracking pages

---

## Priority 2 - Form Validation

### Visitor Form Validation

- [x] Empty visitor name rejected
- [x] Empty phone number rejected
- [x] Empty purpose rejected
- [x] Invalid phone number format verified
- [x] Excessively long input handled safely

### Search Validation

- [x] Invalid flat search handled
- [x] Non-existent resident handled
- [x] Empty search handled

---

## Priority 3 - Edge Cases

### Duplicate Requests

- [x] Same visitor submits multiple requests
- [x] System handles duplicate requests correctly

### Approval Edge Cases

- [x] Resident approves twice (handled by state disablement)
- [x] Resident rejects twice (handled by state disablement)
- [x] Resident approves rejected request
- [x] Resident rejects approved request

### Guard Edge Cases

- [x] Invalid pass code entered (validated with error message)
- [x] Already checked-in visitor checked in again (prevented)
- [x] Already checked-out visitor checked out again (prevented)

### Tracking Edge Cases

- [x] Invalid tracking ID handled
- [x] Deleted request tracking page handled
- [x] Refresh during status update handled

### Session Edge Cases

- [x] Browser refresh keeps session (using cookies)
- [x] Logout works correctly
- [x] Multiple tabs remain synchronized

---

## Priority 4 - Multi-Apartment Verification

### Apartment Isolation

- [x] Apartment A residents only see Apartment A requests
- [x] Apartment B residents only see Apartment B requests
- [x] Apartment analytics isolated correctly

### Apartment Management

- [x] Admin can create apartment
- [x] Admin can update apartment
- [x] Admin can delete apartment

---

## Priority 5 - Reporting

### CSV Export

- [x] CSV downloads successfully
- [x] CSV contains correct data
- [x] Empty CSV export handled

### PDF Export

- [x] PDF downloads successfully
- [x] PDF formatting correct
- [x] PDF contains visitor data

---

## Priority 6 - Audit Logging

- [x] Visitor request logged
- [x] Approval logged
- [x] Rejection logged
- [x] Check-in logged
- [x] Check-out logged
- [x] Admin actions logged

---

## Priority 7 - UI / UX

### Responsive Design

- [x] Mobile view works
- [x] Tablet view works
- [x] Desktop view works

### Loading States

- [x] Form submission loading state
- [x] Dashboard loading state
- [x] Analytics loading state

### Empty States

- [x] No visitors state
- [x] No requests state
- [x] No notifications state

---

## Bonus Features (If Time Allows)

### Frequent Visitors

- [ ] Resident can create frequent visitor
- [ ] Permanent QR generated
- [ ] Guard can verify permanent QR

### Browser Notifications

- [ ] Resident receives visitor notification
- [ ] Notification opens request

### Emergency Alerts

- [ ] Resident can trigger alert
- [ ] Guard receives alert
- [ ] Admin receives alert

### Camera QR Scanner

- [x] Mock scan camera animation works
- [x] Fallback manual code entry works

---

## Final Submission Checklist

- [x] All critical flows tested
- [x] No console errors
- [x] No TypeScript errors
- [x] Production build succeeds
- [x] README completed
- [x] Environment variables documented
- [x] Git repository initialized and committed