// Tests for Creator Custom Rates (Watch Rates, Social Post View Rates, Direct Message Rates)
const { test } = require('node:test');
const assert = require('node:assert/strict');

const SUPERADMIN_UID = 'ZK79FRQoVlYhsgvMibhi81dRUWj2';

// Rate resolution helper matching backend implementation in api/messages/send.js, api/videos/message-creator.js, api/social/message-creator.js
function resolveMessageFee({ callerUid, callerIsSuperAdmin, itemMessageCost, creatorProfileMessageCost }) {
  if (callerIsSuperAdmin || callerUid === SUPERADMIN_UID) {
    return 0; // SuperAdmin master invariant: always 0 tokens
  }
  if (Number.isInteger(itemMessageCost) && itemMessageCost >= 0) {
    return itemMessageCost;
  }
  if (Number.isInteger(creatorProfileMessageCost) && creatorProfileMessageCost >= 0) {
    return creatorProfileMessageCost;
  }
  return 1; // Default
}

// Item unlock fee helper matching api/videos/unlock.js and api/social/unlock.js
function resolveItemUnlockFee({ callerUid, callerIsSuperAdmin, itemTokenCost }) {
  if (callerIsSuperAdmin || callerUid === SUPERADMIN_UID) {
    return { requiredTokens: 0, isFree: true, accessType: 'superadmin_master' };
  }
  const cost = Number.isInteger(itemTokenCost) && itemTokenCost >= 0 ? itemTokenCost : 1;
  if (cost === 0) {
    return { requiredTokens: 0, isFree: true, accessType: 'free_view' };
  }
  return { requiredTokens: cost, isFree: false, accessType: 'token_purchase' };
}

// Rate update validator matching api/users/update-rates.js
function validateCreatorRateUpdate(requestedRate) {
  const parsed = Number(requestedRate);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 100) {
    return { valid: false, error: 'Rate must be an integer between 0 and 100 tokens' };
  }
  return { valid: true, rate: parsed };
}

test('Creator can set their direct messaging fee to 0 (Free), 1, 2, 5, or custom rate up to 100', () => {
  const freeRate = validateCreatorRateUpdate(0);
  assert.equal(freeRate.valid, true);
  assert.equal(freeRate.rate, 0);

  const customRate = validateCreatorRateUpdate(5);
  assert.equal(customRate.valid, true);
  assert.equal(customRate.rate, 5);

  const invalidNegative = validateCreatorRateUpdate(-1);
  assert.equal(invalidNegative.valid, false);

  const invalidFloat = validateCreatorRateUpdate(2.5);
  assert.equal(invalidFloat.valid, false);

  const invalidLarge = validateCreatorRateUpdate(150);
  assert.equal(invalidLarge.valid, false);
});

test('Each item posted can have a different token cost for watching/viewing', () => {
  const items = [
    { id: 'vid_warmup_free', type: 'video', tokenCost: 0, title: 'Morning Mobility Routine' },
    { id: 'vid_advanced_squat', type: 'video', tokenCost: 5, title: 'Advanced Squat Biomechanics' },
    { id: 'post_recipe_free', type: 'social', tokenCost: 0, title: 'High-Protein Breakfast Ideas' },
    { id: 'post_full_program', type: 'social', tokenCost: 3, title: '12-Week Hypertrophy Split Sheet' }
  ];

  // Video 1 is 0 tokens -> Free to watch
  const vid1 = resolveItemUnlockFee({ callerUid: 'user_regular', callerIsSuperAdmin: false, itemTokenCost: items[0].tokenCost });
  assert.equal(vid1.requiredTokens, 0);
  assert.equal(vid1.isFree, true);
  assert.equal(vid1.accessType, 'free_view');

  // Video 2 is 5 tokens -> Paid unlock
  const vid2 = resolveItemUnlockFee({ callerUid: 'user_regular', callerIsSuperAdmin: false, itemTokenCost: items[1].tokenCost });
  assert.equal(vid2.requiredTokens, 5);
  assert.equal(vid2.isFree, false);
  assert.equal(vid2.accessType, 'token_purchase');

  // Social Post 1 is 0 tokens -> Free to view
  const post1 = resolveItemUnlockFee({ callerUid: 'user_regular', callerIsSuperAdmin: false, itemTokenCost: items[2].tokenCost });
  assert.equal(post1.requiredTokens, 0);
  assert.equal(post1.isFree, true);
  assert.equal(post1.accessType, 'free_view');

  // Social Post 2 is 3 tokens -> Paid unlock
  const post2 = resolveItemUnlockFee({ callerUid: 'user_regular', callerIsSuperAdmin: false, itemTokenCost: items[3].tokenCost });
  assert.equal(post2.requiredTokens, 3);
  assert.equal(post2.isFree, false);
  assert.equal(post2.accessType, 'token_purchase');
});

test('Item-level message fee overrides creator profile default fee unless unspecified', () => {
  const creatorProfileRate = 3; // Creator charges 3 tokens by default

  // Video A has a special promotional free messaging rate (0 tokens)
  const videoAFee = resolveMessageFee({
    callerUid: 'user_regular',
    callerIsSuperAdmin: false,
    itemMessageCost: 0,
    creatorProfileMessageCost: creatorProfileRate
  });
  assert.equal(videoAFee, 0); // 0 overrides profile

  // Video B has a premium direct consultation fee (10 tokens)
  const videoBFee = resolveMessageFee({
    callerUid: 'user_regular',
    callerIsSuperAdmin: false,
    itemMessageCost: 10,
    creatorProfileMessageCost: creatorProfileRate
  });
  assert.equal(videoBFee, 10);

  // General message without item cost falls back to creator profile fee (3 tokens)
  const generalFee = resolveMessageFee({
    callerUid: 'user_regular',
    callerIsSuperAdmin: false,
    itemMessageCost: undefined,
    creatorProfileMessageCost: creatorProfileRate
  });
  assert.equal(generalFee, 3);
});

test('SuperAdmin invariant: SuperAdmin always pays 0 tokens for messaging, watching videos, and viewing social posts', () => {
  // SuperAdmin messaging creator who charges 10 tokens
  const messageFee = resolveMessageFee({
    callerUid: SUPERADMIN_UID,
    callerIsSuperAdmin: true,
    itemMessageCost: 10,
    creatorProfileMessageCost: 10
  });
  assert.equal(messageFee, 0);

  // SuperAdmin unlocking premium video that costs 25 tokens
  const videoUnlock = resolveItemUnlockFee({
    callerUid: SUPERADMIN_UID,
    callerIsSuperAdmin: true,
    itemTokenCost: 25
  });
  assert.equal(videoUnlock.requiredTokens, 0);
  assert.equal(videoUnlock.isFree, true);
  assert.equal(videoUnlock.accessType, 'superadmin_master');

  // SuperAdmin unlocking premium social post that costs 15 tokens
  const socialUnlock = resolveItemUnlockFee({
    callerUid: SUPERADMIN_UID,
    callerIsSuperAdmin: true,
    itemTokenCost: 15
  });
  assert.equal(socialUnlock.requiredTokens, 0);
  assert.equal(socialUnlock.isFree, true);
  assert.equal(socialUnlock.accessType, 'superadmin_master');
});

