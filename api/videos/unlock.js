// POST /api/videos/unlock  { videoId }
// Unlocks a video for the viewer and executes the 50/50 Token Revenue Split:
// - Viewer pays the video's custom tokenCost (strict integers, e.g. 1 token, 5 tokens)
// - Trainer receives 50% of the sale price
// - SuperAdmin receives 50% of the sale price
// - Atomically records transactions in Firestore users and token_ledger
import { handler, requireUser, isSuperAdmin, db, HttpError } from '../_lib/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';

const SUPERADMIN_UID = 'ZK79FRQoVlYhsgvMibhi81dRUWj2';
const PARTITION_KEY = { tag: 'pt', businessId: 'pt', businessName: 'Trainer David', source: 'pt' };

export default handler(async (req) => {
  const viewer = await requireUser(req);
  const { videoId: rawVideoId } = req.body || {};
  const videoId = String(rawVideoId || '').trim();
  if (!videoId) throw new HttpError(400, 'Missing videoId.');

  const now = new Date().toISOString();
  const unlockKey = `${viewer.uid}_${videoId}`;
  const unlockRef = db.collection('video_unlocks').doc(unlockKey);

  // SuperAdmin master rule: Superadmin can do everything on this website without tokens
  const viewerIsSuperAdmin = isSuperAdmin(viewer) || viewer.uid === SUPERADMIN_UID;
  if (viewerIsSuperAdmin) {
    await unlockRef.set({
      uid: viewer.uid,
      videoId,
      unlockedAt: now,
      accessType: 'superadmin_master',
      tokenCost: 0
    });
    await db.collection('users').doc(viewer.uid).update({
      unlocked_videos: FieldValue.arrayUnion(videoId),
      updatedAt: now
    });
    return {
      status: 'unlocked',
      videoId,
      tokenCost: 0,
      balance: 9999,
      accessType: 'superadmin_master',
      lifetimeAccess: true,
      message: 'Unlocked with SuperAdmin master access (0 tokens spent).'
    };
  }

  // 1. Check if video has already been unlocked by this viewer
  const existingUnlock = await unlockRef.get();
  if (existingUnlock.exists) {
    const viewerSnap = await db.collection('users').doc(viewer.uid).get();
    const balance = viewerSnap.get('token_balance') ?? viewerSnap.get('fitTokens') ?? 0;
    return {
      status: 'already-unlocked',
      videoId,
      balance: Math.trunc(balance),
      accessType: 'lifetime',
      lifetimeAccess: true,
      message: 'You already own lifetime access to this video.'
    };
  }

  // 2. Fetch video details to determine tokenCost and creatorUid
  let tokenCost = 1;
  let creatorUid = null;
  let videoTitle = 'Workout Masterclass';

  const videoSnap = await db.collection('pt_videos').doc(videoId).get();
  if (videoSnap.exists) {
    const vdata = videoSnap.data();
    tokenCost = Math.max(0, Math.round(Number(vdata.tokenCost !== undefined ? vdata.tokenCost : 1)));
    creatorUid = vdata.creatorUid || null;
    videoTitle = vdata.title || videoTitle;
  }

  // Free video invariant: If creator chose 0 tokens, video is completely free to view
  if (tokenCost === 0) {
    await unlockRef.set({
      uid: viewer.uid,
      videoId,
      creatorUid,
      unlockedAt: now,
      accessType: 'free_view',
      tokenCost: 0
    });
    await db.collection('users').doc(viewer.uid).update({
      unlocked_videos: FieldValue.arrayUnion(videoId),
      updatedAt: now
    });
    const viewerSnap = await db.collection('users').doc(viewer.uid).get();
    const balance = viewerSnap.get('token_balance') ?? viewerSnap.get('fitTokens') ?? 0;
    return {
      status: 'unlocked',
      videoId,
      tokenCost: 0,
      balance: Math.trunc(balance),
      accessType: 'free_view',
      lifetimeAccess: true,
      message: 'Unlocked for free (0 tokens spent).'
    };
  }

  // Run atomic Firestore transaction for 50/50 token split
  return await db.runTransaction(async (tx) => {
    // Read viewer profile
    const viewerRef = db.collection('users').doc(viewer.uid);
    const viewerSnap = await tx.get(viewerRef);
    if (!viewerSnap.exists) throw new HttpError(404, 'Member profile not found.');

    const currentBalanceRaw = viewerSnap.get('token_balance') ?? viewerSnap.get('fitTokens') ?? 0;
    const currentBalance = Number.isFinite(currentBalanceRaw) ? Math.trunc(currentBalanceRaw) : 0;

    if (currentBalance < tokenCost) {
      throw new HttpError(400, `Not enough tokens. You have ${currentBalance} token${currentBalance === 1 ? '' : 's'}, but "${videoTitle}" costs ${tokenCost} token${tokenCost === 1 ? '' : 's'}.`);
    }

    const nextViewerBalance = currentBalance - tokenCost;

    // Calculate 50/50 revenue split (Strict integers only, zero decimals)
    let trainerShare = 0;
    let platformShare = tokenCost;

    const hasThirdPartyTrainer = creatorUid && creatorUid !== viewer.uid && creatorUid !== SUPERADMIN_UID;
    if (hasThirdPartyTrainer) {
      trainerShare = Math.round(tokenCost * 0.5);
      platformShare = tokenCost - trainerShare;
    }

    // Read creator profile if applicable
    let creatorSnap = null;
    let creatorRef = null;
    if (trainerShare > 0) {
      creatorRef = db.collection('users').doc(creatorUid);
      creatorSnap = await tx.get(creatorRef);
    }

    // Read SuperAdmin profile if applicable
    const superAdminRef = db.collection('users').doc(SUPERADMIN_UID);
    const superAdminSnap = await tx.get(superAdminRef);

    // Apply viewer deduction and record unlocked video in user profile
    tx.update(viewerRef, {
      token_balance: nextViewerBalance,
      fitTokens: nextViewerBalance,
      unlocked_videos: FieldValue.arrayUnion(videoId),
      updatedAt: now
    });

    // Write viewer spend ledger entry
    const viewerLedgerRef = db.collection('token_ledger').doc(`spend_video_${unlockKey}_${Date.now()}`);
    tx.set(viewerLedgerRef, {
      ...PARTITION_KEY,
      uid: viewer.uid,
      delta: -tokenCost,
      balanceAfter: nextViewerBalance,
      kind: 'spend',
      reason: 'video_unlock',
      videoId,
      videoTitle,
      createdAt: now,
      at: FieldValue.serverTimestamp()
    });

    // Apply trainer 50% credit if applicable
    if (trainerShare > 0 && creatorSnap && creatorSnap.exists) {
      const creatorBalRaw = creatorSnap.get('token_balance') ?? creatorSnap.get('fitTokens') ?? 0;
      const creatorBal = Number.isFinite(creatorBalRaw) ? Math.trunc(creatorBalRaw) : 0;
      const nextCreatorBal = creatorBal + trainerShare;

      tx.update(creatorRef, {
        token_balance: nextCreatorBal,
        fitTokens: nextCreatorBal,
        updatedAt: now
      });

      const trainerLedgerRef = db.collection('token_ledger').doc(`credit_trainer_${unlockKey}_${Date.now()}`);
      tx.set(trainerLedgerRef, {
        ...PARTITION_KEY,
        uid: creatorUid,
        delta: trainerShare,
        balanceAfter: nextCreatorBal,
        kind: 'revenue_split',
        shareType: 'trainer_50',
        videoId,
        videoTitle,
        viewerUid: viewer.uid,
        viewerEmail: viewer.email || '',
        description: `50% Trainer share: "${videoTitle}" watched by ${viewer.email}`,
        createdAt: now,
        at: FieldValue.serverTimestamp()
      });
    }

    // Apply SuperAdmin 50% credit if applicable
    if (platformShare > 0 && superAdminSnap.exists) {
      const saBalRaw = superAdminSnap.get('token_balance') ?? superAdminSnap.get('fitTokens') ?? 0;
      const saBal = Number.isFinite(saBalRaw) ? Math.trunc(saBalRaw) : 0;
      const nextSaBal = saBal + platformShare;

      tx.update(superAdminRef, {
        token_balance: nextSaBal,
        fitTokens: nextSaBal,
        updatedAt: now
      });

      const saLedgerRef = db.collection('token_ledger').doc(`credit_platform_${unlockKey}_${Date.now()}`);
      tx.set(saLedgerRef, {
        ...PARTITION_KEY,
        uid: SUPERADMIN_UID,
        delta: platformShare,
        balanceAfter: nextSaBal,
        kind: 'revenue_split',
        shareType: 'platform_50',
        videoId,
        videoTitle,
        viewerUid: viewer.uid,
        viewerEmail: viewer.email || '',
        description: `50% Platform share: "${videoTitle}" watched by ${viewer.email}`,
        createdAt: now,
        at: FieldValue.serverTimestamp()
      });
    }

    // Record permanent lifetime unlock
    tx.set(unlockRef, {
      viewerUid: viewer.uid,
      viewerEmail: viewer.email || '',
      videoId,
      videoTitle,
      tokenCost,
      trainerShare,
      platformShare,
      creatorUid,
      accessType: 'lifetime',
      lifetimeAccess: true,
      unlockedAt: now
    });

    return {
      status: 'unlocked',
      videoId,
      videoTitle,
      tokenCost,
      trainerShare,
      platformShare,
      accessType: 'lifetime',
      lifetimeAccess: true,
      balance: nextViewerBalance,
      message: `Unlocked "${videoTitle}" for life! Spent ${tokenCost} tokens. (${trainerShare} to coach, ${platformShare} platform fee)`
    };
  });
});
