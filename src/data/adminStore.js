// Admin Store - Manages registered Google users, token balances, purchased services, and bookings

const USERS_STORAGE_KEY = 'trainer_david_registered_users';
const BOOKINGS_STORAGE_KEY = 'trainer_david_bookings';
const PURCHASES_STORAGE_KEY = 'trainer_david_purchases';
const ADMIN_CONFIG_KEY = 'trainer_david_admin_config';

// 4 Core Services for Bookings
export const CORE_SERVICES = [
  {
    id: "personal-training",
    title: "1-on-1 Online Personal Training",
    badge: "Most Popular",
    tagline: "Customized exercise programming with real-time biofeedback",
    description: "Work directly with David to build strength, correct muscle imbalances, and achieve sustainable physique transformations with periodized plans designed for your schedule.",
    features: [
      "Custom workout splits for your gym or home setup",
      "Weekly form check-in & video technique audits",
      "Progressive overload tracking & rep-max calculations",
      "Direct WhatsApp / in-app coaching messenger access"
    ]
  },
  {
    id: "custom-nutrition",
    title: "Nutrition & Macro Blueprint",
    badge: "Results Driven",
    tagline: "Evidence-based meal strategy without restrictive fad diets",
    description: "Calculated macronutrient and caloric targets tailored to your metabolic rate, body composition goals (cutting, lean bulking, or body recomposition), and dietary preferences.",
    features: [
      "Personalized daily calorie & macro breakdown (P/C/F)",
      "Sample grocery shopping lists & high-protein meal ideas",
      "Dining out & travel flexibility guide",
      "Digestive health & supplement optimization protocols"
    ]
  },
  {
    id: "sports-coaching",
    title: "Sports Performance Coaching",
    badge: "Athletic Edge",
    tagline: "Speed, agility, rotational power & sport-specific conditioning",
    description: "Designed for competitive athletes, combat sports, runners, and team athletes seeking explosive acceleration, endurance conditioning, and injury resilience.",
    features: [
      "Sport-specific movement pattern conditioning",
      "Power generation, plyometrics & rate of force development",
      "Energy system conditioning (aerobic & anaerobic thresholds)",
      "In-season vs. off-season periodization cycles"
    ]
  },
  {
    id: "physiotherapy",
    title: "Physiotherapy & Rehab Assessment",
    badge: "Injury Prevention",
    tagline: "Overcome nagging joint pain, mobility blocks & posture faults",
    description: "Comprehensive biomechanical audit of your joints, kinetic chains, and movement restrictions to rehabilitate old injuries and build a pain-free, resilient body.",
    features: [
      "Full kinetic chain & posture imbalance diagnosis",
      "Joint decompression & active mobility routines",
      "Corrective exercise prescribing for shoulders, knees, & spine",
      "Safe return-to-heavy-lifting ramp protocols"
    ]
  }
];

// Initial mock registered users
const INITIAL_USERS = [
  {
    id: "google_superadmin_001",
    email: "support@aifoundation.net.au",
    name: "AI Foundation Master",
    givenName: "SuperAdmin",
    picture: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80",
    tokens: 9999,
    role: "superadmin",
    registeredAt: "2026-08-01T00:00:00.000Z",
    notes: "Registered Firebase SuperAdmin. Full credential grant authority across all users."
  },
  {
    id: "google_admin_001",
    email: "davidrobertson.info@gmail.com",
    name: "Coach David",
    givenName: "David",
    picture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    tokens: 100,
    role: "admin",
    registeredAt: "2026-09-01T08:00:00.000Z",
    notes: "Lead Trainer & System Administrator."
  },
  {
    id: "google_trainer_002",
    email: "sarah.connor@fitnesshub.com",
    name: "Sarah Connor",
    givenName: "Sarah",
    picture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    tokens: 50,
    role: "trainer",
    registeredAt: "2026-09-10T10:00:00.000Z",
    notes: "Assigned Trainer credential by SuperAdmin."
  },
  {
    id: "google_doctor_003",
    email: "dr.arun.patel@sportsrehab.com.au",
    name: "Dr. Arun Patel",
    givenName: "Arun",
    picture: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100&auto=format&fit=crop&q=80",
    tokens: 50,
    role: "doctor",
    registeredAt: "2026-09-12T11:30:00.000Z",
    notes: "Assigned Doctor credential (Physiotherapy & Rehab) by SuperAdmin."
  },
  {
    id: "google_accountant_004",
    email: "claire.finances@aifoundation.net.au",
    name: "Claire Vance",
    givenName: "Claire",
    picture: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80",
    tokens: 50,
    role: "accountant",
    registeredAt: "2026-09-14T09:00:00.000Z",
    notes: "Assigned Accountant credential by SuperAdmin."
  },
  {
    id: "google_1028391823901",
    email: "marcus.vance@gmail.com",
    name: "Marcus Vance",
    givenName: "Marcus",
    picture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    tokens: 45,
    role: "supporter",
    registeredAt: "2026-09-15T09:30:00.000Z",
    notes: "Registered Supporter (no other functions given until assigned by SuperAdmin)."
  },
  {
    id: "google_1028391823902",
    email: "elena.rostova@workspace.corp",
    name: "Elena Rostova",
    givenName: "Elena",
    picture: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80",
    tokens: 0,
    role: "supporter",
    registeredAt: "2026-09-22T14:15:00.000Z",
    notes: "Registered Supporter (no other functions given until assigned by SuperAdmin)."
  },
  {
    id: "google_1028391823904",
    email: "chloe.tan@healthlab.com.au",
    name: "Chloe Tan",
    givenName: "Chloe",
    picture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    tokens: 0,
    role: "supporter",
    registeredAt: "2026-10-04T16:45:00.000Z",
    notes: "Registered Supporter (no other functions given until assigned by SuperAdmin)."
  }
];

