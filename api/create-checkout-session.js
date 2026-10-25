// POST /api/create-checkout-session  { packageId?, customAmount? }
// Production version of the dev-server endpoint in vite.config.js. Prices are set here,
// and the session is tied to the signed-in member so /api/tokens/claim-stripe can credit them.
import { handler, requireUser, HttpError, db } from './_lib/firebaseAdmin.js';

const PACKAGES = {
  'recharge-100': { name: 'FitToken Recharge - 100 Tokens', tokens: 100 },
  'recharge-300': { name: 'FitToken Recharge - 300 Tokens', tokens: 300 },
  'recharge-600': { name: 'FitToken Recharge - 600 Tokens', tokens: 600 },
  'monthly-pass': { cents: 9900, name: 'Monthly All-Access Pass', tokens: 0, subscription: true }
};

export default handler(async (req) => {
  const user = await requireUser(req);
  const { packageId, customAmount } = req.body || {};

  // Retrieve SuperAdmin-configured USD token price from Firestore
  let pricePerToken = 1.0;
  try {
    const doc = await db.collection('system_settings').doc('aifoundation_service_prices').get();
    if (doc.exists) {
      const data = doc.data();
      const configuredUsd = data?.prices?.tokens?.perToken?.usd;
      if (typeof configuredUsd === 'number' && configuredUsd > 0) {
        pricePerToken = configuredUsd;
      }
    }
  } catch (err) {
    console.warn('[Stripe] Could not fetch service prices from Firestore, using baseline $1.00:', err.message);
  }

  let pkg = PACKAGES[packageId];
  if (!pkg) {
    const amt = Number(customAmount);
    if (!Number.isInteger(amt) || amt < 1 || amt > 10000) throw new HttpError(400, 'Choose between 1 and 10000 tokens.');
    pkg = { cents: Math.round(amt * pricePerToken * 100), name: `FitToken Recharge (${amt} Tokens)`, tokens: amt };
  } else if (!pkg.subscription) {
    pkg = { ...pkg, cents: Math.round(pkg.tokens * pricePerToken * 100) };
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
