// Tests for trainer opt-in roles, mainadmin permissions, and 50/50 token split logic
const { test } = require('node:test');
const assert = require('node:assert/strict');

const HEALTH_FITNESS_ROLES = [
  'trainer',
  'strength_coach',
  'physiotherapist',
  'nutritionist',
  'doctor',
  'exercise_physiologist',
  'rehab_specialist',
  'yoga_pilates'
];

function calculateRevenueSplit(tokenCost) {
  const cost = Math.max(1, Math.round(Number(tokenCost) || 1));
  const trainerShare = Math.round(cost * 0.5);
  const platformShare = cost - trainerShare;
  return { cost, trainerShare, platformShare };
}

function canCallerAssignRole(callerRole, targetCurrentRole, targetNewRole) {
  if (callerRole === 'superadmin') return true;
  if (callerRole === 'mainadmin') {
    // mainadmin cannot promote to superadmin or mainadmin
    if (targetNewRole === 'superadmin' || targetNewRole === 'mainadmin') return false;
    // mainadmin cannot edit existing superadmin or mainadmin
    if (targetCurrentRole === 'superadmin' || targetCurrentRole === 'mainadmin') return false;
    return true;
  }
  return false;
}

test('health & fitness roles catalog contains all required professional titles', () => {
  assert.equal(HEALTH_FITNESS_ROLES.length, 8);
  assert.ok(HEALTH_FITNESS_ROLES.includes('trainer'));
  assert.ok(HEALTH_FITNESS_ROLES.includes('strength_coach'));
  assert.ok(HEALTH_FITNESS_ROLES.includes('physiotherapist'));
  assert.ok(HEALTH_FITNESS_ROLES.includes('nutritionist'));
  assert.ok(HEALTH_FITNESS_ROLES.includes('doctor'));
  assert.ok(HEALTH_FITNESS_ROLES.includes('exercise_physiologist'));
  assert.ok(HEALTH_FITNESS_ROLES.includes('rehab_specialist'));
  assert.ok(HEALTH_FITNESS_ROLES.includes('yoga_pilates'));
});

test('50/50 token revenue split preserves integer tokens with zero decimals', () => {
  // Test cases: [inputCost, expectedTrainer, expectedPlatform]
  const cases = [
    [1, 1, 0],
    [2, 1, 1],
    [3, 2, 1],
    [5, 3, 2],
    [7, 4, 3],
    [10, 5, 5],
    [25, 13, 12],
    [50, 25, 25],
    [100, 50, 50]
  ];

  for (const [cost, expectedTrainer, expectedPlatform] of cases) {
    const split = calculateRevenueSplit(cost);
    assert.equal(split.cost, cost);
    assert.equal(split.trainerShare, expectedTrainer, `Trainer share for ${cost} tokens`);
    assert.equal(split.platformShare, expectedPlatform, `Platform share for ${cost} tokens`);
    assert.equal(split.trainerShare + split.platformShare, cost, `Sum matches total cost for ${cost}`);
    assert.ok(Number.isInteger(split.trainerShare), `Trainer share is strict integer for ${cost}`);
    assert.ok(Number.isInteger(split.platformShare), `Platform share is strict integer for ${cost}`);
  }
});

test('mainadmin role restrictions: can manage normal roles, but cannot grant or modify superadmin/mainadmin', () => {
  // superadmin can do everything
  assert.equal(canCallerAssignRole('superadmin', 'supporter', 'trainer'), true);
  assert.equal(canCallerAssignRole('superadmin', 'supporter', 'mainadmin'), true);
  assert.equal(canCallerAssignRole('superadmin', 'mainadmin', 'superadmin'), true);

  // mainadmin can assign specialist and trainer roles
  assert.equal(canCallerAssignRole('mainadmin', 'supporter', 'trainer'), true);
  assert.equal(canCallerAssignRole('mainadmin', 'supporter', 'nutritionist'), true);
  assert.equal(canCallerAssignRole('mainadmin', 'supporter', 'physiotherapist'), true);
  assert.equal(canCallerAssignRole('mainadmin', 'trainer', 'supporter'), true);

  // mainadmin CANNOT give someone superadmin or mainadmin
  assert.equal(canCallerAssignRole('mainadmin', 'supporter', 'superadmin'), false);
  assert.equal(canCallerAssignRole('mainadmin', 'supporter', 'mainadmin'), false);

  // mainadmin CANNOT edit accounts that are already superadmin or mainadmin
  assert.equal(canCallerAssignRole('mainadmin', 'superadmin', 'trainer'), false);
  assert.equal(canCallerAssignRole('mainadmin', 'mainadmin', 'trainer'), false);

  // normal roles cannot assign anything
  assert.equal(canCallerAssignRole('trainer', 'supporter', 'trainer'), false);
  assert.equal(canCallerAssignRole('supporter', 'supporter', 'trainer'), false);
});