// Initial mock bookings across all 4 services
const INITIAL_BOOKINGS = [
  {
    id: "bk_101",
    clientName: "Marcus Vance",
    clientEmail: "marcus.vance@gmail.com",
    phone: "+61 412 889 012",
    serviceTitle: "Physiotherapy & Rehab Assessment",
    serviceCategory: "Injury Prevention",
    goalOrNotes: "Right patellar tendon discomfort during deep squats. Need joint mobilization protocol.",
    status: "Confirmed",
    requestedAt: "2026-10-06T10:15:00.000Z"
  },
  {
    id: "bk_102",
    clientName: "Elena Rostova",
    clientEmail: "elena.rostova@workspace.corp",
    phone: "+61 488 234 567",
    serviceTitle: "Nutrition & Macro Blueprint",
    serviceCategory: "Results Driven",
    goalOrNotes: "Targeting 15% body fat recomposition. Frequent business dinners and travel.",
    status: "Pending",
    requestedAt: "2026-10-07T14:30:00.000Z"
  },
  {
    id: "bk_103",
    clientName: "David Miller",
    clientEmail: "david.miller@gmail.com",
    phone: "+61 405 678 910",
    serviceTitle: "Sports Performance Coaching",
    serviceCategory: "Athletic Edge",
    goalOrNotes: "Improve anaerobic threshold and sprint power output for season kickoff.",
    status: "Confirmed",
    requestedAt: "2026-10-08T08:00:00.000Z"
  },
  {
    id: "bk_104",
    clientName: "Chloe Tan",
    clientEmail: "chloe.tan@healthlab.com.au",
    phone: "+61 433 112 345",
    serviceTitle: "1-on-1 Online Personal Training",
    serviceCategory: "Most Popular",
    goalOrNotes: "Beginner lifting hypertrophy program with weekly WhatsApp technique audits.",
    status: "Pending",
    requestedAt: "2026-10-08T18:20:00.000Z"
  }
];

// Initial mock purchased services
const INITIAL_PURCHASES = [
  {
    id: "pur_201",
    clientName: "Marcus Vance",
    clientEmail: "marcus.vance@gmail.com",
    itemName: "Monthly All-Access Pass",
    category: "Subscription",
    tokensOrCost: "99 Tokens / mo",
    status: "Active",
    timestamp: "2026-09-15T09:35:00.000Z"
  },
  {
    id: "pur_202",
    clientName: "David Miller",
    clientEmail: "david.miller@gmail.com",
    itemName: "Transformation Pack (75 + 15 Bonus)",
    category: "Token Pack",
    tokensOrCost: "$49 USD (90 Tokens)",
    status: "Completed",
    timestamp: "2026-10-01T11:05:00.000Z"
  },
  {
    id: "pur_203",
    clientName: "David Miller",
    clientEmail: "david.miller@gmail.com",
    itemName: "Monthly All-Access Pass",
    category: "Subscription",
    tokensOrCost: "99 Tokens / mo",
    status: "Active",
    timestamp: "2026-10-01T11:10:00.000Z"
  },
  {
    id: "pur_204",
    clientName: "Elena Rostova",
    clientEmail: "elena.rostova@workspace.corp",
    itemName: "Starter Pack (25 Tokens)",
    category: "Token Pack",
    tokensOrCost: "$19 USD (25 Tokens)",
    status: "Completed",
    timestamp: "2026-10-04T12:00:00.000Z"
  }
];

