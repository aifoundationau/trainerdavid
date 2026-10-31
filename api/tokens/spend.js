// POST /api/tokens/spend  { reason: 'video' | 'monthly-pass', itemId? }
// The price comes from the server, never from the browser.
// SuperAdmin master rule: superadmin can do everything on this website without tokens.
import { handler, requireUser, isSuperAdmin, changeTokens, HttpError } from '../_lib/firebaseAdmin.js';

const PRICES = { video: 1, 'monthly-pass': 99 };
const SUPERADMIN_UID = 'ZK79FRQoVlYhsgvMibhi81dRUWj2';

export default handler(async (req) => {
  const user = await requireUser(req);
  const { reason, itemId = '' } = req.body || {};
  const price = PRICES[reason];
  if (!price) throw new HttpError(400, 'Unknown purchase.');

  // SuperAdmin master rule: superadmin can do everything on this website without tokens
  if (isSuperAdmin(user) || user.uid === SUPERADMIN_UID) {
    return {
      balance: 9999,
      freeSuperAdminAccess: true,
      reason,
      itemId: String(itemId).slice(0, 100),
      message: 'SuperAdmin master access: 0 tokens spent.'
    };
  }

  return changeTokens(user.uid, -price, { type: 'spend', reason, itemId: String(itemId).slice(0, 100), by: user.uid });
});

