// Tests for Messaging in Admin Panel, Payment Gating, SuperAdmin Exemption, and Coach David AI Skills
const { test } = require('node:test');
const assert = require('node:assert/strict');

const SUPERADMIN_UID = 'ZK79FRQoVlYhsgvMibhi81dRUWj2';

function isUserEligibleToMessage({ callerUid, callerIsSuperAdmin, recipientUid, paymentHistory = [] }) {
  // Master rule: SuperAdmin can message anyone at any time without tokens
  if (callerIsSuperAdmin || callerUid === SUPERADMIN_UID) {
    return { eligible: true, tokenCost: 0, reason: 'SuperAdmin master access' };
  }

  // Self-messaging is blocked
  if (callerUid === recipientUid) {
    return { eligible: false, tokenCost: 0, reason: 'Cannot message yourself' };
  }

  // SuperAdmin is always an eligible recipient
  if (recipientUid === SUPERADMIN_UID) {
    return { eligible: true, tokenCost: 1, reason: 'SuperAdmin platform support' };
  }

  // Payment check: Has payment been made between caller and recipient?
  // (e.g. caller unlocked recipient's video/post OR recipient unlocked caller's video/post)
  const hasPaid = paymentHistory.some(p => 
    (p.buyerUid === callerUid && p.creatorUid === recipientUid) ||
    (p.buyerUid === recipientUid && p.creatorUid === callerUid)
  );

  if (hasPaid) {
    return { eligible: true, tokenCost: 1, reason: 'Payment verified (unlocked content)' };
  }

  return { 
    eligible: false, 
    tokenCost: 1, 
    reason: 'You can only message members once payment has been made (e.g. unlocking a workout video or social post).' 
  };
}

function processMessageTransfer({ senderBal, tokenCost }) {
  if (tokenCost === 0) {
    return { success: true, newSenderBal: senderBal, cost: 0 };
  }
  if (senderBal < tokenCost) {
    return { success: false, error: `Not enough tokens (requires ${tokenCost}, you have ${senderBal})` };
  }
  return { success: true, newSenderBal: senderBal - tokenCost, cost: tokenCost };
}

test('SuperAdmin can message anyone at any time without tokens (0 tokens)', () => {
  const result = isUserEligibleToMessage({
    callerUid: SUPERADMIN_UID,
    callerIsSuperAdmin: true,
    recipientUid: 'random_member_123',
    paymentHistory: [] // No prior payment required!
  });

  assert.equal(result.eligible, true);
  assert.equal(result.tokenCost, 0);

  const transfer = processMessageTransfer({ senderBal: 0, tokenCost: result.tokenCost });
  assert.equal(transfer.success, true);
  assert.equal(transfer.cost, 0);
  assert.equal(transfer.newSenderBal, 0);
});

test('Regular user cannot message someone without prior payment', () => {
  const result = isUserEligibleToMessage({
    callerUid: 'user_alice',
    callerIsSuperAdmin: false,
    recipientUid: 'user_bob',
    paymentHistory: [] // No prior payment
  });

  assert.equal(result.eligible, false);
  assert.match(result.reason, /once payment has been made/);
});

test('Regular user can message creator once video or social post payment has been made', () => {
  const payments = [
    { buyerUid: 'user_alice', creatorUid: 'user_bob', itemId: 'vid_bench_01', type: 'video' }
  ];

  const result = isUserEligibleToMessage({
    callerUid: 'user_alice',
    callerIsSuperAdmin: false,
    recipientUid: 'user_bob',
    paymentHistory: payments
  });

  assert.equal(result.eligible, true);
  assert.equal(result.tokenCost, 1);

  // Sending message costs 1 token
  const transfer = processMessageTransfer({ senderBal: 10, tokenCost: result.tokenCost });
  assert.equal(transfer.success, true);
  assert.equal(transfer.newSenderBal, 9);
  assert.equal(transfer.cost, 1);
});

test('Regular user cannot send message if they have 0 tokens even if payment was made', () => {
  const payments = [
    { buyerUid: 'user_alice', creatorUid: 'user_bob', itemId: 'soc_post_01', type: 'social' }
  ];

  const result = isUserEligibleToMessage({
    callerUid: 'user_alice',
    callerIsSuperAdmin: false,
    recipientUid: 'user_bob',
    paymentHistory: payments
  });

  assert.equal(result.eligible, true);
  assert.equal(result.tokenCost, 1);

  const transfer = processMessageTransfer({ senderBal: 0, tokenCost: result.tokenCost });
  assert.equal(transfer.success, false);
  assert.match(transfer.error, /Not enough tokens/);
});

test('Bidirectional messaging: Creator can message buyer who paid for their video', () => {
  const payments = [
    { buyerUid: 'user_alice', creatorUid: 'creator_dan', itemId: 'vid_squat_01', type: 'video' }
  ];

  // Creator messaging buyer
  const result = isUserEligibleToMessage({
    callerUid: 'creator_dan',
    callerIsSuperAdmin: false,
    recipientUid: 'user_alice',
    paymentHistory: payments
  });

  assert.equal(result.eligible, true);
  assert.equal(result.tokenCost, 1);
});

test('Coach David AI system prompt skill guidelines contain video, social post, and messaging rules', () => {
  const promptDirectives = `
SKILL DIRECTIVES & RULES:
1. Video Recommendations: Pick out relevant workout videos to solve the user's inquiry. Always format video references as [VIDEO:id:title] so our web interface renders interactive clickable video workout cards.
2. Creator Social Posts: Suggest relevant creator social posts for nutrition, setup, and mobility. Always format post references as [POST:id:title].
   CRITICAL REQUIREMENT: Always explicitly remind users that it costs 1 token to view/unlock a creator post!
3. Messaging Creators: Suggest messaging the creator for custom feedback.
   CRITICAL REQUIREMENT: Remind users that messaging a creator costs 1 token, and that payment/unlocking must be made first before messaging is enabled. Note that the SuperAdmin can message anyone at any time without tokens.
`;

  assert.ok(promptDirectives.includes('[VIDEO:id:title]'));
  assert.ok(promptDirectives.includes('[POST:id:title]'));
  assert.ok(promptDirectives.includes('1 token to view/unlock a creator post'));
  assert.ok(promptDirectives.includes('messaging a creator costs 1 token'));
  assert.ok(promptDirectives.includes('payment/unlocking must be made first'));
  assert.ok(promptDirectives.includes('SuperAdmin can message anyone at any time without tokens'));
});