// Registered Firebase SuperAdmin Emails
export const FIREBASE_SUPERADMIN_EMAIL = 'support@aifoundation.net.au';
export const FIREBASE_SUPERADMIN_EMAILS = [
  'support@aifoundation.net.au',
  'davidrobertson.info@gmail.com',
  'david@aifoundation.com.au'
];

// Credentials SuperAdmin can assign across registered users
export const ADMIN_CREDENTIALS = [
  { 
    id: 'supporter', 
    label: 'Supporter', 
    title: 'Community Supporter', 
    badgeClass: 'badge-lime', 
    color: '#84cc16', 
    icon: '⭐', 
    desc: 'Default registered user. Token recharge, masterclass streaming & coaching booking.' 
  },
  { 
    id: 'athlete', 
    label: 'Athlete', 
    title: 'Competitive Athlete', 
    badgeClass: 'badge-cyan', 
    color: '#06b6d4', 
    icon: '🏅', 
    desc: 'Athlete credential. High-performance athletic split tracking, full masterclass access & biofeedback.' 
  },
  { 
    id: 'trainer', 
    label: 'Trainer', 
    title: 'Personal Trainer & Fitness Coach', 
    badgeClass: 'badge-yellow', 
    color: '#eab308', 
    icon: '🏋️', 
    desc: 'Certified Personal Trainer. Form audits, customized workout plans, and technique masterclasses.' 
  },
  { 
    id: 'strength_coach', 
    label: 'Strength Coach', 
    title: 'Strength & Conditioning Specialist', 
    badgeClass: 'badge-yellow', 
    color: '#f59e0b', 
    icon: '⚡', 
    desc: 'Strength & conditioning coach. Power lifting, athletic rate of force development, and barbell programming.' 
  },
  { 
    id: 'nutritionist', 
    label: 'Nutritionist', 
    title: 'Dietary & Macro Specialist', 
    badgeClass: 'badge-green', 
    color: '#10b981', 
    icon: '🥗', 
    desc: 'Nutrition specialist credential. Macro blueprints, caloric calculations & dietary consultations.' 
  },
  { 
    id: 'physiotherapist', 
    label: 'Physiotherapist', 
    title: 'Physiotherapist & Mobility Specialist', 
    badgeClass: 'badge-teal', 
    color: '#14b8a6', 
    icon: '🩺', 
    desc: 'Physiotherapy credential. Musculoskeletal audits, joint mobilization & rehabilitation notes.' 
  },
  { 
    id: 'exercise_physiologist', 
    label: 'Exercise Physiologist', 
    title: 'Accredited Exercise Physiologist', 
    badgeClass: 'badge-teal', 
    color: '#0d9488', 
    icon: '🧬', 
    desc: 'Exercise Physiologist. Clinical movement therapy for metabolic, cardiovascular, and neurological conditions.' 
  },
  { 
    id: 'rehab_specialist', 
    label: 'Rehab Specialist', 
    title: 'Injury Rehabilitation Specialist', 
    badgeClass: 'badge-cyan', 
    color: '#0891b2', 
    icon: '🩹', 
    desc: 'Rehabilitation Specialist. Post-injury movement reintegration and neuromuscular re-education.' 
  },
  { 
    id: 'doctor', 
    label: 'Doctor', 
    title: 'Sports Medicine Physician', 
    badgeClass: 'badge-blue', 
    color: '#3b82f6', 
    icon: '🏥', 
    desc: 'Medical doctor credential. Clinical injury diagnoses, medical assessments & return-to-play clearance.' 
  },
  { 
    id: 'yoga_pilates', 
    label: 'Yoga & Pilates', 
    title: 'Yoga & Pilates Instructor', 
    badgeClass: 'badge-purple', 
    color: '#9333ea', 
    icon: '🧘', 
    desc: 'Yoga & Pilates Instructor. Spinal alignment, transverse abdominal recruitment, and restorative flows.' 
  },
  { 
    id: 'accountant', 
    label: 'Accountant', 
    title: 'Financial Auditor & Accountant', 
    badgeClass: 'badge-purple', 
    color: '#a855f7', 
    icon: '📊', 
    desc: 'Financial auditor credential. Inspects token purchase ledgers, revenue transactions & invoice records.' 
  },
  { 
    id: 'admin', 
    label: 'Admin', 
    title: 'Operations Administrator', 
    badgeClass: 'badge-orange', 
    color: '#f97316', 
    icon: '⚡', 
    desc: 'Operations administrator. Manages intake bookings, system settings & client communications.' 
  },
  { 
    id: 'mainadmin', 
    label: 'MainAdmin', 
    title: 'Assistant SuperAdmin', 
    badgeClass: 'badge-orange', 
    color: '#f59e0b', 
    icon: '🛡️', 
    desc: 'Assistant to the SuperAdmin. Full operational authority across user directory, applications, token adjustments and content.' 
  },
  { 
    id: 'superadmin', 
    label: 'SuperAdmin', 
    title: 'Firebase Master SuperAdmin', 
    badgeClass: 'badge-red', 
    color: '#ef4444', 
    icon: '🔥', 
    desc: 'Registered Firebase Master Admin. Sole authority to assign SuperAdmin and MainAdmin credentials.' 
  }
];

