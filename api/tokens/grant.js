// POST /api/tokens/grant  { uid, delta }  (SuperAdmin only)
// Adds (or with a negative delta, removes) FitTokens for any member, including the SuperAdmin.
import { handler, requireUser, isSuperAdmin, changeTokens, HttpError } from '../_lib/firebaseAdmin.js';

export default handler(async (req) => {
  const user = await requireUser(req);
  if (!isSuperAdmin(user)) throw new HttpError(403, 'Only the SuperAdmin can change FitTokens.');

  const { uid, delta } = req.body || {};
  const amount = Number(delta);
  if (!uid || typeof uid !== 'string') throw new HttpError(400, 'Missing member.');
  if (!Number.isInteger(amount) || amount === 0 || Math.abs(amount) > 100000) {
    throw new HttpError(400, 'Token change must be a whole number between -100000 and 100000.');
  }

  return changeTokens(uid, amount, { type: 'grant', by: user.uid, byEmail: user.email || '' });
});
