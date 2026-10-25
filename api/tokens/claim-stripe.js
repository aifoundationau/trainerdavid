// POST /api/tokens/claim-stripe  { sessionId }
// Credits FitTokens for a paid Stripe Checkout session, once, to the member who paid.
// 1 token = USD $1, worked out from what Stripe actually charged.
import { handler, requireUser, changeTokens, HttpError } from '../_lib/firebaseAdmin.js';

export default handler(async (req) => {
  const user = await requireUser(req);
  const { sessionId } = req.body || {};
  if (!sessionId || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) throw new HttpError(400, 'Invalid checkout session.');

  const stripeResp = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` }
  });
  const session = await stripeResp.json();
  if (!stripeResp.ok) throw new HttpError(400, 'Could not find that Stripe payment.');

  if (session.mode !== 'payment' || session.payment_status !== 'paid') {
    throw new HttpError(400, 'That Stripe payment is not complete.');
  }

  // The session must belong to the signed-in member
  const paidEmail = (session.customer_details?.email || session.customer_email || '').toLowerCase();
  const ownerUid = session.metadata?.client_uid;
  if (ownerUid ? ownerUid !== user.uid : paidEmail !== (user.email || '').toLowerCase()) {
    throw new HttpError(403, 'This payment belongs to a different account.');
  }

  if (session.currency !== 'usd') throw new HttpError(400, 'Unsupported currency.');
  const metaTokens = parseInt(session.metadata?.tokens, 10);
  const tokens = Number.isInteger(metaTokens) && metaTokens > 0 
    ? metaTokens 
    : Math.floor((session.amount_total || 0) / 100);
  if (tokens <= 0) throw new HttpError(400, 'No FitTokens in that payment.');

  const result = await changeTokens(
    user.uid,
    tokens,
    { type: 'stripe', sessionId, amountTotal: session.amount_total, currency: session.currency, by: user.uid },
    `stripe_${sessionId}`
  );
  return { ...result, tokens };
});