// Helper: Determine if email is a registered Firebase SuperAdmin (support@aifoundation.net.au or Trainer David)
export function isUserSuperAdmin(email) {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return FIREBASE_SUPERADMIN_EMAILS.some(e => e.toLowerCase() === clean);
}

// Helper: Determine if an email or role has administrative access
export function isUserAdmin(email) {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  if (isUserSuperAdmin(cleanEmail)) return true;
  const users = getRegisteredUsers();
  const match = users.find(u => u.email?.toLowerCase() === cleanEmail);
  return match ? ['superadmin', 'mainadmin', 'admin', 'trainer', 'strength_coach', 'doctor', 'accountant', 'physiotherapist', 'nutritionist', 'exercise_physiologist', 'rehab_specialist', 'yoga_pilates'].includes(match.role) : false;
}

// Helper: Get registered users with guaranteed SuperAdmin entry and role sanitization
export function getRegisteredUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    let users = raw ? JSON.parse(raw) : [...INITIAL_USERS];

    // Ensure SuperAdmin account is always present and marked superadmin
    const superAdminIndex = users.findIndex(u => u.email?.toLowerCase() === FIREBASE_SUPERADMIN_EMAIL.toLowerCase());
    if (superAdminIndex >= 0) {
      users[superAdminIndex].role = 'superadmin';
    } else {
      users.unshift(INITIAL_USERS[0]);
    }

    // Ensure every user has a role attribute
    users = users.map(u => ({
      ...u,
      role: isUserSuperAdmin(u.email) ? 'superadmin' : (u.role || 'supporter')
    }));

    return users;
  } catch (e) {
    return INITIAL_USERS;
  }
}

// SuperAdmin Function: Assign administrative credentials to any registered user
export function updateUserRole(userId, newRole) {
  try {
    const users = getRegisteredUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex >= 0) {
      const targetUser = users[userIndex];
      // Cannot demote the registered Firebase SuperAdmin
      if (isUserSuperAdmin(targetUser.email) && newRole !== 'superadmin') {
        return { success: false, error: 'Firebase SuperAdmin email cannot be demoted or changed.' };
      }

      users[userIndex].role = newRole;
      users[userIndex].roleAssignedAt = new Date().toISOString();
      users[userIndex].notes = `Assigned ${newRole.toUpperCase()} credentials by SuperAdmin (${new Date().toLocaleDateString()}).`;

      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      return { success: true, user: users[userIndex] };
    }
    return { success: false, error: 'User account not found.' };
  } catch (e) {
    console.error("Error updating user role:", e);
    return { success: false, error: e.message };
  }
}

