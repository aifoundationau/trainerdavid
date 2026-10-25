// POST /api/videos/publish
// Allows approved trainers, specialists, and admins to publish instructional videos
// with custom token rates (1 token, 5 tokens, etc.) to the site.
import { handler, requireUser, isSuperAdmin, db, HttpError } from '../_lib/firebaseAdmin.js';

const ALLOWED_ROLES = [
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
    videoUrl: rawUrl = '',
    thumbnailUrl: rawThumb = '',
    shortDescription = '',
    keyCues = []
  } = req.body || {};

  const title = String(rawTitle || '').trim();
  if (!title) throw new HttpError(400, 'Video title is required.');

  // Strict integer rule: tokenCost must be a positive integer
  const tokenCost = Math.max(1, Math.round(Number(rawCost) || 1));

  const videoUrl = String(rawUrl || '').trim();
  // Extract YouTube ID if applicable
  let youtubeId = '';
  const ytMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch) {
    youtubeId = ytMatch[1];
  }

  const id = youtubeId || `vid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const thumbnailUrl = rawThumb || (youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : '');
  const embedUrl = youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : videoUrl;
  const authorName = caller.name || caller.email.split('@')[0] || 'Coach';
  const now = new Date().toISOString();

  const videoDoc = {
    id,
    youtubeId,
    youtubeUrl: videoUrl,
    embedUrl,
    title,
    rawTitle: title,
    author: `${authorName} (${callerRole.replace('_', ' ')})`,
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
