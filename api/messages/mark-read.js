// POST /api/messages/mark-read  { messageId }
import { handler, requireUser, isSuperAdmin, db, HttpError } from '../_lib/firebaseAdmin.js';

const SUPERADMIN_UID = 'ZK79FRQoVlYhsgvMibhi81dRUWj2';

export default handler(async (req) => {
  const caller = await requireUser(req);
  const { messageId: rawMessageId } = req.body || {};
  const messageId = String(rawMessageId || '').trim();
  if (!messageId) throw new HttpError(400, 'Missing messageId.');

  const msgRef = db.collection('creator_messages').doc(messageId);
  const msgSnap = await msgRef.get();
  if (!msgSnap.exists) throw new HttpError(404, 'Message not found.');

  const data = msgSnap.data();
  const callerIsSuperAdmin = isSuperAdmin(caller) || caller.uid === SUPERADMIN_UID;
  if (!callerIsSuperAdmin && data.creatorUid !== caller.uid && data.senderUid !== caller.uid) {
    throw new HttpError(403, 'Permission denied.');
  }

  await msgRef.update({
    read: true,
    readAt: new Date().toISOString()
  });

  return { success: true, messageId };
});