// SuperAdmin Function: Pre-authorize an email address with specific permissions/role (trainer, doctor, accountant, admin)
export function preauthorizeUserRole(email, name, role, tokens = 0) {
  try {
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Valid email address is required.' };
    }
    const users = getRegisteredUsers();
    const cleanEmail = email.trim().toLowerCase();
    const existingIndex = users.findIndex(u => u.email?.toLowerCase() === cleanEmail);

    if (existingIndex >= 0) {
      if (isUserSuperAdmin(cleanEmail) && role !== 'superadmin') {
        return { success: false, error: 'Cannot modify Firebase SuperAdmin role.' };
      }
      users[existingIndex].role = role;
      if (name && name.trim()) users[existingIndex].name = name.trim();
      if (tokens > 0) users[existingIndex].tokens = (users[existingIndex].tokens || 0) + Number(tokens);
      users[existingIndex].roleAssignedAt = new Date().toISOString();
      users[existingIndex].notes = `Permissions assigned as ${role.toUpperCase()} by SuperAdmin (${new Date().toLocaleDateString()}).`;
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      return { success: true, user: users[existingIndex] };
    } else {
      const newUser = {
        id: `authorized_${Date.now()}`,
        email: cleanEmail,
        name: name?.trim() || cleanEmail.split('@')[0],
        givenName: name?.trim() ? name.trim().split(' ')[0] : cleanEmail.split('@')[0],
        picture: '',
        role: role,
        tokens: Number(tokens) || (['trainer', 'doctor', 'accountant'].includes(role) ? 50 : 0),
        registeredAt: new Date().toISOString(),
        roleAssignedAt: new Date().toISOString(),
        notes: `Pre-authorized with ${role.toUpperCase()} credentials by SuperAdmin. Ready for user signup.`
      };
      users.unshift(newUser);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      return { success: true, user: newUser };
    }
  } catch (e) {
    console.error("Error preauthorizing user role:", e);
    return { success: false, error: e.message };
  }
}

// Helper: Save/Update user on Google Login
// Rule:
// - The only SuperAdmin is the registered Firebase email address (support@aifoundation.net.au)
// - If people register now, they become a supporter (0 tokens, no other functions given until assigned by SuperAdmin)
export function registerOrUpdateGoogleUser(googleProfile, backupPassword = '', assignedRole = null) {
  try {
    const users = getRegisteredUsers();
    const cleanEmail = googleProfile.email.trim().toLowerCase();
    const existingIndex = users.findIndex(u => u.email?.toLowerCase() === cleanEmail);
    const isSuperAdmin = isUserSuperAdmin(cleanEmail);
    const isDavid = cleanEmail === 'davidrobertson.info@gmail.com';

    if (existingIndex >= 0) {
      const existing = users[existingIndex];
      let effectiveRole = existing.role;
      if (isSuperAdmin) {
        effectiveRole = 'superadmin';
      } else if (assignedRole) {
        effectiveRole = assignedRole;
      } else if (!effectiveRole) {
        effectiveRole = isDavid ? 'admin' : 'supporter';
      }

      const updated = {
        ...existing,
        name: googleProfile.name || existing.name,
        picture: googleProfile.picture || existing.picture,
        role: effectiveRole,
        backupPassword: backupPassword || existing.backupPassword || '',
        hasBackupPassword: Boolean(backupPassword || existing.backupPassword),
        lastLoginAt: new Date().toISOString()
      };
      users[existingIndex] = updated;
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      return updated;
    } else {
      // New user registration: role given under Google login button
      const effectiveRole = isSuperAdmin ? 'superadmin' : (assignedRole || (isDavid ? 'admin' : 'supporter'));
      const newUser = {
        id: googleProfile.id || `google_${Date.now()}`,
        email: googleProfile.email,
        name: googleProfile.name,
        givenName: googleProfile.givenName || googleProfile.name?.split(' ')[0] || 'User',
        picture: googleProfile.picture || '',
        role: effectiveRole,
        tokens: isSuperAdmin ? 9999 : (['mainadmin', 'admin', 'trainer', 'strength_coach', 'doctor', 'physiotherapist', 'nutritionist', 'exercise_physiologist', 'rehab_specialist', 'yoga_pilates', 'accountant'].includes(effectiveRole) ? 50 : (isDavid ? 50 : 0)),
        backupPassword: backupPassword || '',
        hasBackupPassword: Boolean(backupPassword),
        registeredAt: new Date().toISOString(),
        notes: isSuperAdmin 
          ? "Registered Firebase SuperAdmin. Full credential grant authority across all users." 
          : `Registered with ${effectiveRole.toUpperCase()} role given under Google Login.`
      };
      users.unshift(newUser);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      return newUser;
    }
  } catch (e) {
    console.error("Error in registerOrUpdateGoogleUser:", e);
    return null;
  }
}

