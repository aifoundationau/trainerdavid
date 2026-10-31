// POST /api/social/message-creator  { postId, message }
// Allows members who unlocked a social post to message the creator for 1 token.
// SuperAdmin rule: Superadmin can do everything on this website without tokens.
import { handler, requireUser, isSuperAdmin, db, HttpError } from '../_lib/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';
import { INITIAL_SOCIAL_POSTS } from '../../src/data/socialPosts.js';

const SUPERADMIN_UID = 'ZK79FRQoVlYhsgvMibhi81dRUWj2';
const PARTITION_KEY = { tag: 'pt', businessId: 'pt', businessName: 'Trainer David', source: 'pt' };

export default handler(async (req) => {
  const sender = await requireUser(req);
  const { postId: rawPostId, message: rawMessage } = req.body || {};

  const postId = String(rawPostId || '').trim();
  if (!postId) throw new HttpError(400, 'Missing postId.');

  const message = String(rawMessage || '').trim();
  if (!message) throw new HttpError(400, 'Please enter a message for the creator.');
  if (message.length > 2000) throw new HttpError(400, 'Message is too long (maximum 2,000 characters).');

  const now = new Date().toISOString();
  const unlockKey = `${sender.uid}_${postId}`;
  const unlockRef = db.collection('social_unlocks').doc(unlockKey);

  const callerIsSuperAdmin = isSuperAdmin(sender) || sender.uid === SUPERADMIN_UID;

  // 1. Verify that sender has unlocked this social post (SuperAdmin is exempt)
  if (!callerIsSuperAdmin) {
    const unlockSnap = await unlockRef.get();
    if (!unlockSnap.exists) {
      throw new HttpError(403, 'You must unlock this post before you can message the creator.');
    }
  }

  // 2. Locate creator info
  let creatorUid = SUPERADMIN_UID;
  let creatorEmail = 'support@aifoundation.net.au';
  let postTitle = 'Social Post';

  const postSnap = await db.collection('social_posts').doc(postId).get();
  if (postSnap.exists) {
    const pdata = postSnap.data();
    creatorUid = pdata.creatorUid || SUPERADMIN_UID;
    creatorEmail = pdata.creatorEmail || creatorEmail;
    postTitle = pdata.title || postTitle;
  } else {
    const seed = INITIAL_SOCIAL_POSTS.find(p => p.id === postId);
    if (seed) {
      creatorUid = seed.creatorUid || SUPERADMIN_UID;
      creatorEmail = seed.creatorEmail || creatorEmail;
      postTitle = seed.title || postTitle;
    }
  }

  // Prevent messaging self
  if (creatorUid === sender.uid) {
    throw new HttpError(400, 'You are the creator of this post.');
  }

  // SuperAdmin master rule: 0 tokens spent
  if (callerIsSuperAdmin) {
    const msgId = `msg_soc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const msgRef = db.collection('creator_messages').doc(msgId);
    await msgRef.set({
      id: msgId,
      postId,
      postTitle,
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
  let tokenCost = 1;
  if (postSnap.exists && postSnap.get('messageTokenCost') !== undefined) {
    tokenCost = Math.max(0, Math.round(Number(postSnap.get('messageTokenCost')) || 0));
  } else if (creatorUid) {
    try {
      const cSnap = await db.collection('users').doc(creatorUid).get();
      if (cSnap.exists && cSnap.get('messageTokenCost') !== undefined) {
        tokenCost = Math.max(0, Math.round(Number(cSnap.get('messageTokenCost')) || 0));
      }
    } catch (_) {}
  }

  // Free messaging invariant: If creator chose 0 tokens, message is free
  if (tokenCost === 0) {
    const msgId = `msg_soc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const msgRef = db.collection('creator_messages').doc(msgId);
    await msgRef.set({
      id: msgId,
      postId,
      postTitle,
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

  // Run atomic transaction to deduct tokenCost from sender and credit creator
  return await db.runTransaction(async (tx) => {
    const senderRef = db.collection('users').doc(sender.uid);
    const senderSnap = await tx.get(senderRef);
    if (!senderSnap.exists) throw new HttpError(404, 'Sender profile not found.');

    const currentSenderBal = Math.trunc(senderSnap.get('token_balance') ?? senderSnap.get('fitTokens') ?? 0);
    if (currentSenderBal < tokenCost) {
      throw new HttpError(400, `Not enough tokens to message creator (requires ${tokenCost} ${tokenCost === 1 ? 'token' : 'tokens'}, you have ${currentSenderBal}).`);
    }

    const nextSenderBal = currentSenderBal - tokenCost;

    const creatorRef = db.collection('users').doc(creatorUid);
    const creatorSnap = await tx.get(creatorRef);
    let nextCreatorBal = null;
    if (creatorSnap.exists) {
      const creatorBal = Math.trunc(creatorSnap.get('token_balance') ?? creatorSnap.get('fitTokens') ?? 0);
      nextCreatorBal = creatorBal + tokenCost;
    }

    // Deduct 1 token from sender
    tx.update(senderRef, {
      token_balance: nextSenderBal,
      fitTokens: nextSenderBal,
      updatedAt: now
    });

    const msgId = `msg_soc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const senderLedgerRef = db.collection('token_ledger').doc(`spend_msg_soc_${msgId}`);
    tx.set(senderLedgerRef, {
      ...PARTITION_KEY,
      uid: sender.uid,
      delta: -tokenCost,
      balanceAfter: nextSenderBal,
      kind: 'spend',
      reason: 'social_creator_message',
      postId,
      postTitle,
      creatorUid,
      createdAt: now,
      at: FieldValue.serverTimestamp()
    });

    // Credit creator
    if (creatorSnap.exists && nextCreatorBal !== null) {
      tx.update(creatorRef, {
        token_balance: nextCreatorBal,
        fitTokens: nextCreatorBal,
        updatedAt: now
      });

      const creatorLedgerRef = db.collection('token_ledger').doc(`earn_msg_soc_${msgId}`);
      tx.set(creatorLedgerRef, {
        ...PARTITION_KEY,
        uid: creatorUid,
        delta: tokenCost,
        balanceAfter: nextCreatorBal,
        kind: 'creator_earning',
        reason: 'social_message_fee',
        postId,
        postTitle,
        senderUid: sender.uid,
        createdAt: now,
        at: FieldValue.serverTimestamp()
      });
    }

    // Save message
    const msgRef = db.collection('creator_messages').doc(msgId);
    tx.set(msgRef, {
      id: msgId,
      postId,
      postTitle,
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
      message: 'Question sent to creator for 1 token!'
    };
  });
});
