// POST /api/messages/send  { recipientUid, message, videoId?, postId? }
// Allows members to message each other once payment has been made.
// Rules:
// - People who buy videos/posts can message the creator for 1 token.
// - Creators and buyers can message each other once payment has been made.
// - The superadmin can message anyone at any time without tokens (0 tokens).
import { handler, requireUser, isSuperAdmin, db, HttpError } from '../_lib/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';

const SUPERADMIN_UID = 'ZK79FRQoVlYhsgvMibhi81dRUWj2';
const PARTITION_KEY = { tag: 'pt', businessId: 'pt', businessName: 'Trainer David', source: 'pt' };

export default handler(async (req) => {
  const sender = await requireUser(req);
  const { 
    recipientUid: rawRecipientUid, 
    message: rawMessage,
    videoId: rawVideoId,
    videoTitle: rawVideoTitle,
    postId: rawPostId,
    postTitle: rawPostTitle
  } = req.body || {};

  const recipientUid = String(rawRecipientUid || '').trim();
  if (!recipientUid) throw new HttpError(400, 'Missing recipient.');
  if (recipientUid === sender.uid) throw new HttpError(400, 'You cannot message yourself.');

  const message = String(rawMessage || '').trim();
  if (!message) throw new HttpError(400, 'Please enter a message.');
  if (message.length > 2000) throw new HttpError(400, 'Message is too long (maximum 2,000 characters).');

  const callerIsSuperAdmin = isSuperAdmin(sender) || sender.uid === SUPERADMIN_UID;
  const recipientIsSuperAdmin = recipientUid === SUPERADMIN_UID;
  const now = new Date().toISOString();

  // 1. If not SuperAdmin, verify that payment has been made between sender and recipient
  if (!callerIsSuperAdmin && !recipientIsSuperAdmin) {
    let paymentMade = false;

    // Check if sender unlocked any video created by recipient
    const senderVideoUnlock = await db.collection('video_unlocks')
      .where('uid', '==', sender.uid)
      .where('creatorUid', '==', recipientUid)
      .limit(1)
      .get()
      .catch(() => ({ empty: true }));
    if (!senderVideoUnlock.empty) paymentMade = true;

    // Check if recipient unlocked any video created by sender
    if (!paymentMade) {
      const recipientVideoUnlock = await db.collection('video_unlocks')
        .where('uid', '==', recipientUid)
        .where('creatorUid', '==', sender.uid)
        .limit(1)
        .get()
        .catch(() => ({ empty: true }));
      if (!recipientVideoUnlock.empty) paymentMade = true;
    }

    // Check if sender unlocked any social post created by recipient
    if (!paymentMade) {
      const senderSocialUnlock = await db.collection('social_unlocks')
        .where('uid', '==', sender.uid)
        .where('creatorUid', '==', recipientUid)
        .limit(1)
        .get()
        .catch(() => ({ empty: true }));
      if (!senderSocialUnlock.empty) paymentMade = true;
    }

    // Check if recipient unlocked any social post created by sender
    if (!paymentMade) {
      const recipientSocialUnlock = await db.collection('social_unlocks')
        .where('uid', '==', recipientUid)
        .where('creatorUid', '==', sender.uid)
        .limit(1)
        .get()
        .catch(() => ({ empty: true }));
      if (!recipientSocialUnlock.empty) paymentMade = true;
    }

    // Also check if a videoId or postId was directly unlocked
    if (!paymentMade && rawVideoId) {
      const vKey = `${sender.uid}_${String(rawVideoId).trim()}`;
      const vSnap = await db.collection('video_unlocks').doc(vKey).get();
      if (vSnap.exists) paymentMade = true;
    }
    if (!paymentMade && rawPostId) {
      const pKey = `${sender.uid}_${String(rawPostId).trim()}`;
      const pSnap = await db.collection('social_unlocks').doc(pKey).get();
      if (pSnap.exists) paymentMade = true;
    }

    if (!paymentMade) {
      throw new HttpError(403, 'You can only message members once payment has been made (e.g. unlocking a workout video or social post).');
    }
  }

  // 2. Fetch recipient profile details for metadata
  let recipientEmail = recipientIsSuperAdmin ? 'support@aifoundation.net.au' : '';
  let recipientName = recipientIsSuperAdmin ? 'Trainer David (Head Coach)' : 'Member';
  const recipientSnap = await db.collection('users').doc(recipientUid).get().catch(() => null);
  if (recipientSnap && recipientSnap.exists) {
    recipientEmail = recipientSnap.get('email') || recipientEmail;
    recipientName = recipientSnap.get('displayName') || recipientSnap.get('name') || recipientSnap.get('email')?.split('@')[0] || recipientName;
  }

  const senderName = sender.name || sender.email?.split('@')[0] || (callerIsSuperAdmin ? 'SuperAdmin' : 'Member');
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const messageDocRef = db.collection('creator_messages').doc(msgId);

  // 3. SuperAdmin master rule: 0 tokens spent
  if (callerIsSuperAdmin) {
    await messageDocRef.set({
      id: msgId,
      senderUid: sender.uid,
      senderEmail: sender.email || '',
      senderName,
      creatorUid: recipientUid,
      creatorEmail: recipientEmail,
      creatorName: recipientName,
      message,
      tokenCost: 0,
      videoId: rawVideoId || null,
      videoTitle: rawVideoTitle || null,
      postId: rawPostId || null,
      postTitle: rawPostTitle || null,
      read: false,
      createdAt: now,
      at: FieldValue.serverTimestamp()
    });

    return {
      success: true,
      messageId: msgId,
      balance: 9999,
      isSuperAdmin: true,
      message: 'Message delivered (SuperAdmin master access, 0 tokens spent).'
    };
  }

  // 4. Resolve creator-chosen message token cost:
  // - Priority 1: Per-item message rate (if videoId or postId provided)
  // - Priority 2: Recipient's creator profile rate (messageTokenCost)
  // - Fallback: 1 token
  let tokenCost = 1;

  if (rawVideoId) {
    try {
      const vSnap = await db.collection('pt_videos').doc(String(rawVideoId).trim()).get();
      if (vSnap.exists && vSnap.get('messageTokenCost') !== undefined) {
        tokenCost = Math.max(0, Math.round(Number(vSnap.get('messageTokenCost')) || 0));
      }
    } catch (_) {}
  } else if (rawPostId) {
    try {
      const pSnap = await db.collection('social_posts').doc(String(rawPostId).trim()).get();
      if (pSnap.exists && pSnap.get('messageTokenCost') !== undefined) {
        tokenCost = Math.max(0, Math.round(Number(pSnap.get('messageTokenCost')) || 0));
      }
    } catch (_) {}
  }

  if (tokenCost === 1 && recipientSnap && recipientSnap.exists && recipientSnap.get('messageTokenCost') !== undefined) {
    tokenCost = Math.max(0, Math.round(Number(recipientSnap.get('messageTokenCost')) || 0));
  }

  // Free messaging invariant: If creator chose 0 tokens, message is completely free
  if (tokenCost === 0) {
    await messageDocRef.set({
      id: msgId,
      senderUid: sender.uid,
      senderEmail: sender.email || '',
      senderName,
      creatorUid: recipientUid,
      creatorEmail: recipientEmail,
      creatorName: recipientName,
      message,
      tokenCost: 0,
      videoId: rawVideoId || null,
      videoTitle: rawVideoTitle || null,
      postId: rawPostId || null,
      postTitle: rawPostTitle || null,
      read: false,
      createdAt: now,
      at: FieldValue.serverTimestamp()
    });

    const senderSnap = await db.collection('users').doc(sender.uid).get();
    const bal = senderSnap.exists ? Math.trunc(senderSnap.get('token_balance') ?? senderSnap.get('fitTokens') ?? 0) : 0;
    return {
      success: true,
      messageId: msgId,
      balance: bal,
      tokenCost: 0,
      recipientName,
      message: 'Message delivered for free (creator offers 0 token messaging).'
    };
  }

  return await db.runTransaction(async (tx) => {
    const senderRef = db.collection('users').doc(sender.uid);
    const senderSnap = await tx.get(senderRef);
    if (!senderSnap.exists) throw new HttpError(404, 'Sender profile not found.');

    const currentSenderBal = Math.trunc(senderSnap.get('token_balance') ?? senderSnap.get('fitTokens') ?? 0);
    if (currentSenderBal < tokenCost) {
      throw new HttpError(400, `Not enough tokens to message member (requires ${tokenCost} ${tokenCost === 1 ? 'token' : 'tokens'}, you have ${currentSenderBal}).`);
    }

    const nextSenderBal = currentSenderBal - tokenCost;

    // Check recipient profile for token credit
    const recipientRef = db.collection('users').doc(recipientUid);
    const recSnap = await tx.get(recipientRef);
    const currentRecBal = recSnap.exists ? Math.trunc(recSnap.get('token_balance') ?? recSnap.get('fitTokens') ?? 0) : 0;
    const nextRecBal = currentRecBal + tokenCost;

    // Deduct 1 token from sender
    tx.update(senderRef, {
      token_balance: nextSenderBal,
      fitTokens: nextSenderBal,
      updatedAt: now
    });

    // Credit 1 token to recipient (if not recipient's mock or superadmin)
    if (recSnap.exists) {
      tx.update(recipientRef, {
        token_balance: nextRecBal,
        fitTokens: nextRecBal,
        updatedAt: now
      });
    }

    // Ledger for sender
    const senderLedgerRef = db.collection('token_ledger').doc(`msg_out_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
    tx.set(senderLedgerRef, {
      ...PARTITION_KEY,
      uid: sender.uid,
      delta: -tokenCost,
      balanceAfter: nextSenderBal,
      kind: 'spend',
      reason: 'message_fee',
      recipientUid,
      recipientName,
      createdAt: now,
      at: FieldValue.serverTimestamp()
    });

    // Ledger for recipient
    const recLedgerRef = db.collection('token_ledger').doc(`msg_in_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
    tx.set(recLedgerRef, {
      ...PARTITION_KEY,
      uid: recipientUid,
      delta: tokenCost,
      balanceAfter: nextRecBal,
      kind: 'revenue',
      reason: 'message_received',
      senderUid: sender.uid,
      senderName,
      createdAt: now,
      at: FieldValue.serverTimestamp()
    });

    // Save message record
    tx.set(messageDocRef, {
      id: msgId,
      senderUid: sender.uid,
      senderEmail: sender.email || '',
      senderName,
      creatorUid: recipientUid,
      creatorEmail: recipientEmail,
      creatorName: recipientName,
      message,
      tokenCost,
      videoId: rawVideoId || null,
      videoTitle: rawVideoTitle || null,
      postId: rawPostId || null,
      postTitle: rawPostTitle || null,
      read: false,
      createdAt: now,
      at: FieldValue.serverTimestamp()
    });

    return {
      success: true,
      messageId: msgId,
      balance: nextSenderBal,
      recipientName,
      message: 'Message delivered (1 token transferred).'
    };
  });
});

