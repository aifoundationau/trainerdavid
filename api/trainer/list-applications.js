// GET or POST /api/trainer/list-applications
// Returns all trainer applications for SuperAdmin and MainAdmin review.
import { handler, requireUser, isSuperAdmin, db, HttpError } from '../_lib/firebaseAdmin.js';

export default handler(async (req) => {
  const caller = await requireUser(req);
  const callerIsSuperAdmin = isSuperAdmin(caller);

  let callerIsAdmin = false;
  if (!callerIsSuperAdmin) {
    if (['mainadmin', 'admin'].includes(caller.pt_role)) {
      callerIsAdmin = true;
    } else {
      const callerSnap = await db.collection('users').doc(caller.uid).get();
      const role = (callerSnap.get('role') || '').toLowerCase();
      if (['mainadmin', 'admin'].includes(role)) {
        callerIsAdmin = true;
      }
    }
  }

  if (!callerIsSuperAdmin && !callerIsAdmin) {
    throw new HttpError(403, 'Forbidden: Only administrators can inspect applications.');
  }

  const snapshot = await db.collection('trainer_applications').orderBy('submittedAt', 'desc').get();
  const applications = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  return { applications };
});
