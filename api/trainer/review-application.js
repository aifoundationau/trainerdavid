// POST /api/trainer/review-application
// SuperAdmin or MainAdmin approves, edits or rejects a trainer application.
// Assigns the approved role to the user and syncs Firebase Auth claims.
import { handler, requireUser, isSuperAdmin, adminAuth, db, HttpError } from '../_lib/firebaseAdmin.js';

const VALID_ROLES = [
  'supporter',
  'trainer',
  'strength_coach',
  'physiotherapist',
  'nutritionist',
  'doctor',
  'exercise_physiologist',
  'rehab_specialist',
  'yoga_pilates',
  'accountant',
  'athlete',
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
      if ((callerSnap.get('role') || '').toLowerCase() === 'mainadmin') {
        callerIsMainAdmin = true;
      }
    }
  }

  if (!callerIsSuperAdmin && !callerIsMainAdmin) {
    throw new HttpError(403, 'Forbidden: Only SuperAdmin or MainAdmin can review applications.');
  }

  const { applicantUid, action, assignedRole: customRole, notes = '' } = req.body || {};
  if (!applicantUid) throw new HttpError(400, 'Missing applicant UID.');
  if (!['approve', 'reject'].includes(action)) throw new HttpError(400, 'Action must be "approve" or "reject".');

  const appRef = db.collection('trainer_applications').doc(applicantUid);
  const appSnap = await appRef.get();
  if (!appSnap.exists) throw new HttpError(404, 'Application not found.');

  const appData = appSnap.data();
  const applicantEmail = (appData.email || '').toLowerCase();
  const now = new Date().toISOString();

  if (action === 'approve') {
    const roleToAssign = String(customRole || appData.requestedRole || 'trainer').trim().toLowerCase();
    if (!VALID_ROLES.includes(roleToAssign)) {
      throw new HttpError(400, `Invalid role "${roleToAssign}".`);
    }

    // MainAdmin restrictions: cannot assign superadmin or mainadmin
    if (callerIsMainAdmin && (roleToAssign === 'superadmin' || roleToAssign === 'mainadmin')) {
      throw new HttpError(403, 'Forbidden: MainAdmin cannot assign SuperAdmin or MainAdmin roles.');
    }

    // 1. Update application status
    await appRef.update({
      status: 'approved',
      assignedRole: roleToAssign,
      notes: String(notes).slice(0, 500),
      reviewedBy: caller.email || caller.uid,
      reviewedAt: now,
      updatedAt: now
    });

    // 2. Assign role in pt_role_assignments
    if (applicantEmail) {
      await db.collection('pt_role_assignments').doc(applicantEmail).set({
        email: applicantEmail,
        role: roleToAssign,
        assignedAt: now,
        assignedBy: caller.uid,
        assignedByEmail: caller.email || ''
      }, { merge: true });
    }

    // 3. Update user profile
    const userRef = db.collection('users').doc(applicantUid);
    const userSnap = await userRef.get();
    if (userSnap.exists) {
      await userRef.update({
        role: roleToAssign,
        status: roleToAssign,
        pt_role: roleToAssign,
        applicationStatus: 'approved',
        updatedAt: now
      });
    }

    // 4. Update Auth custom claims
    try {
      await adminAuth.setCustomUserClaims(applicantUid, {
        pt_role: roleToAssign,
        admin: roleToAssign === 'admin'
      });
    } catch (err) {
      console.warn('Could not update user Auth claims:', err);
    }

    return {
      success: true,
      status: 'approved',
      applicantUid,
      assignedRole: roleToAssign,
      reviewedBy: caller.email || caller.uid
    };
  } else {
    // Action is reject
    await appRef.update({
      status: 'rejected',
      notes: String(notes).slice(0, 500),
      reviewedBy: caller.email || caller.uid,
      reviewedAt: now,
      updatedAt: now
    });

    const userRef = db.collection('users').doc(applicantUid);
    const userSnap = await userRef.get();
    if (userSnap.exists) {
      await userRef.update({
        applicationStatus: 'rejected',
        updatedAt: now
      });
    }

    return {
      success: true,
      status: 'rejected',
      applicantUid,
      reviewedBy: caller.email || caller.uid
    };
  }
});
