// Role-based access control (RBAC) catalog for Trainer David (#pt):
// 9 system roles, 18 granular permissions, baseline permissions, and validation helpers.
// Firestore collections:
//   /pt_roles/{roleKey}            { roleName, permissions, updatedAt, updatedBy }
//   /pt_role_assignments/{email}   { email, role, assignedAt, assignedBy } (email lower-cased)
//
// Rules:
// - The owner's Google accounts (SuperAdmin) always hold every permission.
// - Every new user who registers instantly becomes a 'supporter' with baseline supporter permissions.
// - The SuperAdmin can assign any other role to a verified email address.

export const ROLES_COLLECTION = 'pt_roles';
export const ROLE_ASSIGNMENTS_COLLECTION = 'pt_role_assignments';

export const SUPERADMIN_ROLE = 'superadmin';
export const DEFAULT_ROLE = 'supporter';

// Owner accounts recognized across all AI Foundation applications
export const SUPERADMIN_UIDS = ['ZK79FRQoVlYhsgvMibhi81dRUWj2', 'L5euSJAfNKdDOX6mT0qmrCGjUA53'];
export const SUPERADMIN_EMAILS = ['davidrobertson.info@gmail.com', 'support@aifoundation.net.au'];

export function isOwnerAccount({ uid, email, emailVerified } = {}) {
  return SUPERADMIN_UIDS.includes(uid) ||
    (emailVerified === true && SUPERADMIN_EMAILS.includes(String(email || '').trim().toLowerCase()));
}

export const PERMISSION_GROUPS = [
  { key: 'training', label: 'Workouts & Masterclasses' },
  { key: 'coaching', label: 'Coaching & Consultations' },
  { key: 'clinical', label: 'Clinical & Health Records' },
  { key: 'nutrition', label: 'Nutrition & Diet' },
  { key: 'finance', label: 'Tokens & Finance' },
  { key: 'governance', label: 'Administration & Governance' },
];

export const PERMISSIONS = [
  // Training
  {
    key: 'videos.view', group: 'training', label: 'View Workout Catalog',
    description: 'Inspect workout library, exercise tutorials, and biomechanical technique guides.'
  },
  {
    key: 'videos.unlock', group: 'training', label: 'Unlock Video Masterclasses',
    description: 'Spend personal FitTokens to stream full HD video masterclasses.'
  },
  {
    key: 'videos.manage', group: 'training', label: 'Manage Workout Videos',
    description: 'Add, update, or archive exercise tutorials, categories, and anatomical cues.'
  },

  // Coaching
  {
    key: 'consultations.book', group: 'coaching', label: 'Book Consultations',
    description: 'Submit intake inquiries for 1-on-1 personal training, nutrition, or rehab assessments.'
  },
  {
    key: 'consultations.view_assigned', group: 'coaching', label: 'View Assigned Clients',
    description: 'Access client consultation details and inquiries assigned to your discipline.'
  },
  {
    key: 'consultations.view_all', group: 'coaching', label: 'View All Consultations',
    description: 'Access the complete booking pipeline and incoming consultation requests.'
  },
  {
    key: 'consultations.manage', group: 'coaching', label: 'Manage Consultations',
    description: 'Approve, reschedule, complete, or assign consultation requests.'
  },

  // Clinical / Health
  {
    key: 'clinical_notes.view', group: 'clinical', label: 'View Clinical Rehab Notes',
    description: 'Inspect sensitive client injury histories, joint mobility blocks, and medical reports (Privacy Act protected).'
  },
  {
    key: 'clinical_notes.edit', group: 'clinical', label: 'Author Clinical Rehab Notes',
    description: 'Document diagnostic assessments, rehabilitation regimens, and clinical return-to-play clearances.'
  },

  // Nutrition
  {
    key: 'nutrition.view', group: 'nutrition', label: 'View Nutrition Goals',
    description: 'Inspect client dietary preferences, caloric targets, and macro split logs.'
  },
  {
    key: 'nutrition.manage', group: 'nutrition', label: 'Prescribe Nutrition Plans',
    description: 'Author and modify macronutrient blueprints, meal timing, and supplementation guides.'
  },

  // Finance & Tokens
  {
    key: 'tokens.spend', group: 'finance', label: 'Spend FitTokens',
    description: 'Redeem FitTokens for video unlocks, booking credits, or service perks.'
  },
  {
    key: 'tokens.grant', group: 'finance', label: 'Grant / Adjust FitTokens',
    description: 'Credit or debit member FitToken balances with transactional audit logging.'
  },
  {
    key: 'finance.view', group: 'finance', label: 'View Financial Ledgers',
    description: 'Monitor token ledger velocity, package sales totals, and service transaction records.'
  },
  {
    key: 'stripe.audit', group: 'finance', label: 'Audit Stripe Transactions',
    description: 'Inspect Stripe Checkout sessions, Payment Link receipts, and subscription statuses.'
  },

  // Governance
  {
    key: 'users.manage', group: 'governance', label: 'Manage User Profiles',
    description: 'Search member directory, audit account logins, and manage user profile details.'
  },
  {
    key: 'roles.manage', group: 'governance', label: 'Configure Role Permissions',
    description: 'Assign staff credentials and configure granular permissions across system roles.'
  },
  {
    key: 'services.manage', group: 'governance', label: 'Manage Service Catalog',
    description: 'Modify coaching tiers, consultation pricing, and service descriptions.'
  },
];