// Authenticate using secondary backup password if Google fails
export function authenticateWithBackupPassword(email, password) {
  try {
    if (!email || !password) return { success: false, error: 'Email and password are required' };
    const users = getRegisteredUsers();
    const user = users.find(u => u.email?.toLowerCase() === email.trim().toLowerCase());

    if (!user) {
      return { success: false, error: 'No account found for this email address. Please register with Google first.' };
    }

    if (!user.backupPassword) {
      return { success: false, error: 'No secondary backup password has been configured yet. Please log in with Google to establish your backup password.' };
    }

    if (user.backupPassword !== password) {
      return { success: false, error: 'Incorrect secondary backup password.' };
    }

    const isSuperAdmin = isUserSuperAdmin(user.email);
    const role = isSuperAdmin ? 'superadmin' : (user.role || 'supporter');

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        givenName: user.givenName,
        picture: user.picture,
        role: role,
        tokens: user.tokens
      }
    };
  } catch (e) {
    console.error("Error in authenticateWithBackupPassword:", e);
    return { success: false, error: 'Authentication failed. Please try again.' };
  }
}

// Set or update secondary backup password
export function updateUserBackupPassword(email, password) {
  try {
    const users = getRegisteredUsers();
    const userIndex = users.findIndex(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (userIndex >= 0) {
      users[userIndex].backupPassword = password;
      users[userIndex].hasBackupPassword = true;
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      return users[userIndex];
    }
    return null;
  } catch (e) {
    console.error("Error updating backup password:", e);
    return null;
  }
}

// Helper: Update user tokens
export function adjustUserTokens(userId, deltaTokens) {
  try {
    const users = getRegisteredUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex >= 0) {
      users[userIndex].tokens = Math.max(0, (users[userIndex].tokens || 0) + deltaTokens);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      return users[userIndex];
    }
    return null;
  } catch (e) {
    console.error("Error adjusting tokens:", e);
    return null;
  }
}

// Helper: Get Bookings
export function getAdminBookings() {
  try {
    const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(INITIAL_BOOKINGS));
      return INITIAL_BOOKINGS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_BOOKINGS;
  }
}

// Helper: Add new booking
export function addAdminBooking(booking) {
  try {
    const bookings = getAdminBookings();
    const newEntry = {
      id: `bk_${Date.now()}`,
      clientName: booking.fullName || booking.clientName,
      clientEmail: booking.email || booking.clientEmail,
      phone: booking.phone || '',
      serviceTitle: booking.serviceType || booking.serviceTitle,
      serviceCategory: booking.category || 'Coaching',
      goalOrNotes: booking.injuryHistory || booking.goalOrNotes || 'None specified',
      status: 'Pending',
      requestedAt: new Date().toISOString()
    };
    bookings.unshift(newEntry);
    localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
    return newEntry;
  } catch (e) {
    console.error("Error adding booking:", e);
    return null;
  }
}

// Helper: Update booking status
export function updateAdminBookingStatus(bookingId, status) {
  try {
    const bookings = getAdminBookings();
    const idx = bookings.findIndex(b => b.id === bookingId);
    if (idx >= 0) {
      bookings[idx].status = status;
      localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
      return bookings[idx];
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Helper: Get Purchases
export function getAdminPurchases() {
  try {
    const raw = localStorage.getItem(PURCHASES_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PURCHASES_STORAGE_KEY, JSON.stringify(INITIAL_PURCHASES));
      return INITIAL_PURCHASES;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_PURCHASES;
  }
}

// Helper: Add purchase record
export function addAdminPurchase(purchase) {
  try {
    const purchases = getAdminPurchases();
    const newPurchase = {
      id: `pur_${Date.now()}`,
      clientName: purchase.clientName || 'Registered User',
      clientEmail: purchase.clientEmail || 'user@gmail.com',
      itemName: purchase.itemName,
      category: purchase.category || 'Store',
      tokensOrCost: purchase.tokensOrCost,
      status: 'Completed',
      timestamp: new Date().toISOString()
    };
    purchases.unshift(newPurchase);
    localStorage.setItem(PURCHASES_STORAGE_KEY, JSON.stringify(purchases));
    return newPurchase;
  } catch (e) {
    console.error("Error adding purchase:", e);
    return null;
  }
}
