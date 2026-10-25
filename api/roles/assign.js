// POST /api/roles/assign  { email, role }  (SuperAdmin only)
// Uses Firebase Admin SDK to assign a role to an email address in Firestore and sync Auth claims.

import { handler, requireUser, isSuperAdmin, adminAuth, db, HttpError } from '../_lib/firebaseAdmin.js';

const ASSIGNABLE_ROLES = [
  'supporter',
  'athlete',
  'trainer',
  'strength_coach',
  'nutritionist',
  'physiotherapist',
  'exercise_physiologist',
  'rehab_specialist',
  'doctor',
  'yoga_pilates',
  'accountant',
  'admin',
  'mainadmin'
];

export default handler(async (req) => {
  const caller = await requireUser(req);
  const callerIsSuperAdmin = isSuperAdmin(caller);

  let callerIsMainAdmin = false;
  if (!callerIsSuperAdmin) {
    if (caller.pt_role === 'mainadmin') {
      callerIsMainAdmin = true;
    } else {
      const callerSnap = await db.collection('users').doc(caller.uid).get();
      if (callerSnap.exists && (callerSnap.get('role') || '').toLowerCase() === 'mainadmin') {
        callerIsMainAdmin = true;
      }
    }
  }

  if (!callerIsSuperAdmin && !callerIsMainAdmin) {
    throw new HttpError(403, 'Forbidden: Only SuperAdmin or MainAdmin can assign roles.');
  }

  const { email: rawEmail, role: rawRole } = req.body || {};
  const email = String(rawEmail || '').trim().toLowerCase();
  const role = String(rawRole || '').trim().toLowerCase();

  if (!email || !email.includes('@')) {
    throw new HttpError(400, 'A valid email address is required.');
  }

  if (!ASSIGNABLE_ROLES.includes(role)) {
    throw new HttpError(400, `Invalid role "${rawRole}". Valid assignable roles: ${ASSIGNABLE_ROLES.join(', ')}.`);
  }

  // MainAdmin restrictions:
  // Cannot assign superadmin or mainadmin
  if (callerIsMainAdmin && (role === 'superadmin' || role === 'mainadmin')) {
    throw new HttpError(403, 'Forbidden: MainAdmin cannot assign SuperAdmin or MainAdmin roles.');
  }

  // MainAdmin cannot modify existing superadmin or mainadmin accounts
  if (callerIsMainAdmin) {
    const existingAssign = await db.collection('pt_role_assignments').doc(email).get();
    if (existingAssign.exists) {
      const existingRole = (existingAssign.get('role') || '').toLowerCase();
      if (existingRole === 'superadmin' || existingRole === 'mainadmin') {
        throw new HttpError(403, 'Forbidden: MainAdmin cannot modify SuperAdmin or MainAdmin accounts.');
      }
    }
  }

  const now = new Date().toISOString();

  // 1. Write role assignment to /pt_role_assignments/{email}
  await db.collection('pt_role_assignments').doc(email).set({
    email,
    role,
    assignedAt: now,
    assignedBy: caller.uid,
    assignedByEmail: caller.email || ''
  });

  // 2. Sync Auth custom claims and users document if account exists
  try {
    const targetUser = await adminAuth.getUserByEmail(email);
    if (targetUser) {
      await adminAuth.setCustomUserClaims(targetUser.uid, {
        ...targetUser.customClaims,
        pt_role: role,
        admin: role === 'admin'
      });

      const userDocRef = db.collection('users').doc(targetUser.uid);
      const snap = await userDocRef.get();
      if (snap.exists) {
        await userDocRef.update({
          role,
          status: role,
          pt_role: role,
          updatedAt: now
        });
      }
    }
  } catch (err) {
    if (err.code !== 'auth/user-not-found') {
      console.warn('Could not update user Auth claims:', err);
    }
  }

  return { success: true, email, role, assignedAt: now };
});