export const PERMISSION_KEYS = PERMISSIONS.map(p => p.key);
export const PERMISSION_BY_KEY = Object.fromEntries(PERMISSIONS.map(p => [p.key, p]));

// System Roles: Highest authority first
export const ROLES = [
  {
    key: 'superadmin', label: 'SuperAdmin', level: 100, badgeClass: 'badge-red', color: '#ef4444', icon: '🔥',
    description: 'Master SuperAdmin authority. Full unrestricted access across every system and role configuration.'
  },
  {
    key: 'mainadmin', label: 'MainAdmin', level: 95, badgeClass: 'badge-orange', color: '#f59e0b', icon: '🛡️',
    description: 'Assistant to the SuperAdmin. Full operational authority across users, tokens, applications and content, excluding assigning superadmin or mainadmin.'
  },
  {
    key: 'admin', label: 'Admin', level: 90, badgeClass: 'badge-orange', color: '#f97316', icon: '⚡',
    description: 'Platform Administrator. Manages user directory, service packages, token distribution, and operational pipeline.'
  },
  {
    key: 'doctor', label: 'Doctor', level: 75, badgeClass: 'badge-blue', color: '#3b82f6', icon: '🏥',
    description: 'Sports Medicine Physician. Conducts clinical medical assessments, evaluates acute injuries, and grants training clearances.'
  },
  {
    key: 'physiotherapist', label: 'Physiotherapist', level: 75, badgeClass: 'badge-teal', color: '#14b8a6', icon: '🩺',
    description: 'Licensed Physiotherapist. Diagnoses musculoskeletal imbalances, prescribes joint mobility routines, and authors clinical rehab notes.'
  },
  {
    key: 'exercise_physiologist', label: 'Exercise Physiologist', level: 70, badgeClass: 'badge-teal', color: '#0d9488', icon: '🧬',
    description: 'Accredited Exercise Physiologist. Prescribes clinical exercise interventions for chronic health conditions and complex biomechanics.'
  },
  {
    key: 'rehab_specialist', label: 'Rehabilitation Specialist', level: 65, badgeClass: 'badge-cyan', color: '#0891b2', icon: '🩹',
    description: 'Injury Rehabilitation Specialist. Guides return-to-play movement progressions and post-operative functional rebuilds.'
  },
  {
    key: 'nutritionist', label: 'Nutritionist', level: 60, badgeClass: 'badge-green', color: '#10b981', icon: '🥗',
    description: 'Accredited Nutritionist. Authors customized macro blueprints, calculates caloric targets, and guides dietary strategies.'
  },
  {
    key: 'strength_coach', label: 'Strength Coach', level: 55, badgeClass: 'badge-yellow', color: '#f59e0b', icon: '⚡',
    description: 'Strength & Conditioning Specialist. Designs periodized strength development, barbell technique protocols, and power cycles.'
  },
  {
    key: 'trainer', label: 'Trainer', level: 50, badgeClass: 'badge-yellow', color: '#eab308', icon: '🏋️',
    description: 'Certified Personal Trainer. Conducts 1-on-1 coaching, performs technique video audits, and delivers periodized workout plans.'
  },
  {
    key: 'accountant', label: 'Accountant', level: 45, badgeClass: 'badge-purple', color: '#a855f7', icon: '📊',
    description: 'Finance & Accounts Specialist. Audits Stripe transactions, token sales ledgers, and generates fiscal reports.'
  },
  {
    key: 'yoga_pilates', label: 'Yoga & Pilates', level: 45, badgeClass: 'badge-purple', color: '#9333ea', icon: '🧘',
    description: 'Yoga & Pilates Instructor. Teaches core stability, postural alignment, flexibility flows, and breathwork mastery.'
  },
  {
    key: 'athlete', label: 'Athlete', level: 30, badgeClass: 'badge-cyan', color: '#06b6d4', icon: '🏅',
    description: 'Sponsored & Competitive Athlete. Access to high-performance strength routines, sport conditioning, and macro tracking.'
  },
  {
    key: 'supporter', label: 'Supporter', level: 10, badgeClass: 'badge-lime', color: '#84cc16', icon: '⭐',
    description: 'Default role for every newly registered Google account. Access to workout catalog, FitToken redemptions, and consultation booking.'
  },
];

