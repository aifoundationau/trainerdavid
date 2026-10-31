// POST /api/videos/publish
// Allows approved trainers, specialists, and admins to publish instructional videos
// with custom token rates (1 token, 5 tokens, etc.) to the site.
import { handler, requireUser, isSuperAdmin, db, HttpError } from '../_lib/firebaseAdmin.js';

// Every role has the video upload/publish feature (supporters, athletes, accountants, trainers, specialists, admins)
const ALLOWED_ROLES = [
  'supporter',
  'athlete',
  'accountant',
  'trainer',
  'strength_coach',
  'physiotherapist',
  'nutritionist',
  'doctor',
  'exercise_physiologist',
  'rehab_specialist',
  'yoga_pilates',
  'admin',
  'mainadmin',
  'superadmin'
];

export default handler(async (req) => {
  const caller = await requireUser(req);
  let callerRole = 'supporter';

  if (isSuperAdmin(caller)) {
    callerRole = 'superadmin';
  } else {
    const callerSnap = await db.collection('users').doc(caller.uid).get();
    callerRole = (callerSnap.get('role') || caller.pt_role || 'supporter').toLowerCase();
  }

  if (!ALLOWED_ROLES.includes(callerRole)) {
    throw new HttpError(403, 'Only approved coaches, health specialists and administrators can publish workout videos.');
  }

  const {
    title: rawTitle,
    category = 'Chest & Shoulders',
    muscleGroup = 'Full Body',
    equipment = 'General Equipment',
    difficulty = 'Intermediate',
    duration = '10 mins',
    tokenCost: rawCost = 1,
    messageTokenCost: rawMsgCost,
    videoUrl: rawUrl = '',
    thumbnailUrl: rawThumb = '',
    shortDescription = '',
    keyCues = []
  } = req.body || {};

  const title = String(rawTitle || '').trim();
  if (!title) throw new HttpError(400, 'Video title is required.');

  // Strict integer rule: tokenCost must be a non-negative integer (0 = free to view)
  const tokenCost = Math.max(0, Math.round(Number(rawCost !== undefined ? rawCost : 1)));
  const isFree = tokenCost === 0;

  // Custom message token cost chosen by creator (0 = free to message, default 1)
  const messageTokenCost = rawMsgCost !== undefined 
    ? Math.max(0, Math.round(Number(rawMsgCost) || 0)) 
    : 1;

  const videoUrl = String(rawUrl || '').trim();
  // Extract YouTube ID: ONLY YouTube videos are allowed
  const ytMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
  if (!ytMatch || !ytMatch[1]) {
    throw new HttpError(400, 'Only YouTube videos are allowed. Please provide a valid YouTube video URL.');
  }
  const youtubeId = ytMatch[1];
  const id = youtubeId;
  const thumbnailUrl = rawThumb || `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${youtubeId}`;
  const authorName = caller.name || caller.email.split('@')[0] || 'Coach';
  const now = new Date().toISOString();

  const videoDoc = {
    id,
    youtubeId,
    youtubeUrl: videoUrl,
    embedUrl,
    title,
    rawTitle: title,
    author: callerRole === 'supporter' ? `${authorName} (Member)` : `${authorName} (${callerRole.replace('_', ' ')})`,
    creatorUid: caller.uid,
    creatorEmail: caller.email,
    creatorRole: callerRole,
    thumbnailUrl,
    category,
    muscleGroup,
    equipment,
    difficulty,
    duration,
    tokenCost,
    messageTokenCost,
    isFree,
    shortDescription: String(shortDescription).slice(0, 500),
    keyCues: Array.isArray(keyCues) ? keyCues.slice(0, 5) : [],
    createdAt: now,
    updatedAt: now,
    status: 'published'
  };

  await db.collection('pt_videos').doc(id).set(videoDoc);

  return {
    success: true,
    video: videoDoc
  };
});
