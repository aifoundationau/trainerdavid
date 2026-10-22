// POST /api/tokens/spend  { reason: 'video' | 'monthly-pass', itemId? }
// The price comes from the server, never from the browser.
import { handler, requireUser, changeTokens, HttpError } from '../_lib/firebaseAdmin.js';

const PRICES = { video: 1, 'monthly-pass': 99 };

export default handler(async (req) => {
  const user = await requireUser(req);
  const { reason, itemId = '' } = req.body || {};
  const price = PRICES[reason];
  if (!price) throw new HttpError(400, 'Unknown purchase.');

  return changeTokens(user.uid, -price, { type: 'spend', reason, itemId: String(itemId).slice(0, 100), by: user.uid });
});
