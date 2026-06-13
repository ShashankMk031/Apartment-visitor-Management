// Mock Database for Local Fallback if Supabase credentials are not provided

export interface Apartment {
  id: string;
  name: string;
  address: string;
  qr_code_url?: string;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: 'ADMIN' | 'RESIDENT' | 'GUARD';
  created_at: string;
}

export interface Resident {
  id: string;
  apartment_id: string;
  flat_number: string;
  full_name: string; // denormalized for convenience
  email: string;
  phone: string;
  created_at: string;
}

export interface SecurityGuard {
  id: string;
  apartment_id: string;
  full_name: string;
  email: string;
  phone: string;
  created_at: string;
}

export interface VisitorRequest {
  id: string;
  resident_id: string;
  visitor_name: string;
  visitor_phone: string;
  visitor_type: 'GUEST' | 'DELIVERY' | 'MAINTENANCE' | 'MAID' | 'DRIVER' | 'FAMILY' | 'OTHER';
  purpose: string;
  vehicle_number?: string;
  number_of_visitors: number;
  expected_duration: number; // in minutes
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  approval_time?: string;
  qr_code_pass?: string;
  created_at: string;
}

export interface VisitorEntry {
  id: string;
  visitor_request_id: string;
  entry_time: string;
  exit_time?: string;
  entered_by_guard?: string;
  exited_by_guard?: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  action_type: 'APPROVE' | 'REJECT' | 'ENTRY' | 'EXIT' | 'ADMIN_ACTION';
  description: string;
  created_at: string;
}

export interface FrequentVisitor {
  id: string;
  resident_id: string;
  full_name: string;
  phone: string;
  category: 'MAID' | 'DRIVER' | 'COOK' | 'PARENTS' | 'RELATIVES' | 'HELP' | 'TRAINER' | 'OTHER';
  notes?: string;
  qr_code: string;
  is_active: boolean;
  created_at: string;
}

export interface BlacklistedVisitor {
  id: string;
  full_name: string;
  phone: string;
  reason: string;
  created_by: string;
  created_at: string;
}

export interface EmergencyAlert {
  id: string;
  resident_id: string;
  alert_type: 'MEDICAL' | 'SECURITY' | 'FIRE' | 'OTHER';
  status: 'ACTIVE' | 'RESOLVED';
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

// Check if credentials exist
export const hasSupabaseCreds = () => {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'YOUR_SUPABASE_URL' &&
    !!anonKey &&
    anonKey !== 'YOUR_SUPABASE_ANON_KEY' &&
    anonKey !== 'YOUR_SUPABASE_PUBLISHABLE_KEY'
  );
};

// Seed Helper Data
const INITIAL_APARTMENT: Apartment = {
  id: 'apt-1',
  name: 'Green Glen Heights',
  address: '123 Orchard Road, Bellandur, Bangalore - 560103',
  qr_code_url: '/public/visitor/apt-1',
  created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
};

const RESIDENT_NAMES = [
  'Amit Sharma', 'Priya Patel', 'Rajesh Kumar', 'Sneha Reddy', 'Vikram Singh',
  'Deepa Nair', 'Rohan Mehta', 'Ananya Gupta', 'Sanjay Dutt', 'Kavita Rao',
  'Aditya Verma', 'Nehal Jain', 'Sandhya Mishra', 'Arjun Sen', 'Meera Iyer',
  'Karthik R', 'Shalini Joy', 'Vijay Mallya', 'Nisha Thomas', 'Rahul Dravid',
  'Suresh Raina', 'Krunal Pandya', 'Hardik Pandya', 'Jasprit Bumrah', 'Rohit Sharma'
];

const FLATS = [
  '101', '102', '103', '104', '105',
  '201', '202', '203', '204', '205',
  '301', '302', '303', '304', '305',
  '401', '402', '403', '404', '405',
  '501', '502', '503', '504', '505'
];

const INITIAL_PROFILES: Profile[] = [
  { id: 'admin-id', full_name: 'Super Admin', email: 'admin@example.com', role: 'ADMIN', created_at: new Date().toISOString() },
  { id: 'guard-1', full_name: 'Guard Bahadur', email: 'guard1@example.com', role: 'GUARD', created_at: new Date().toISOString() },
  { id: 'guard-2', full_name: 'Guard Singh', email: 'guard2@example.com', role: 'GUARD', created_at: new Date().toISOString() },
  { id: 'guard-3', full_name: 'Guard Patil', email: 'guard3@example.com', role: 'GUARD', created_at: new Date().toISOString() },
];

