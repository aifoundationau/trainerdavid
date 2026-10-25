// POST /api/trainer/submit-application
// Records the supporter's application to become a trainer or health & fitness professional.
// Sends a notification message to SuperAdmin and MainAdmin containing the Google Drive folder ID.
import { handler, requireUser, db, HttpError } from '../_lib/firebaseAdmin.js';

const VALID_ROLES = [
  'trainer',
  'strength_coach',
  'physiotherapist',
  'nutritionist',
  'doctor',
  'exercise_physiologist',
  'rehab_specialist',
  'yoga_pilates'
];

const ROLE_LABELS = {
  trainer: 'Personal Trainer',
  strength_coach: 'Strength & Conditioning Coach',
  physiotherapist: 'Physiotherapist',
  nutritionist: 'Nutritionist / Dietitian',
  doctor: 'Sports Medicine Doctor',
  exercise_physiologist: 'Accredited Exercise Physiologist',
  rehab_specialist: 'Rehabilitation Specialist',
  yoga_pilates: 'Yoga & Pilates Instructor'
};

export default handler(async (req) => {
  const user = await requireUser(req);
  const email = String(user.email || '').trim().toLowerCase();
  const name = user.name || (email.split('@')[0]) || 'Applicant';

  const {
    requestedRole: rawRole,
    phone = '',
    experience = '',
    bio = '',
    fileId = '',
    fileName = '',
    fileSize = 0,
    webViewLink = '',
    folderId = '',
    folderPath = ''
  } = req.body || {};

  const requestedRole = String(rawRole || '').trim().toLowerCase();
  if (!VALID_ROLES.includes(requestedRole)) {
    throw new HttpError(400, `Please select a valid health & fitness role from: ${VALID_ROLES.join(', ')}.`);
  }

  if (!fileId || !folderId) {
    throw new HttpError(400, 'Credentials must be uploaded to Google Drive first.');
  }

  const now = new Date().toISOString();
  const roleLabel = ROLE_LABELS[requestedRole] || requestedRole;
  const folderUrl = `https://drive.google.com/drive/folders/${folderId}`;

  const applicationData = {
    uid: user.uid,
    email,
    name,
    picture: user.picture || '',
    requestedRole,
    requestedRoleLabel: roleLabel,
    phone: String(phone).slice(0, 50),
    experience: String(experience).slice(0, 1000),
    bio: String(bio).slice(0, 2000),
    fileId,
    fileName,
    fileSize: Number(fileSize) || 0,
    webViewLink,
    folderId,
    folderPath,
    folderUrl,
    status: 'pending',
    submittedAt: now,
    updatedAt: now,
    reviewedBy: null,
    reviewedAt: null,
    assignedRole: null
  };

  // 1. Store or update application record
  await db.collection('trainer_applications').doc(user.uid).set(applicationData, { merge: true });

  // 2. Send message/notification to SuperAdmin and MainAdmin with Drive Folder ID
  await db.collection('admin_notifications').add({
    type: 'trainer_application',
    title: `New Application: ${name} (${roleLabel})`,
    message: `${name} (${email}) has applied for the role of ${roleLabel}. Professional credentials uploaded to Google Drive.`,
    applicantUid: user.uid,
    applicantName: name,
    applicantEmail: email,
    requestedRole,
    requestedRoleLabel: roleLabel,
    driveFolderId: folderId,
    driveFolderUrl: folderUrl,
    driveFileUrl: webViewLink,
    fileName,
    status: 'pending',
    read: false,
    createdAt: now
  });

  // 3. Mark applicationStatus on user document
  try {
    const userRef = db.collection('users').doc(user.uid);
    const snap = await userRef.get();
    if (snap.exists) {
      await userRef.update({
        applicationStatus: 'pending',
        requestedRole,
        applicationUpdatedAt: now
      });
    }
  } catch (err) {
    console.warn('Could not update user applicationStatus flag:', err);
  }

  return {
    success: true,
    message: `Your application for ${roleLabel} has been submitted! SuperAdmin has been notified with your Google Drive folder.`,
    application: applicationData
  };
});