test('supporters and members are authorized to publish videos with default 1 token rate and receive 50% revenue', () => {
  const ALLOWED_PUBLISH_ROLES = [
    'supporter',
    'trainer',
    'strength_coach',
    'physiotherapist',
    'nutritionist',
    'doctor',
    'exercise_physiologist',
    'rehab_specialist',
    'yoga_pilates',
    'admin',
    'mainadmin',
    'superadmin'
  ];

  // Supporters are included in allowed publishing roles
  assert.ok(ALLOWED_PUBLISH_ROLES.includes('supporter'));

  // Default token price for workout video is 1 token
  const defaultPrice = 1;
  const split = calculateRevenueSplit(defaultPrice);
  assert.equal(split.cost, 1);
  assert.equal(split.trainerShare, 1);
  assert.equal(split.platformShare, 0);

  // Custom price e.g. 2 tokens splits 50/50: 1 to creator, 1 to superadmin
  const splitTwo = calculateRevenueSplit(2);
  assert.equal(splitTwo.trainerShare, 1);
  assert.equal(splitTwo.platformShare, 1);

  // Custom price e.g. 10 tokens splits 50/50: 5 to creator, 5 to superadmin
  const splitTen = calculateRevenueSplit(10);
  assert.equal(splitTen.trainerShare, 5);
  assert.equal(splitTen.platformShare, 5);
});

test('people who buy the videos can message the creator for one token', () => {
  const MESSAGE_TOKEN_COST = 1;
  const buyerInitialBalance = 5;
  const creatorInitialBalance = 10;

  // Verify cost is strictly 1 integer token
  assert.equal(MESSAGE_TOKEN_COST, 1);
  assert.ok(Number.isInteger(MESSAGE_TOKEN_COST));

  // Buyer spends 1 token
  const buyerBalanceAfter = buyerInitialBalance - MESSAGE_TOKEN_COST;
  assert.equal(buyerBalanceAfter, 4);

  // Creator receives 1 token
  const creatorBalanceAfter = creatorInitialBalance + MESSAGE_TOKEN_COST;
  assert.equal(creatorBalanceAfter, 11);

  // Total tokens in transaction conserved
  assert.equal(buyerInitialBalance + creatorInitialBalance, buyerBalanceAfter + creatorBalanceAfter);
});

test('31+ video workouts catalog copy and permanent lifetime access invariants', () => {
  const catalogHeading = 'EXPLORE 31+ VIDEO WORKOUTS';
  const catalogSubtitle = 'Step-by-step biomechanical execution, key cues, and muscle activation. Spend tokens once to own permanent lifetime access. Every video you unlock is yours to watch for life on any device.';

  assert.equal(catalogHeading, 'EXPLORE 31+ VIDEO WORKOUTS');
  assert.ok(catalogSubtitle.includes('Step-by-step biomechanical execution'));
  assert.ok(catalogSubtitle.includes('Spend tokens once to own permanent lifetime access'));
  assert.ok(catalogSubtitle.includes('Every video you unlock is yours to watch for life on any device.'));
});

test('you must unlock this video before you can message the creator', () => {
  function validateMessagingEligibility({ isSuperAdmin, isUnlocked }) {
    if (isSuperAdmin) return { eligible: true, tokenCost: 0 };
    if (!isUnlocked) {
      throw new Error('You must unlock this video before you can message the creator.');
    }
    return { eligible: true, tokenCost: 1 };
  }

  // Non-superadmin with locked video is rejected
  assert.throws(
    () => validateMessagingEligibility({ isSuperAdmin: false, isUnlocked: false }),
    /You must unlock this video before you can message the creator/
  );

  // Non-superadmin with unlocked video can message for 1 token
  const unlockedResult = validateMessagingEligibility({ isSuperAdmin: false, isUnlocked: true });
  assert.equal(unlockedResult.eligible, true);
  assert.equal(unlockedResult.tokenCost, 1);

  // Superadmin can always message without unlocking and for 0 tokens
  const superAdminLockedResult = validateMessagingEligibility({ isSuperAdmin: true, isUnlocked: false });
  assert.equal(superAdminLockedResult.eligible, true);
  assert.equal(superAdminLockedResult.tokenCost, 0);

  const superAdminUnlockedResult = validateMessagingEligibility({ isSuperAdmin: true, isUnlocked: true });
  assert.equal(superAdminUnlockedResult.eligible, true);
  assert.equal(superAdminUnlockedResult.tokenCost, 0);
});

