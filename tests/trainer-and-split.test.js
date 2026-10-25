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
