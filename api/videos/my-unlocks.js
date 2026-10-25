// POST or GET /api/videos/my-unlocks
// Returns all video IDs the authenticated user has unlocked for lifetime access.
import { handler, requireUser, db } from '../_lib/firebaseAdmin.js';

export default handler(async (req) => {
  const caller = await requireUser(req);

  // 1. Check user document for unlocked_videos array
  const userSnap = await db.collection('users').doc(caller.uid).get();
  const profileUnlocks = (userSnap.exists && Array.isArray(userSnap.get('unlocked_videos')))
    ? userSnap.get('unlocked_videos')
    : [];

  // 2. Query video_unlocks collection for any unlocks recorded under viewerUid
  let queriedUnlocks = [];
  try {
    const unlockSnap = await db.collection('video_unlocks')
      .where('viewerUid', '==', caller.uid)
      .get();
    queriedUnlocks = unlockSnap.docs.map(doc => doc.get('videoId')).filter(Boolean);
  } catch (err) {
    console.warn('Could not query video_unlocks collection:', err.message);
  }

  // Deduplicate video IDs
  const allUnlockedIds = Array.from(new Set([...profileUnlocks, ...queriedUnlocks]));

  return {
    success: true,
    unlockedVideoIds: allUnlockedIds,
    accessType: 'lifetime',
    totalPurchased: allUnlockedIds.length
  };
});
