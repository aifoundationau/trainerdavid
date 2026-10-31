// POST /api/users/update-rates  { messageTokenCost }
// Allows creators to set how much it costs for members to send them a direct message.
// Rate can be 0 (Free messaging) or any integer token amount (1, 2, 5, etc.).
import { handler, requireUser, db, HttpError } from '../_lib/firebaseAdmin.js';

export default handler(async (req) => {
  const caller = await requireUser(req);
  const { messageTokenCost: rawCost } = req.body || {};

  if (rawCost === undefined || rawCost === null) {
    throw new HttpError(400, 'Missing messageTokenCost.');
  }

  const messageTokenCost = Math.max(0, Math.round(Number(rawCost) || 0));
  const now = new Date().toISOString();

  const userRef = db.collection('users').doc(caller.uid);
  await userRef.set({
    messageTokenCost,
    updatedAt: now
  }, { merge: true });

  return {
    success: true,
    messageTokenCost,
    message: messageTokenCost === 0 
      ? 'Your messaging rate is now FREE (0 tokens).'
      : `Your messaging rate is now set to ${messageTokenCost} ${messageTokenCost === 1 ? 'Token' : 'Tokens'}.`
  };
});

