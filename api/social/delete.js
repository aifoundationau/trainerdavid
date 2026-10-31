// POST /api/social/delete  { postId }
// Deletes a social post. Only the post creator or SuperAdmin is authorized.
import { handler, requireUser, isSuperAdmin, db, HttpError } from '../_lib/firebaseAdmin.js';

const SUPERADMIN_UID = 'ZK79FRQoVlYhsgvMibhi81dRUWj2';

export default handler(async (req) => {
  const caller = await requireUser(req);
  const { postId: rawPostId } = req.body || {};
  const postId = String(rawPostId || '').trim();
  if (!postId) throw new HttpError(400, 'Missing postId.');

  const postRef = db.collection('social_posts').doc(postId);
  const postSnap = await postRef.get();
  if (!postSnap.exists) throw new HttpError(404, 'Post not found.');

  const pdata = postSnap.data();
  const callerIsSuperAdmin = isSuperAdmin(caller) || caller.uid === SUPERADMIN_UID;
  if (!callerIsSuperAdmin && pdata.creatorUid !== caller.uid) {
    throw new HttpError(403, 'Permission denied: You can only delete your own posts.');
  }

  await postRef.delete();

  return {
    success: true,
    deletedId: postId,
    message: 'Social post was successfully deleted.'
  };
});

