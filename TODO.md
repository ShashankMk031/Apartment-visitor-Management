# TODO - Final Verification & Edge Cases

## Priority 0 - Submission Blockers

These must work before pushing to GitHub.

### Core Visitor Flow

* [ ] Visitor can access public visitor portal
* [ ] Apartment selection works
* [ ] Flat selection works
* [ ] Resident search works
* [ ] Visitor request form submits successfully
* [ ] Tracking page is created after submission
* [ ] Request status starts as PENDING

### Resident Flow

* [ ] Resident login works
* [ ] Resident only sees requests for their flat
* [ ] Resident can approve request
* [ ] Resident can reject request
* [ ] Dashboard updates after approval/rejection

### Visitor Tracking

* [ ] Tracking page refreshes correctly
* [ ] PENDING status visible
* [ ] APPROVED status visible
* [ ] REJECTED status visible
* [ ] INSIDE status visible
* [ ] COMPLETED status visible

### QR Pass

* [ ] QR generated after approval
* [ ] QR image renders correctly
* [ ] QR contains valid pass code
* [ ] Pass code can be copied
* [ ] Pass remains accessible after page refresh

### Guard Flow

* [ ] Guard login works
* [ ] Guard can verify pass
* [ ] Guard can check in visitor
* [ ] Guard can check out visitor
* [ ] Visitor appears in Inside Building list
* [ ] Visitor removed after checkout

### Admin Flow

* [ ] Admin login works
* [ ] Dashboard loads
* [ ] Analytics charts render
* [ ] Resident management works
* [ ] Guard management works
* [ ] Audit logs visible

---

# Priority 1 - Security Checks

### Route Protection

* [ ] Unauthenticated user cannot access /admin
* [ ] Unauthenticated user cannot access /resident
* [ ] Unauthenticated user cannot access /guard

### Role Protection

* [ ] Resident cannot access admin routes
* [ ] Resident cannot access guard routes
* [ ] Guard cannot access admin routes
* [ ] Guard cannot access resident routes

### Data Isolation

* [ ] Resident A cannot see Resident B requests
* [ ] Apartment A cannot access Apartment B data
* [ ] Visitor cannot access random tracking pages

---

# Priority 2 - Form Validation

### Visitor Form Validation

* [ ] Empty visitor name rejected
* [ ] Empty phone number rejected
* [ ] Empty purpose rejected
* [ ] Invalid phone number rejected
* [ ] Excessively long input handled safely

### Search Validation

* [ ] Invalid flat search handled
* [ ] Non-existent resident handled
* [ ] Empty search handled

---

# Priority 3 - Edge Cases

### Duplicate Requests

* [ ] Same visitor submits multiple requests
* [ ] System handles duplicate requests correctly

### Approval Edge Cases

* [ ] Resident approves twice
* [ ] Resident rejects twice
* [ ] Resident approves rejected request
* [ ] Resident rejects approved request

### Guard Edge Cases

* [ ] Invalid pass code entered
* [ ] Already checked-in visitor checked in again
* [ ] Already checked-out visitor checked out again

### Tracking Edge Cases

* [ ] Invalid tracking ID
* [ ] Deleted request tracking page
* [ ] Refresh during status update

### Session Edge Cases

* [ ] Browser refresh keeps session
* [ ] Logout works correctly
* [ ] Multiple tabs remain synchronized

---

# Priority 4 - Multi-Apartment Verification

### Apartment Isolation

* [ ] Apartment A residents only see Apartment A requests
* [ ] Apartment B residents only see Apartment B requests
* [ ] Apartment analytics isolated correctly

### Apartment Management

* [ ] Admin can create apartment
* [ ] Admin can update apartment
* [ ] Admin can delete apartment

---

# Priority 5 - Reporting

### CSV Export

* [ ] CSV downloads successfully
* [ ] CSV contains correct data
* [ ] Empty CSV export handled

### PDF Export

* [ ] PDF downloads successfully
* [ ] PDF formatting correct
* [ ] PDF contains visitor data

---

# Priority 6 - Audit Logging

* [ ] Visitor request logged
* [ ] Approval logged
* [ ] Rejection logged
* [ ] Check-in logged
* [ ] Check-out logged
* [ ] Admin actions logged

---

# Priority 7 - UI / UX

### Responsive Design

* [ ] Mobile view works
* [ ] Tablet view works
* [ ] Desktop view works

### Loading States

* [ ] Form submission loading state
* [ ] Dashboard loading state
* [ ] Analytics loading state

### Empty States

* [ ] No visitors state
* [ ] No requests state
* [ ] No notifications state

---

# Bonus Features (If Time Allows)

## Frequent Visitors

* [ ] Resident can create frequent visitor
* [ ] Permanent QR generated
* [ ] Guard can verify permanent QR

## Browser Notifications

* [ ] Resident receives visitor notification
* [ ] Notification opens request

## Emergency Alerts

* [ ] Resident can trigger alert
* [ ] Guard receives alert
* [ ] Admin receives alert

## Camera QR Scanner

* [ ] Camera permission request
* [ ] QR scan works
* [ ] Fallback manual code entry works

---

# Final Submission Checklist

* [ ] All critical flows tested
* [ ] No console errors
* [ ] No TypeScript errors
* [ ] Production build succeeds
* [ ] README completed
* [ ] Screenshots added
* [ ] Demo video recorded
* [ ] GitHub repository cleaned
* [ ] Environment variables documented
* [ ] Submission form completed

## Release Command

npm run build

Must complete successfully before submission.