export const ROLE_KEYS = ROLES.map(r => r.key);
export const ROLE_BY_KEY = Object.fromEntries(ROLES.map(r => [r.key, r]));
export const ASSIGNABLE_ROLE_KEYS = ROLE_KEYS.filter(k => k !== SUPERADMIN_ROLE);

// Baseline permissions seeded when a role document is created
export const BASELINE_ROLE_PERMISSIONS = {
  superadmin: PERMISSION_KEYS,
  mainadmin: PERMISSION_KEYS.filter(k => k !== 'superadmin.grant'),
  admin: [
    'videos.view', 'videos.unlock', 'videos.manage',
    'consultations.book', 'consultations.view_all', 'consultations.manage',
    'nutrition.view',
    'tokens.spend', 'tokens.grant', 'finance.view', 'stripe.audit',
    'users.manage', 'roles.manage', 'services.manage'
  ],
  physiotherapist: [
    'videos.view', 'videos.unlock', 'videos.manage',
    'consultations.view_assigned', 'consultations.manage',
    'clinical_notes.view', 'clinical_notes.edit',
    'tokens.spend'
  ],
  exercise_physiologist: [
    'videos.view', 'videos.unlock', 'videos.manage',
    'consultations.view_assigned', 'consultations.manage',
    'clinical_notes.view', 'clinical_notes.edit',
    'tokens.spend'
  ],
  rehab_specialist: [
    'videos.view', 'videos.unlock', 'videos.manage',
    'consultations.view_assigned', 'consultations.manage',
    'clinical_notes.view', 'clinical_notes.edit',
    'tokens.spend'
  ],
  doctor: [
    'videos.view', 'videos.unlock', 'videos.manage',
    'consultations.view_assigned', 'consultations.manage',
    'clinical_notes.view', 'clinical_notes.edit',
    'tokens.spend'
  ],
  nutritionist: [
    'videos.view', 'videos.unlock', 'videos.manage',
    'consultations.view_assigned', 'consultations.manage',
    'nutrition.view', 'nutrition.manage',
    'tokens.spend'
  ],
  strength_coach: [
    'videos.view', 'videos.unlock', 'videos.manage',
    'consultations.view_assigned', 'consultations.manage',
    'nutrition.view',
    'tokens.spend'
  ],
  trainer: [
    'videos.view', 'videos.unlock', 'videos.manage',
    'consultations.view_assigned', 'consultations.manage',
    'nutrition.view',
    'tokens.spend'
  ],
  yoga_pilates: [
    'videos.view', 'videos.unlock', 'videos.manage',
    'consultations.view_assigned', 'consultations.manage',
    'tokens.spend'
  ],
  accountant: [
    'tokens.grant', 'finance.view', 'stripe.audit', 'users.manage'
  ],
  athlete: [
    'videos.view', 'videos.unlock',
    'consultations.book', 'nutrition.view', 'tokens.spend'
  ],
  supporter: [
    'videos.view', 'videos.unlock', 'consultations.book', 'tokens.spend'
  ],
};

const ROLE_ALIASES = {
  'super admin': 'superadmin',
  super_admin: 'superadmin',
  'main admin': 'mainadmin',
  main_admin: 'mainadmin',
  'lead trainer': 'trainer',
  'strength coach': 'strength_coach',
  'strength and conditioning': 'strength_coach',
  'exercise physiologist': 'exercise_physiologist',
  'exercise physiology': 'exercise_physiologist',
  'rehab specialist': 'rehab_specialist',
  rehabilitation: 'rehab_specialist',
  'yoga': 'yoga_pilates',
  'pilates': 'yoga_pilates',
  'yoga instructor': 'yoga_pilates',
  'pilates instructor': 'yoga_pilates',
  coach: 'trainer',
  physio: 'physiotherapist',
  physiotherapy: 'physiotherapist',
  medical: 'doctor',
  physician: 'doctor',
  dietitian: 'nutritionist',
  dietician: 'nutritionist',
  finance: 'accountant',
  bookkeeper: 'accountant',
  member: 'supporter',
  client: 'supporter',
  user: 'supporter',
};

export function normalizeRoleKey(value) {
  const text = String(value ?? '').trim().toLowerCase();
  if (!text) return null;
  if (ROLE_BY_KEY[text]) return text;
  return ROLE_ALIASES[text] || null;
}

const EMAIL_PATTERN = /^[^\s@/]+@[^\s@/]+\.[^\s@/]+$/;

export function normalizeEmail(value) {
  const email = String(value ?? '').trim().toLowerCase();
  return EMAIL_PATTERN.test(email) ? email : null;
}

export function sortPermissions(list) {
  const granted = new Set(list || []);
  return PERMISSION_KEYS.filter(k => granted.has(k));
}

export function effectivePermissions(roleKey, stored) {
  return roleKey === SUPERADMIN_ROLE ? [...PERMISSION_KEYS] : sortPermissions(stored);
}
