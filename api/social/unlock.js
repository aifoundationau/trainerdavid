// POST /api/social/unlock  { postId }
// Unlocks an Instagram or Facebook post for 1 token.
// SuperAdmin master rule: Superadmin can do everything on this website without tokens.
import { handler, requireUser, isSuperAdmin, db, HttpError } from '../_lib/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';
import { INITIAL_SOCIAL_POSTS } from '../../src/data/socialPosts.js';

const SUPERADMIN_UID = 'ZK79FRQoVlYhsgvMibhi81dRUWj2';
const PARTITION_KEY = { tag: 'pt', businessId: 'pt', businessName: 'Trainer David', source: 'pt' };

export default handler(async (req) => {
  const viewer = await requireUser(req);
  const { postId: rawPostId } = req.body || {};
  const postId = String(rawPostId || '').trim();
  if (!postId) throw new HttpError(400, 'Missing postId.');

  const now = new Date().toISOString();
  const unlockKey = `${viewer.uid}_${postId}`;
  const unlockRef = db.collection('social_unlocks').doc(unlockKey);

  const viewerIsSuperAdmin = isSuperAdmin(viewer) || viewer.uid === SUPERADMIN_UID;

  // SuperAdmin master rule: 0 tokens spent
  if (viewerIsSuperAdmin) {
    await unlockRef.set({
      uid: viewer.uid,
      postId,
      unlockedAt: now,
      accessType: 'superadmin_master',
      tokenCost: 0
    });
    return {
      status: 'unlocked',
      postId,
      tokenCost: 0,
      balance: 9999,
      accessType: 'superadmin_master',
      message: 'Unlocked with SuperAdmin master access (0 tokens spent).'
    };
  }

  // Check if already unlocked
  const existingSnap = await unlockRef.get();
  if (existingSnap.exists) {
    const viewerSnap = await db.collection('users').doc(viewer.uid).get();
    const balance = viewerSnap.get('token_balance') ?? viewerSnap.get('fitTokens') ?? 0;
    return {
      status: 'already-unlocked',
      postId,
      balance: Math.trunc(balance),
      accessType: 'lifetime',
      message: 'You already unlocked this post.'
    };
  }

  // Find post details to credit creator
  let creatorUid = SUPERADMIN_UID;
  let postTitle = 'Social Post';

  let tokenCost = 1;
  const postSnap = await db.collection('social_posts').doc(postId).get();
  if (postSnap.exists) {
    const pdata = postSnap.data();
    creatorUid = pdata.creatorUid || SUPERADMIN_UID;
    postTitle = pdata.title || postTitle;
    tokenCost = Math.max(0, Math.round(Number(pdata.tokenCost !== undefined ? pdata.tokenCost : 1)));
  } else {
    const seed = INITIAL_SOCIAL_POSTS.find(p => p.id === postId);
    if (seed) {
      creatorUid = seed.creatorUid || SUPERADMIN_UID;
      postTitle = seed.title || postTitle;
      tokenCost = Math.max(0, Math.round(Number(seed.tokenCost !== undefined ? seed.tokenCost : 1)));
    }
  }

  // Free post invariant: If creator chose 0 tokens, post is free to view!
  if (tokenCost === 0) {
    await unlockRef.set({
      uid: viewer.uid,
      postId,
      creatorUid,
      unlockedAt: now,
      accessType: 'free_view',
      tokenCost: 0
    });
    const viewerSnap = await db.collection('users').doc(viewer.uid).get();
    const balance = viewerSnap.get('token_balance') ?? viewerSnap.get('fitTokens') ?? 0;
    return {
      status: 'unlocked',
      postId,
      tokenCost: 0,
      balance: Math.trunc(balance),
      accessType: 'free_view',
      message: 'Unlocked for free (0 tokens spent).'
    };
  }

  // Run atomic transaction to deduct 1 token and credit creator
  return await db.runTransaction(async (tx) => {
    const viewerRef = db.collection('users').doc(viewer.uid);
    const viewerSnap = await tx.get(viewerRef);
    if (!viewerSnap.exists) throw new HttpError(404, 'Member profile not found.');

    const currentBal = Math.trunc(viewerSnap.get('token_balance') ?? viewerSnap.get('fitTokens') ?? 0);
    if (currentBal < tokenCost) {
      throw new HttpError(400, `Not enough tokens to view this post (requires 1 token, you have ${currentBal}).`);
    }

    const nextViewerBal = currentBal - tokenCost;

    // Read creator profile if creator is a third party
    let nextCreatorBal = null;
    let creatorRef = null;
    if (creatorUid && creatorUid !== viewer.uid) {
      creatorRef = db.collection('users').doc(creatorUid);
      const creatorSnap = await tx.get(creatorRef);
      if (creatorSnap.exists) {
        const creatorBal = Math.trunc(creatorSnap.get('token_balance') ?? creatorSnap.get('fitTokens') ?? 0);
        nextCreatorBal = creatorBal + tokenCost;
      }
    }

    // Update viewer balance
    tx.update(viewerRef, {
      token_balance: nextViewerBal,
      fitTokens: nextViewerBal,
      updatedAt: now
    });

    // Write unlock document
    tx.set(unlockRef, {
      uid: viewer.uid,
      postId,
      unlockedAt: now,
      tokenCost,
      accessType: 'standard_purchase'
    });

    // Record spend in token ledger
    const ledgerSpendRef = db.collection('token_ledger').doc(`spend_soc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
    tx.set(ledgerSpendRef, {
      ...PARTITION_KEY,
      uid: viewer.uid,
      delta: -tokenCost,
      balanceAfter: nextViewerBal,
      kind: 'spend',
      reason: 'social_post_unlock',
      postId,
      postTitle,
      creatorUid,
      createdAt: now,
      at: FieldValue.serverTimestamp()
    });

    // Credit creator if profile exists
    if (creatorRef && nextCreatorBal !== null) {
      tx.update(creatorRef, {
        token_balance: nextCreatorBal,
        fitTokens: nextCreatorBal,
        updatedAt: now
      });

      const ledgerEarnRef = db.collection('token_ledger').doc(`earn_soc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
      tx.set(ledgerEarnRef, {
        ...PARTITION_KEY,
        uid: creatorUid,
        delta: tokenCost,
        balanceAfter: nextCreatorBal,
        kind: 'creator_earning',
        reason: 'social_post_sale',
        postId,
        postTitle,
        buyerUid: viewer.uid,
        createdAt: now,
        at: FieldValue.serverTimestamp()
      });
    }

    return {
      status: 'unlocked',
      postId,
      tokenCost,
      balance: nextViewerBal,
      accessType: 'standard_purchase',
      message: 'Postcard unlocked for 1 token!'
    };
  });
});
