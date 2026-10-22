// POST /api/create-checkout-session  { packageId?, customAmount? }
// Production version of the dev-server endpoint in vite.config.js. Prices are set here,
// and the session is tied to the signed-in member so /api/tokens/claim-stripe can credit them.
import { handler, requireUser, HttpError } from './_lib/firebaseAdmin.js';

const PACKAGES = {
  'recharge-100': { cents: 10000, name: 'FitToken Recharge - 100 Tokens', tokens: 100 },
  'recharge-300': { cents: 30000, name: 'FitToken Recharge - 300 Tokens', tokens: 300 },
  'recharge-600': { cents: 60000, name: 'FitToken Recharge - 600 Tokens', tokens: 600 },
  'monthly-pass': { cents: 9900, name: 'Monthly All-Access Pass', tokens: 0, subscription: true }
};

export default handler(async (req) => {
  const user = await requireUser(req);
  const { packageId, customAmount } = req.body || {};

  let pkg = PACKAGES[packageId];
  if (!pkg) {
    const amt = Number(customAmount);
    if (!Number.isInteger(amt) || amt < 1 || amt > 10000) throw new HttpError(400, 'Choose between 1 and 10000 tokens.');
    pkg = { cents: amt * 100, name: `FitToken Recharge (${amt} Tokens)`, tokens: amt };
  }

  const origin = req.headers.origin || `https://${req.headers.host}`;
  const params = new URLSearchParams();
  params.append('mode', pkg.subscription ? 'subscription' : 'payment');
  params.append('success_url', `${origin}/?session_id={CHECKOUT_SESSION_ID}&stripe_success=true&package=${packageId || 'custom'}`);
  params.append('cancel_url', `${origin}/?stripe_cancel=true`);
  if (user.email) params.append('customer_email', user.email);
  params.append('client_reference_id', user.uid);
  params.append('metadata[client_uid]', user.uid);
  params.append('metadata[package_id]', packageId || 'custom');
  params.append('metadata[tokens]', String(pkg.tokens));
  params.append('line_items[0][price_data][currency]', 'usd');
  params.append('line_items[0][price_data][product_data][name]', pkg.name);
  params.append('line_items[0][price_data][unit_amount]', String(pkg.cents));
  if (pkg.subscription) params.append('line_items[0][price_data][recurring][interval]', 'month');
  params.append('line_items[0][quantity]', '1');

  const stripeResp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  });
  const data = await stripeResp.json();
  if (!stripeResp.ok) throw new HttpError(502, data.error?.message || 'Stripe API error');
  return { url: data.url, id: data.id };
});