const INITIAL_RESIDENTS: Resident[] = [];
const INITIAL_GUARDS: SecurityGuard[] = [
  { id: 'guard-1', apartment_id: 'apt-1', full_name: 'Guard Bahadur', email: 'guard1@example.com', phone: '+919988776651', created_at: new Date().toISOString() },
  { id: 'guard-2', apartment_id: 'apt-1', full_name: 'Guard Singh', email: 'guard2@example.com', phone: '+919988776652', created_at: new Date().toISOString() },
  { id: 'guard-3', apartment_id: 'apt-1', full_name: 'Guard Patil', email: 'guard3@example.com', phone: '+919988776653', created_at: new Date().toISOString() },
];

// Generate Residents
RESIDENT_NAMES.forEach((name, i) => {
  const id = `res-${i + 1}`;
  INITIAL_PROFILES.push({
    id,
    full_name: name,
    email: `resident${i + 1}@example.com`,
    role: 'RESIDENT',
    created_at: new Date().toISOString(),
  });
  INITIAL_RESIDENTS.push({
    id,
    apartment_id: 'apt-1',
    flat_number: FLATS[i],
    full_name: name,
    email: `resident${i + 1}@example.com`,
    phone: `+9198765432${i.toString().padStart(2, '0')}`,
    created_at: new Date().toISOString(),
  });
});

// Generate 100 Visitor Records
const VISITOR_NAMES = [
  'Ramesh Babu', 'Suresh Kumar', 'Delivery Boy (Amazon)', 'Maid Shanti',
  'Swiggy Delivery', 'Zomato Rider', 'Electrician Bob', 'Plumber Mario',
  'Anita Sen (Aunt)', 'Sunil Grover', 'Cab Driver (Ola)', 'Airtel Broadband Tech',
  'Milkman Raju', 'Paperboy Mohan', 'Geeta Devi', 'Dr. Alok Prasad',
  'Urban Company Cleaner', 'DHL Courier', 'Dunzo Runner', 'Deepak Chahar'
];

const VEHICLES = ['', '', 'KA-03-MY-1234', '', 'KA-01-XX-9876', '', 'KA-51-AB-5555', '', '', 'MH-02-ZZ-1111'];
const PURPOSES = ['Social Visit', 'Delivery of Package', 'Maintenance Work', 'Housekeeping', 'Food Delivery', 'Broadband Repair', 'Guest Visit', 'Medical Checkup'];

const INITIAL_VISITOR_REQUESTS: VisitorRequest[] = [];
const INITIAL_VISITOR_ENTRIES: VisitorEntry[] = [];
const INITIAL_AUDIT_LOGS: AuditLog[] = [];
const INITIAL_NOTIFICATIONS: Notification[] = [];