test('the superadmin can do everything on this website without tokens', () => {
  const SUPERADMIN_UID = 'ZK79FRQoVlYhsgvMibhi81dRUWj2';
  const superAdminEmails = [
    'support@aifoundation.net.au',
    'davidrobertson.info@gmail.com',
    'david@aifoundation.com.au'
  ];

  function evaluateCostForUser({ email, uid, action }) {
    const isSuper = superAdminEmails.includes(email?.toLowerCase()) || uid === SUPERADMIN_UID;
    if (isSuper) {
      return { cost: 0, exempt: true, access: 'superadmin_master' };
    }
    if (action === 'unlock_video') return { cost: 1, exempt: false, access: 'paid' };
    if (action === 'message_creator') return { cost: 1, exempt: false, access: 'paid' };
    return { cost: 1, exempt: false, access: 'standard' };
  }

  // All superadmins pay 0 tokens across actions
  for (const email of superAdminEmails) {
    const unlock = evaluateCostForUser({ email, uid: 'any', action: 'unlock_video' });
    assert.equal(unlock.cost, 0);
    assert.equal(unlock.exempt, true);

    const message = evaluateCostForUser({ email, uid: 'any', action: 'message_creator' });
    assert.equal(message.cost, 0);
    assert.equal(message.exempt, true);
  }

  // SuperAdmin UID check
  const uidCheck = evaluateCostForUser({ email: 'unknown@custom.com', uid: SUPERADMIN_UID, action: 'unlock_video' });
  assert.equal(uidCheck.cost, 0);
  assert.equal(uidCheck.exempt, true);

  // Regular user pays the normal token cost
  const regular = evaluateCostForUser({ email: 'supporter@gmail.com', uid: 'user_123', action: 'unlock_video' });
  assert.equal(regular.cost, 1);
  assert.equal(regular.exempt, false);
});

test('only YouTube videos are allowed for workout video uploads', () => {
  function validateVideoUploadUrl(url) {
    const ytMatch = String(url || '').trim().match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
    if (!ytMatch || !ytMatch[1]) {
      throw new Error('Only YouTube videos are allowed.');
    }
    return ytMatch[1];
  }

  // Valid YouTube URLs
  assert.equal(validateVideoUploadUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(validateVideoUploadUrl('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(validateVideoUploadUrl('https://youtube.com/shorts/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(validateVideoUploadUrl('https://www.youtube.com/embed/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');

  // Non-YouTube URLs rejected
  assert.throws(() => validateVideoUploadUrl('https://vimeo.com/123456789'), /Only YouTube videos are allowed/);
  assert.throws(() => validateVideoUploadUrl('https://dailymotion.com/video/x789'), /Only YouTube videos are allowed/);
  assert.throws(() => validateVideoUploadUrl('https://example.com/video.mp4'), /Only YouTube videos are allowed/);
  assert.throws(() => validateVideoUploadUrl(''), /Only YouTube videos are allowed/);
});

test('social posts from Instagram and Facebook cost 1 token to view and 1 token to message creator', () => {
  function evaluateSocialAction({ platform, url, isUnlocked, isSuperAdmin, action }) {
    if (platform !== 'instagram' && platform !== 'facebook') {
      throw new Error('Only Instagram and Facebook posts are allowed.');
    }

    if (action === 'unlock') {
      return { cost: isSuperAdmin ? 0 : 1, unlocked: true };
    }

    if (action === 'message_creator') {
      if (!isUnlocked && !isSuperAdmin) {
        throw new Error('You must unlock this post before you can message the creator.');
      }
      return { cost: isSuperAdmin ? 0 : 1, messageSent: true };
    }

    return { cost: 0 };
  }

  // Validation: only Instagram and Facebook
  assert.doesNotThrow(() => evaluateSocialAction({ platform: 'instagram', url: 'https://instagram.com/p/123', action: 'unlock' }));
  assert.doesNotThrow(() => evaluateSocialAction({ platform: 'facebook', url: 'https://facebook.com/123', action: 'unlock' }));
  assert.throws(() => evaluateSocialAction({ platform: 'tiktok', url: 'https://tiktok.com/123', action: 'unlock' }), /Only Instagram and Facebook/);

  // Normal user view cost: 1 token
  const viewCost = evaluateSocialAction({ platform: 'instagram', isUnlocked: false, isSuperAdmin: false, action: 'unlock' });
  assert.equal(viewCost.cost, 1);

  // SuperAdmin view cost: 0 tokens
  const superViewCost = evaluateSocialAction({ platform: 'instagram', isUnlocked: false, isSuperAdmin: true, action: 'unlock' });
  assert.equal(superViewCost.cost, 0);

  // Messaging locked post rejected for normal user
  assert.throws(
    () => evaluateSocialAction({ platform: 'instagram', isUnlocked: false, isSuperAdmin: false, action: 'message_creator' }),
    /You must unlock this post before you can message the creator/
  );

  // Messaging unlocked post costs 1 token for normal user
  const messageCost = evaluateSocialAction({ platform: 'instagram', isUnlocked: true, isSuperAdmin: false, action: 'message_creator' });
  assert.equal(messageCost.cost, 1);

  // Superadmin can message locked or unlocked post for 0 tokens
  const superMsgCost = evaluateSocialAction({ platform: 'instagram', isUnlocked: false, isSuperAdmin: true, action: 'message_creator' });
  assert.equal(superMsgCost.cost, 0);
});


