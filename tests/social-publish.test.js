// Tests for Sell & Publish Social Media Posts, Custom Token Rates (0 tokens = Free to view), and Deletion
const { test } = require('node:test');
const assert = require('node:assert/strict');

const SUPPORTED_PLATFORMS = [
  'instagram',
  'facebook',
  'tiktok',
  'youtube',
  'x',
  'twitter',
  'threads',
  'linkedin',
  'other'
];

function validateSocialPostPayload({ platform, url, title, tokenCost }) {
  if (!platform || !SUPPORTED_PLATFORMS.includes(platform.toLowerCase())) {
    return { valid: false, error: 'Unsupported platform' };
  }
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { valid: false, error: 'URL required' };
  }
  if (!title || typeof title !== 'string' || !title.trim()) {
    return { valid: false, error: 'Title required' };
  }

  // Strict integer rule: 0 or positive integer
  const cost = Math.max(0, Math.round(Number(tokenCost !== undefined ? tokenCost : 1)));
  const isFree = cost === 0;

  return {
    valid: true,
    platform: platform.toLowerCase(),
    tokenCost: cost,
    isFree
  };
}

function canViewContent({ user, isSuperAdmin, isUnlocked, tokenCost }) {
  // If user chooses 0 tokens, post or video is free to view for all members!
  if (tokenCost === 0) {
    return { canView: true, tokensSpent: 0, reason: 'Free content' };
  }
  // SuperAdmin master rule
  if (isSuperAdmin) {
    return { canView: true, tokensSpent: 0, reason: 'SuperAdmin master access' };
  }
  // Already unlocked
  if (isUnlocked) {
    return { canView: true, tokensSpent: 0, reason: 'Already unlocked' };
  }
  // Locked
  return { canView: false, tokensRequired: tokenCost, reason: 'Unlock required' };
}

function canDeletePost({ callerUid, callerIsSuperAdmin, creatorUid }) {
  if (callerIsSuperAdmin) return true;
  if (callerUid && callerUid === creatorUid) return true;
  return false;
}

test('Supports all major social media platforms for publishing', () => {
  SUPPORTED_PLATFORMS.forEach(platform => {
    const res = validateSocialPostPayload({
      platform,
      url: `https://${platform}.com/post/123`,
      title: 'Biomechanics Breakdown',
      tokenCost: 1
    });
    assert.equal(res.valid, true);
    assert.equal(res.platform, platform);
  });
});

test('Users can choose custom token rate for social media posts', () => {
  const rates = [0, 1, 2, 5, 10, 25];
  rates.forEach(rate => {
    const res = validateSocialPostPayload({
      platform: 'instagram',
      url: 'https://instagram.com/reel/123',
      title: 'Deadlift Setup',
      tokenCost: rate
    });
    assert.equal(res.valid, true);
    assert.equal(res.tokenCost, rate);
    if (rate === 0) {
      assert.equal(res.isFree, true);
    } else {
      assert.equal(res.isFree, false);
    }
  });
});

test('If user chooses 0 tokens, that post or video will be free to view', () => {
  const viewCheck = canViewContent({
    user: { uid: 'regular_user_1' },
    isSuperAdmin: false,
    isUnlocked: false,
    tokenCost: 0
  });

  assert.equal(viewCheck.canView, true);
  assert.equal(viewCheck.tokensSpent, 0);
  assert.equal(viewCheck.reason, 'Free content');
});

test('Paid posts (>0 tokens) require unlocking unless superadmin or already unlocked', () => {
  // Locked case
  const lockedCheck = canViewContent({
    user: { uid: 'regular_user_2' },
    isSuperAdmin: false,
    isUnlocked: false,
    tokenCost: 3
  });
  assert.equal(lockedCheck.canView, false);
  assert.equal(lockedCheck.tokensRequired, 3);

  // SuperAdmin case
  const saCheck = canViewContent({
    user: { uid: 'ZK79FRQoVlYhsgvMibhi81dRUWj2' },
    isSuperAdmin: true,
    isUnlocked: false,
    tokenCost: 3
  });
  assert.equal(saCheck.canView, true);
  assert.equal(saCheck.tokensSpent, 0);

  // Unlocked case
  const unlockedCheck = canViewContent({
    user: { uid: 'regular_user_2' },
    isSuperAdmin: false,
    isUnlocked: true,
    tokenCost: 3
  });
  assert.equal(unlockedCheck.canView, true);
  assert.equal(unlockedCheck.tokensSpent, 0);
});

test('Creator and SuperAdmin have permission to delete published post', () => {
  // Creator can delete their own post
  assert.equal(canDeletePost({
    callerUid: 'creator_123',
    callerIsSuperAdmin: false,
    creatorUid: 'creator_123'
  }), true);

  // SuperAdmin can delete any post
  assert.equal(canDeletePost({
    callerUid: 'superadmin_uid',
    callerIsSuperAdmin: true,
    creatorUid: 'someone_else'
  }), true);

  // Random user cannot delete someone else's post
  assert.equal(canDeletePost({
    callerUid: 'stranger_uid',
    callerIsSuperAdmin: false,
    creatorUid: 'creator_123'
  }), false);
});

