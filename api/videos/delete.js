// POST /api/videos/delete  { videoId }
// Deletes a published workout video. Only the video creator or SuperAdmin is authorized.
import { handler, requireUser, isSuperAdmin, db, HttpError } from '../_lib/firebaseAdmin.js';

const SUPERADMIN_UID = 'ZK79FRQoVlYhsgvMibhi81dRUWj2';

export default handler(async (req) => {
  const caller = await requireUser(req);
  const { videoId: rawVideoId } = req.body || {};
  const videoId = String(rawVideoId || '').trim();
  if (!videoId) throw new HttpError(400, 'Missing videoId.');

  const videoRef = db.collection('pt_videos').doc(videoId);
  const videoSnap = await videoRef.get();
  if (!videoSnap.exists) throw new HttpError(404, 'Video not found.');

  const vdata = videoSnap.data();
  const callerIsSuperAdmin = isSuperAdmin(caller) || caller.uid === SUPERADMIN_UID;
  if (!callerIsSuperAdmin && vdata.creatorUid !== caller.uid) {
    throw new HttpError(403, 'Permission denied: You can only delete your own videos.');
  }

  await videoRef.delete();

  return {
    success: true,
    deletedId: videoId,
    message: 'Workout video was successfully deleted.'
  };
});