const INITIAL_FREQUENT_VISITORS: FrequentVisitor[] = [
  {
    id: 'freq-1',
    resident_id: 'res-1',
    full_name: 'Raju Milkman',
    phone: '+919988770011',
    category: 'COOK',
    notes: 'Comes daily in the morning at 7 AM',
    qr_code: 'FREQ-MILK-101-9988',
    is_active: true,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'freq-2',
    resident_id: 'res-1',
    full_name: 'Shanti Maid',
    phone: '+919988770022',
    category: 'MAID',
    notes: 'Comes in the afternoon at 2 PM',
    qr_code: 'FREQ-MAID-101-7766',
    is_active: true,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'freq-3',
    resident_id: 'res-2',
    full_name: 'Ramesh Driver',
    phone: '+919988770033',
    category: 'DRIVER',
    notes: 'Sunday driver',
    qr_code: 'FREQ-DRIV-102-5544',
    is_active: true,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'freq-4',
    resident_id: 'res-6',
    full_name: 'Lata Cook',
    phone: '+919988770044',
    category: 'COOK',
    notes: 'Cooks dinner daily',
    qr_code: 'FREQ-COOK-201-1122',
    is_active: false,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

const INITIAL_BLACKLIST: BlacklistedVisitor[] = [
  {
    id: 'black-1',
    full_name: 'Scammer Joe',
    phone: '+919000000000',
    reason: 'Suspicious marketing activities inside the building',
    created_by: 'admin-id',
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'black-2',
    full_name: 'Rude Delivery Rider',
    phone: '+919111111111',
    reason: 'Altercation with guards at the main gate',
    created_by: 'admin-id',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

const INITIAL_EMERGENCY_ALERTS: EmergencyAlert[] = [
  {
    id: 'alert-1',
    resident_id: 'res-1',
    alert_type: 'MEDICAL',
    status: 'RESOLVED',
    resolved_by: 'guard-1',
    resolved_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 30 * 60 * 1000).toISOString(),
  }
];

// Helper to generate a date offset
const getDateOffset = (daysAgo: number, hourOffset: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hourOffset);
  return d.toISOString();
};

// Seed 100 Visitor Requests
for (let i = 0; i < 100; i++) {
  const reqId = `req-${i + 1}`;
  const residentIndex = i % INITIAL_RESIDENTS.length;
  const resident = INITIAL_RESIDENTS[residentIndex];
  
  const visitorName = VISITOR_NAMES[i % VISITOR_NAMES.length];
  const visitorPhone = `+919123456${i.toString().padStart(3, '0')}`;
  
  // Decide visitor type
  let type: VisitorRequest['visitor_type'] = 'GUEST';
  if (visitorName.includes('Swiggy') || visitorName.includes('Zomato') || visitorName.includes('Delivery')) {
    type = 'DELIVERY';
  } else if (visitorName.includes('Electrician') || visitorName.includes('Plumber') || visitorName.includes('Broadband') || visitorName.includes('Cleaner')) {
    type = 'MAINTENANCE';
  } else if (visitorName.includes('Maid')) {
    type = 'MAID';
  } else if (visitorName.includes('Driver')) {
    type = 'DRIVER';
  } else if (visitorName.includes('Aunt')) {
    type = 'FAMILY';
  }
  
  const purpose = PURPOSES[i % PURPOSES.length];
  const vehicle_number = VEHICLES[i % VEHICLES.length] || undefined;
  const number_of_visitors = (i % 3) + 1;
  const expected_duration = [30, 45, 60, 90, 120, 240][i % 6];
  
  // Calculate status distribution
  // 5% PENDING, 15% REJECTED, 5% EXPIRED, 75% APPROVED/COMPLETED
  let status: VisitorRequest['status'] = 'APPROVED';
  if (i < 5) {
    status = 'PENDING';
  } else if (i < 20) {
    status = 'REJECTED';
  } else if (i < 25) {
    status = 'EXPIRED';
  }
  
  const daysAgo = Math.floor(i / 3); // Spans over the last 30 days
  const hourOffset = i % 24;
  const created_at = getDateOffset(daysAgo, hourOffset);
  
  let approval_time: string | undefined = undefined;
  let qr_code_pass: string | undefined = undefined;
  
  if (status === 'APPROVED' || status === 'REJECTED') {
    const createdDate = new Date(created_at);
    approval_time = new Date(createdDate.getTime() + 10 * 60 * 1000).toISOString(); // Approved 10 min later
    qr_code_pass = `PASS-${reqId}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  
  INITIAL_VISITOR_REQUESTS.push({
    id: reqId,
    resident_id: resident.id,
    visitor_name: visitorName,
    visitor_phone: visitorPhone,
    visitor_type: type,
    purpose,
    vehicle_number,
    number_of_visitors,
    expected_duration,
    status,
    approval_time,
    qr_code_pass,
    created_at,
  });

  // If approved and not in the future, let's create a visitor entry
  if (status === 'APPROVED' && daysAgo >= 0) {
    const approvalDate = new Date(approval_time!);
    const entry_time = new Date(approvalDate.getTime() + 15 * 60 * 1000).toISOString(); // Entered 15 min after approval
    
    // For older entries, they have exited. For very recent ones, they might still be inside!
    const isStillInside = daysAgo === 0 && hourOffset < 2; // Entered in last 2 hours
    const exit_time = isStillInside 
      ? undefined 
      : new Date(new Date(entry_time).getTime() + expected_duration * 60 * 1000).toISOString();
    
    const entryId = `entry-${i + 1}`;
    const guardId = INITIAL_GUARDS[i % INITIAL_GUARDS.length].id;
    
    INITIAL_VISITOR_ENTRIES.push({
      id: entryId,
      visitor_request_id: reqId,
      entry_time,
      exit_time,
      entered_by_guard: guardId,
      exited_by_guard: exit_time ? guardId : undefined,
    });
    
    // Create Audit Logs
    INITIAL_AUDIT_LOGS.push({
      id: `log-app-${i}`,
      actor_id: resident.id,
      actor_name: resident.full_name,
      action_type: 'APPROVE',
      description: `Approved visitor request for ${visitorName} (Flat ${resident.flat_number})`,
      created_at: approval_time!,
    });
    
    INITIAL_AUDIT_LOGS.push({
      id: `log-ent-${i}`,
      actor_id: guardId,
      actor_name: INITIAL_GUARDS[i % INITIAL_GUARDS.length].full_name,
      action_type: 'ENTRY',
      description: `Marked entry for visitor ${visitorName}`,
      created_at: entry_time,
    });
    
    if (exit_time) {
      INITIAL_AUDIT_LOGS.push({
        id: `log-ex-${i}`,
        actor_id: guardId,
        actor_name: INITIAL_GUARDS[i % INITIAL_GUARDS.length].full_name,
        action_type: 'EXIT',
        description: `Marked exit for visitor ${visitorName}`,
        created_at: exit_time,
      });
    }
  } else if (status === 'REJECTED') {
    INITIAL_AUDIT_LOGS.push({
      id: `log-rej-${i}`,
      actor_id: resident.id,
      actor_name: resident.full_name,
      action_type: 'REJECT',
      description: `Rejected visitor request for ${visitorName} (Flat ${resident.flat_number})`,
      created_at: approval_time!,
    });
  }
}

// Generate some notifications
INITIAL_VISITOR_REQUESTS.filter(r => r.status === 'PENDING').forEach((r, idx) => {
  const resident = INITIAL_RESIDENTS.find(res => res.id === r.resident_id)!;
  INITIAL_NOTIFICATIONS.push({
    id: `notif-${idx}`,
    recipient_id: r.resident_id,
    title: 'New Visitor Request',
    message: `${r.visitor_name} (${r.visitor_type}) is waiting at the gate for flat ${resident.flat_number}.`,
    read: false,
    created_at: r.created_at,
  });
});

// Mock Database API wrapper
class MockDatabase {
  private getStorage = <T>(key: string, initial: T): T => {
    if (typeof window === 'undefined') return initial;
    const val = localStorage.getItem(key);
    if (!val) {
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(val);
  };

  private setStorage = (key: string, data: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    }
  };

  public getApartment(): Apartment {
    return INITIAL_APARTMENT;
  }

  public getProfiles(): Profile[] {
    return this.getStorage('mock_profiles', INITIAL_PROFILES);
  }

  public getResidents(): Resident[] {
    return this.getStorage('mock_residents', INITIAL_RESIDENTS);
  }

  public getGuards(): SecurityGuard[] {
    return this.getStorage('mock_guards', INITIAL_GUARDS);
  }

  public getVisitorRequests(): VisitorRequest[] {
    return this.getStorage('mock_visitor_requests', INITIAL_VISITOR_REQUESTS);
  }

  public getVisitorEntries(): VisitorEntry[] {
    return this.getStorage('mock_visitor_entries', INITIAL_VISITOR_ENTRIES);
  }

  public getNotifications(): Notification[] {
    return this.getStorage('mock_notifications', INITIAL_NOTIFICATIONS);
  }

  public getAuditLogs(): AuditLog[] {
    return this.getStorage('mock_audit_logs', INITIAL_AUDIT_LOGS);
  }

  // Auth Operations
  public signIn(email: string): { user: any; error: any } {
    const profiles = this.getProfiles();
    const profile = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
    
    if (!profile) {
      return { user: null, error: { message: 'User not found. Try resident1@example.com, guard1@example.com, or admin@example.com.' } };
    }
    
    // Save current user to session cookie/localstorage
    const userSession = {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      user_metadata: {
        full_name: profile.full_name,
        role: profile.role,
      }
    };
    
    this.setStorage('mock_current_user', userSession);
    // Set cookie
    if (typeof document !== 'undefined') {
      document.cookie = `mock_session=${JSON.stringify(userSession)}; path=/; max-age=3600`;
    }
    
    return { user: userSession, error: null };
  }

  public signOut() {
    this.setStorage('mock_current_user', null);
    if (typeof document !== 'undefined') {
      document.cookie = 'mock_session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
  }

  public getCurrentUser(): any {
    const user = this.getStorage('mock_current_user', null);
    if (user) return user;
    
    // Parse cookie as fallback
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(new RegExp('(^| )mock_session=([^;]+)'));
      if (match) {
        try {
          return JSON.parse(decodeURIComponent(match[2]));
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  }

  // Database mutations
  public createVisitorRequest(request: Omit<VisitorRequest, 'id' | 'status' | 'created_at'>): VisitorRequest {
    const requests = this.getVisitorRequests();
    const newReq: VisitorRequest = {
      ...request,
      id: `req-${requests.length + 1}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };
    
    requests.unshift(newReq);
    this.setStorage('mock_visitor_requests', requests);

    // Create resident notification
    const resident = this.getResidents().find(r => r.id === request.resident_id);
    if (resident) {
      const notifs = this.getNotifications();
      notifs.unshift({
        id: `notif-${notifs.length + 1}`,
        recipient_id: resident.id,
        title: 'New Visitor Request',
        message: `${request.visitor_name} (${request.visitor_type}) is waiting at the gate.`,
        read: false,
        created_at: new Date().toISOString(),
      });
      this.setStorage('mock_notifications', notifs);
    }
    
    return newReq;
  }

  public updateVisitorRequestStatus(id: string, status: 'APPROVED' | 'REJECTED', actorId: string): VisitorRequest | null {
    const requests = this.getVisitorRequests();
    const reqIndex = requests.findIndex(r => r.id === id);
    if (reqIndex === -1) return null;
    
    const request = requests[reqIndex];
    request.status = status;
    request.approval_time = new Date().toISOString();
    
    if (status === 'APPROVED') {
      request.qr_code_pass = `PASS-${request.id}-${Math.floor(1000 + Math.random() * 9000)}`;
    }
    
    requests[reqIndex] = request;
    this.setStorage('mock_visitor_requests', requests);
    
    // Get actor info
    const profiles = this.getProfiles();
    const actor = profiles.find(p => p.id === actorId);
    
    // Create Audit Log
    const logs = this.getAuditLogs();
    logs.unshift({
      id: `log-${Date.now()}`,
      actor_id: actorId,
      actor_name: actor?.full_name || 'System',
      action_type: status === 'APPROVED' ? 'APPROVE' : 'REJECT',
      description: `${status === 'APPROVED' ? 'Approved' : 'Rejected'} request for ${request.visitor_name}`,
      created_at: new Date().toISOString(),
    });
    this.setStorage('mock_audit_logs', logs);

    // Notify visitors (Simulated via console or tracking channel)
    return request;
  }

  public markVisitorEntry(requestId: string, guardId: string): VisitorEntry | null {
    const requests = this.getVisitorRequests();
    const req = requests.find(r => r.id === requestId);
    if (!req || req.status !== 'APPROVED') return null;

    const entries = this.getVisitorEntries();
    // Check if already checked in
    if (entries.some(e => e.visitor_request_id === requestId && !e.exit_time)) {
      return null; // Already inside
    }

    const newEntry: VisitorEntry = {
      id: `entry-${Date.now()}`,
      visitor_request_id: requestId,
      entry_time: new Date().toISOString(),
      entered_by_guard: guardId,
    };

    entries.unshift(newEntry);
    this.setStorage('mock_visitor_entries', entries);

    // Audit Log
    const guard = this.getProfiles().find(p => p.id === guardId);
    const logs = this.getAuditLogs();
    logs.unshift({
      id: `log-${Date.now()}`,
      actor_id: guardId,
      actor_name: guard?.full_name || 'Guard',
      action_type: 'ENTRY',
      description: `Marked ENTRY for ${req.visitor_name}`,
      created_at: new Date().toISOString(),
    });
    this.setStorage('mock_audit_logs', logs);

    return newEntry;
  }

  public markVisitorExit(requestId: string, guardId: string): VisitorEntry | null {
    const requests = this.getVisitorRequests();
    const req = requests.find(r => r.id === requestId);
    if (!req) return null;

    const entries = this.getVisitorEntries();
    const entryIndex = entries.findIndex(e => e.visitor_request_id === requestId && !e.exit_time);
    if (entryIndex === -1) return null;

    const entry = entries[entryIndex];
    entry.exit_time = new Date().toISOString();
    entry.exited_by_guard = guardId;

    entries[entryIndex] = entry;
    this.setStorage('mock_visitor_entries', entries);

    // Audit Log
    const guard = this.getProfiles().find(p => p.id === guardId);
    const logs = this.getAuditLogs();
    logs.unshift({
      id: `log-${Date.now()}`,
      actor_id: guardId,
      actor_name: guard?.full_name || 'Guard',
      action_type: 'EXIT',
      description: `Marked EXIT for ${req.visitor_name}`,
      created_at: new Date().toISOString(),
    });
    this.setStorage('mock_audit_logs', logs);

    return entry;
  }

  public markNotificationRead(id: string) {
    const notifs = this.getNotifications();
    const idx = notifs.findIndex(n => n.id === id);
    if (idx !== -1) {
      notifs[idx].read = true;
      this.setStorage('mock_notifications', notifs);
    }
  }

  // Admin CRUD operations
  public addResident(residentData: Omit<Resident, 'id' | 'created_at'>): Resident {
    const profiles = this.getProfiles();
    const residents = this.getResidents();
    
    const newId = `res-added-${Date.now()}`;
    
    // Add Profile
    profiles.push({
      id: newId,
      full_name: residentData.full_name,
      email: residentData.email,
      role: 'RESIDENT',
      created_at: new Date().toISOString(),
    });
    this.setStorage('mock_profiles', profiles);

    // Add Resident
    const newResident: Resident = {
      ...residentData,
      id: newId,
      created_at: new Date().toISOString(),
    };
    residents.unshift(newResident);
    this.setStorage('mock_residents', residents);

    return newResident;
  }

  public addGuard(guardData: Omit<SecurityGuard, 'id' | 'created_at'>): SecurityGuard {
    const profiles = this.getProfiles();
    const guards = this.getGuards();
    
    const newId = `guard-added-${Date.now()}`;
    
    // Add Profile
    profiles.push({
      id: newId,
      full_name: guardData.full_name,
      email: guardData.email,
      role: 'GUARD',
      created_at: new Date().toISOString(),
    });
    this.setStorage('mock_profiles', profiles);

    // Add Guard
    const newGuard: SecurityGuard = {
      ...guardData,
      id: newId,
      created_at: new Date().toISOString(),
    };
    guards.unshift(newGuard);
    this.setStorage('mock_guards', guards);

    return newGuard;
  }
  
  public deleteResident(id: string) {
    let residents = this.getResidents();
    residents = residents.filter(r => r.id !== id);
    this.setStorage('mock_residents', residents);
    
    let profiles = this.getProfiles();
    profiles = profiles.filter(p => p.id !== id);
    this.setStorage('mock_profiles', profiles);
  }

  public deleteGuard(id: string) {
    let guards = this.getGuards();
    guards = guards.filter(g => g.id !== id);
    this.setStorage('mock_guards', guards);
    
    let profiles = this.getProfiles();
    profiles = profiles.filter(p => p.id !== id);
    this.setStorage('mock_profiles', profiles);
  }

  // Frequent Visitors Operations
  public getFrequentVisitors(): FrequentVisitor[] {
    return this.getStorage('mock_frequent_visitors', INITIAL_FREQUENT_VISITORS);
  }

  public addFrequentVisitor(visitor: Omit<FrequentVisitor, 'id' | 'qr_code' | 'is_active' | 'created_at'>): FrequentVisitor {
    const list = this.getFrequentVisitors();
    const newVisitor: FrequentVisitor = {
      ...visitor,
      id: `freq-${Date.now()}`,
      qr_code: `FREQ-${visitor.category.substring(0, 4)}-${visitor.phone.substring(visitor.phone.length - 4)}-${Math.floor(1000 + Math.random() * 9000)}`,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    list.unshift(newVisitor);
    this.setStorage('mock_frequent_visitors', list);

    // Audit Log
    const logs = this.getAuditLogs();
    const profiles = this.getProfiles();
    const actor = profiles.find(p => p.id === visitor.resident_id);
    logs.unshift({
      id: `log-${Date.now()}`,
      actor_id: visitor.resident_id,
      actor_name: actor?.full_name || 'Resident',
      action_type: 'ADMIN_ACTION',
      description: `Created frequent visitor ${newVisitor.full_name} (${newVisitor.category})`,
      created_at: new Date().toISOString(),
    });
    this.setStorage('mock_audit_logs', logs);

    return newVisitor;
  }

  public updateFrequentVisitor(id: string, updates: Partial<Omit<FrequentVisitor, 'id' | 'resident_id' | 'qr_code' | 'created_at'>>): FrequentVisitor | null {
    const list = this.getFrequentVisitors();
    const idx = list.findIndex(v => v.id === id);
    if (idx === -1) return null;

    const updated = { ...list[idx], ...updates };
    list[idx] = updated;
    this.setStorage('mock_frequent_visitors', list);

    // Audit Log
    const logs = this.getAuditLogs();
    const profiles = this.getProfiles();
    const actor = profiles.find(p => p.id === updated.resident_id);
    logs.unshift({
      id: `log-${Date.now()}`,
      actor_id: updated.resident_id,
      actor_name: actor?.full_name || 'Resident',
      action_type: 'ADMIN_ACTION',
      description: `Updated frequent visitor ${updated.full_name} (${updated.category}) - Active: ${updated.is_active}`,
      created_at: new Date().toISOString(),
    });
    this.setStorage('mock_audit_logs', logs);

    return updated;
  }

  public deleteFrequentVisitor(id: string): boolean {
    let list = this.getFrequentVisitors();
    const target = list.find(v => v.id === id);
    if (!target) return false;

    list = list.filter(v => v.id !== id);
    this.setStorage('mock_frequent_visitors', list);

    // Audit Log
    const logs = this.getAuditLogs();
    const profiles = this.getProfiles();
    const actor = profiles.find(p => p.id === target.resident_id);
    logs.unshift({
      id: `log-${Date.now()}`,
      actor_id: target.resident_id,
      actor_name: actor?.full_name || 'Resident',
      action_type: 'ADMIN_ACTION',
      description: `Deleted frequent visitor ${target.full_name}`,
      created_at: new Date().toISOString(),
    });
    this.setStorage('mock_audit_logs', logs);

    return true;
  }

  // Blacklist Operations
  public getBlacklist(): BlacklistedVisitor[] {
    return this.getStorage('mock_blacklist', INITIAL_BLACKLIST);
  }

  public addBlacklistedVisitor(visitor: Omit<BlacklistedVisitor, 'id' | 'created_at'>): BlacklistedVisitor {
    const list = this.getBlacklist();
    const newVisitor: BlacklistedVisitor = {
      ...visitor,
      id: `black-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    list.unshift(newVisitor);
    this.setStorage('mock_blacklist', list);

    // Audit Log
    const logs = this.getAuditLogs();
    const profiles = this.getProfiles();
    const actor = profiles.find(p => p.id === visitor.created_by);
    logs.unshift({
      id: `log-${Date.now()}`,
      actor_id: visitor.created_by,
      actor_name: actor?.full_name || 'Admin',
      action_type: 'ADMIN_ACTION',
      description: `Added visitor ${visitor.full_name} (${visitor.phone}) to blacklist. Reason: ${visitor.reason}`,
      created_at: new Date().toISOString(),
    });
    this.setStorage('mock_audit_logs', logs);

    return newVisitor;
  }

  public removeBlacklistedVisitor(id: string, adminId: string): boolean {
    let list = this.getBlacklist();
    const target = list.find(v => v.id === id);
    if (!target) return false;

    list = list.filter(v => v.id !== id);
    this.setStorage('mock_blacklist', list);

    // Audit Log
    const logs = this.getAuditLogs();
    const profiles = this.getProfiles();
    const actor = profiles.find(p => p.id === adminId);
    logs.unshift({
      id: `log-${Date.now()}`,
      actor_id: adminId,
      actor_name: actor?.full_name || 'Admin',
      action_type: 'ADMIN_ACTION',
      description: `Removed visitor ${target.full_name} (${target.phone}) from blacklist`,
      created_at: new Date().toISOString(),
    });
    this.setStorage('mock_audit_logs', logs);

    return true;
  }

  public checkBlacklist(phone: string): BlacklistedVisitor | null {
    const list = this.getBlacklist();
    return list.find(v => v.phone === phone) || null;
  }

  // Emergency Alerts Operations
  public getEmergencyAlerts(): EmergencyAlert[] {
    return this.getStorage('mock_emergency_alerts', INITIAL_EMERGENCY_ALERTS);
  }

  public triggerEmergencyAlert(residentId: string, alertType: EmergencyAlert['alert_type']): EmergencyAlert {
    const list = this.getEmergencyAlerts();
    const newAlert: EmergencyAlert = {
      id: `alert-${Date.now()}`,
      resident_id: residentId,
      alert_type: alertType,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    };
    list.unshift(newAlert);
    this.setStorage('mock_emergency_alerts', list);

    // Get resident flat info
    const resident = this.getResidents().find(r => r.id === residentId);
    const flatNo = resident ? resident.flat_number : 'Unknown Flat';
    const residentName = resident ? resident.full_name : 'Resident';

    // Log check-in audit
    const logs = this.getAuditLogs();
    logs.unshift({
      id: `log-${Date.now()}`,
      actor_id: residentId,
      actor_name: residentName,
      action_type: 'ADMIN_ACTION',
      description: `⚠️ EMERGENCY ALERT: ${alertType} triggered at Flat ${flatNo}`,
      created_at: new Date().toISOString(),
    });
    this.setStorage('mock_audit_logs', logs);

    // Add alert notification for guards and admins
    const notifs = this.getNotifications();
    const guards = this.getProfiles().filter(p => p.role === 'GUARD' || p.role === 'ADMIN');
    guards.forEach(g => {
      notifs.unshift({
        id: `notif-${Date.now()}-${Math.random()}`,
        recipient_id: g.id,
        title: `🚨 EMERGENCY ALERT: ${alertType}`,
        message: `${residentName} from Flat ${flatNo} has triggered a ${alertType} alert. Action required!`,
        read: false,
        created_at: new Date().toISOString(),
      });
    });
    this.setStorage('mock_notifications', notifs);

    return newAlert;
  }

  public resolveEmergencyAlert(id: string, guardId: string): EmergencyAlert | null {
    const list = this.getEmergencyAlerts();
    const idx = list.findIndex(a => a.id === id);
    if (idx === -1) return null;

    const alert = list[idx];
    alert.status = 'RESOLVED';
    alert.resolved_by = guardId;
    alert.resolved_at = new Date().toISOString();

    list[idx] = alert;
    this.setStorage('mock_emergency_alerts', list);

    // Audit Log
    const guard = this.getProfiles().find(p => p.id === guardId);
    const resident = this.getResidents().find(r => r.id === alert.resident_id);
    const flatNo = resident ? resident.flat_number : 'Unknown Flat';

    const logs = this.getAuditLogs();
    logs.unshift({
      id: `log-${Date.now()}`,
      actor_id: guardId,
      actor_name: guard?.full_name || 'Guard',
      action_type: 'ADMIN_ACTION',
      description: `Resolved ${alert.alert_type} emergency alert for Flat ${flatNo}`,
      created_at: new Date().toISOString(),
    });
    this.setStorage('mock_audit_logs', logs);

    return alert;
  }

  // Check in Frequent Visitor scanner endpoint
  public checkInFrequentVisitor(qrCode: string, guardId: string): { entry: any; request: any; error?: string } {
    const list = this.getFrequentVisitors();
    const visitor = list.find(v => v.qr_code === qrCode);
    if (!visitor) {
      return { entry: null, request: null, error: 'Invalid QR code' };
    }
    if (!visitor.is_active) {
      return { entry: null, request: null, error: 'Frequent visitor profile is deactivated' };
    }

    // Check blacklist
    if (this.checkBlacklist(visitor.phone)) {
      return { entry: null, request: null, error: 'Visitor is blacklisted and blocked' };
    }

    // Create a visitor request that is automatically approved
    const requests = this.getVisitorRequests();
    
    // Map category to standard visitor_type
    let type: any = 'OTHER';
    if (visitor.category === 'MAID') type = 'MAID';
    else if (visitor.category === 'DRIVER') type = 'DRIVER';
    else if (visitor.category === 'COOK' || visitor.category === 'HELP') type = 'MAINTENANCE';
    else if (visitor.category === 'PARENTS' || visitor.category === 'RELATIVES') type = 'FAMILY';

    const reqId = `req-freq-${Date.now()}`;
    const newReq: VisitorRequest = {
      id: reqId,
      resident_id: visitor.resident_id,
      visitor_name: visitor.full_name,
      visitor_phone: visitor.phone,
      visitor_type: type,
      purpose: `Trusted entry (${visitor.category})`,
      number_of_visitors: 1,
      expected_duration: 180,
      status: 'APPROVED',
      approval_time: new Date().toISOString(),
      qr_code_pass: qrCode,
      created_at: new Date().toISOString(),
    };

    requests.unshift(newReq);
    this.setStorage('mock_visitor_requests', requests);

    // Now mark entry
    const entry = this.markVisitorEntry(reqId, guardId);
    if (!entry) {
      return { entry: null, request: newReq, error: 'Failed to record entry log' };
    }

    return { entry, request: newReq };
  }

  public createAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): AuditLog {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString()
    };
    logs.unshift(newLog);
    this.setStorage('mock_audit_logs', logs);
    return newLog;
  }
}

export const mockDb = new MockDatabase();
