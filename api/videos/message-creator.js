// POST /api/videos/message-creator  { videoId, message }
// Allows members who unlocked/bought a video to message the creator for 1 token.
// SuperAdmin rule: Superadmin can do everything on this website without tokens.
import { handler, requireUser, isSuperAdmin, db, HttpError } from '../_lib/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';

const PARTITION_KEY = { tag: 'pt', businessId: 'pt', businessName: 'Trainer David', source: 'pt' };
const SUPERADMIN_UID = 'ZK79FRQoVlYhsgvMibhi81dRUWj2';

export default handler(async (req) => {
  const sender = await requireUser(req);
  const { videoId: rawVideoId, message: rawMessage } = req.body || {};
  
  const videoId = String(rawVideoId || '').trim();
  if (!videoId) throw new HttpError(400, 'Missing videoId.');

  const message = String(rawMessage || '').trim();
  if (!message) throw new HttpError(400, 'Please enter a message for the creator.');
  if (message.length > 2000) throw new HttpError(400, 'Message is too long (maximum 2,000 characters).');

  const now = new Date().toISOString();
  const unlockKey = `${sender.uid}_${videoId}`;
  const unlockRef = db.collection('video_unlocks').doc(unlockKey);

  const callerIsSuperAdmin = isSuperAdmin(sender) || sender.uid === SUPERADMIN_UID;

  // 1. Verify that sender has purchased/unlocked this video (SuperAdmin is exempt)
  if (!callerIsSuperAdmin) {
    const unlockSnap = await unlockRef.get();
    let isUnlocked = unlockSnap.exists;
    if (!isUnlocked) {
      const senderSnapCheck = await db.collection('users').doc(sender.uid).get();
      const unlockedVideos = senderSnapCheck.get('unlocked_videos') || [];
      isUnlocked = unlockedVideos.includes(videoId);
    }
    if (!isUnlocked) {
      throw new HttpError(403, 'You must unlock this video before you can message the creator.');
    }
  }

  // 2. Fetch video details to locate the creator
  const videoSnap = await db.collection('pt_videos').doc(videoId).get();
  const videoData = videoSnap.exists ? videoSnap.data() : {};
  const creatorUid = videoData.creatorUid || SUPERADMIN_UID;
  const creatorEmail = videoData.creatorEmail || 'support@aifoundation.net.au';
  const videoTitle = videoData.title || 'Workout Video';

  // Prevent messaging self
  if (creatorUid === sender.uid) {
    throw new HttpError(400, 'You are the creator of this video.');
  }

  // SuperAdmin master rule: superadmin can do everything on this website without tokens
  if (callerIsSuperAdmin) {
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const messageDocRef = db.collection('creator_messages').doc(msgId);
    await messageDocRef.set({
      id: msgId,
      videoId,
      videoTitle,
      senderUid: sender.uid,
      senderEmail: sender.email || '',
      senderName: sender.name || sender.email?.split('@')[0] || 'SuperAdmin',
      creatorUid,
      creatorEmail,
      message,
      tokenCost: 0,
      read: false,
      createdAt: now,
      at: FieldValue.serverTimestamp()
    });
    return {
      success: true,
      balance: 9999,
      messageId: msgId,
      message: 'Message delivered to creator (SuperAdmin master access, 0 tokens spent).'
    };
  }

  // Determine creator-chosen message token cost
  let tokenCost = videoData.messageTokenCost !== undefined 
    ? Math.max(0, Math.round(Number(videoData.messageTokenCost) || 0)) 
    : 1;

  if (videoData.messageTokenCost === undefined && creatorUid) {
    try {
      const cSnap = await db.collection('users').doc(creatorUid).get();
      if (cSnap.exists && cSnap.get('messageTokenCost') !== undefined) {
        tokenCost = Math.max(0, Math.round(Number(cSnap.get('messageTokenCost')) || 0));
      }
    } catch (_) {}
  }

  // Free messaging invariant: If creator chose 0 tokens, message is free
  if (tokenCost === 0) {
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const messageDocRef = db.collection('creator_messages').doc(msgId);
    await messageDocRef.set({
      id: msgId,
      videoId,
      videoTitle,
      senderUid: sender.uid,
      senderEmail: sender.email || '',
      senderName: sender.name || sender.email?.split('@')[0] || 'Member',
      creatorUid,
      creatorEmail,
      message,
      tokenCost: 0,
      read: false,
      createdAt: now,
      at: FieldValue.serverTimestamp()
    });

    const senderSnap = await db.collection('users').doc(sender.uid).get();
    const bal = senderSnap.exists ? Math.trunc(senderSnap.get('token_balance') ?? senderSnap.get('fitTokens') ?? 0) : 0;
    return {
      success: true,
      balance: bal,
      messageId: msgId,
      tokenCost: 0,
      message: 'Message delivered to creator for free (0 tokens spent).'
    };
  }

  // Run atomic transaction:
  // - Deduct tokenCost from sender
  // - Credit tokenCost to creator
  // - Write token_ledger entries
  // - Store message in creator_messages
  return await db.runTransaction(async (tx) => {
    const senderRef = db.collection('users').doc(sender.uid);
    const senderSnap = await tx.get(senderRef);
    if (!senderSnap.exists) throw new HttpError(404, 'Sender profile not found.');

    const currentSenderBal = Math.trunc(senderSnap.get('token_balance') ?? senderSnap.get('fitTokens') ?? 0);
    if (currentSenderBal < tokenCost) {
      throw new HttpError(400, `Not enough tokens to message creator (requires ${tokenCost} ${tokenCost === 1 ? 'token' : 'tokens'}, you have ${currentSenderBal}).`);
    }

    const nextSenderBal = currentSenderBal - tokenCost;

    // Read creator profile
    const creatorRef = db.collection('users').doc(creatorUid);
    const creatorSnap = await tx.get(creatorRef);
    let nextCreatorBal = null;
    if (creatorSnap.exists) {
      const creatorBal = Math.trunc(creatorSnap.get('token_balance') ?? creatorSnap.get('fitTokens') ?? 0);
      nextCreatorBal = creatorBal + tokenCost;
    }

    // Update sender balance
    tx.update(senderRef, {
      token_balance: nextSenderBal,
      fitTokens: nextSenderBal,
      updatedAt: now
    });

    // Write sender ledger spend
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const senderLedgerRef = db.collection('token_ledger').doc(`spend_msg_${msgId}`);
    tx.set(senderLedgerRef, {
      ...PARTITION_KEY,
      uid: sender.uid,
      delta: -tokenCost,
      balanceAfter: nextSenderBal,
      kind: 'spend',
      reason: 'creator_message',
      videoId,
      videoTitle,
      creatorUid,
      createdAt: now,
      at: FieldValue.serverTimestamp()
    });

    // Update creator balance and ledger if creator profile exists
    if (creatorSnap.exists && nextCreatorBal !== null) {
      tx.update(creatorRef, {
        token_balance: nextCreatorBal,
        fitTokens: nextCreatorBal,
        updatedAt: now
      });

      const creatorLedgerRef = db.collection('token_ledger').doc(`earn_msg_${msgId}`);
      tx.set(creatorLedgerRef, {
        ...PARTITION_KEY,
        uid: creatorUid,
        delta: tokenCost,
        balanceAfter: nextCreatorBal,
        kind: 'creator_earning',
        reason: 'message_fee',
        videoId,
        videoTitle,
        senderUid: sender.uid,
        senderEmail: sender.email || '',
        createdAt: now,
        at: FieldValue.serverTimestamp()
      });
    }

    // Save message record in creator_messages
    const messageDocRef = db.collection('creator_messages').doc(msgId);
    tx.set(messageDocRef, {
      id: msgId,
      videoId,
      videoTitle,
      senderUid: sender.uid,
      senderEmail: sender.email || '',
      senderName: sender.name || sender.email?.split('@')[0] || 'Member',
      creatorUid,
      creatorEmail,
      message,
      tokenCost,
      read: false,
      createdAt: now,
      at: FieldValue.serverTimestamp()
    });

    return {
      success: true,
      balance: nextSenderBal,
      messageId: msgId,
      message: `Message sent to creator! 1 token deducted (new balance: ${nextSenderBal}).`
    };
  });
});
