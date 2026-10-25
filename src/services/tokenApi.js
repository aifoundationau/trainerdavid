// Client for the universal token system in Trainer David (PROCESS 001 - 250).
// Injects the signed-in user's Firebase ID token and talks to the universal token endpoints.
import { auth } from '../firebase';

const APP_TAG = 'pt';

async function callApi(path, options = {}) {
  const fbUser = auth.currentUser;
  if (!fbUser) throw new Error('Sign in with Google to use tokens.');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${await fbUser.getIdToken()}`,
    ...(options.headers || {})
  };

  const res = await fetch(path, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Token request failed.');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// Get the user's current universal token balance, pricing, and limits
export const getTokenBalance = () => callApi('/api/tokens');

// Spend universal tokens (PROCESS 070 / 091)
// Supports both canonical signature (tokens, reference, description)
// and legacy signature ('video', videoId) / ('monthly-pass')
export const spendTokens = (arg1, arg2, arg3 = '') => {
  let tokens = 1;
  let reference = '';
  let description = '';

  if (typeof arg1 === 'number') {
    tokens = arg1;
    reference = String(arg2 || `spend_${Date.now()}`);
    description = arg3 || `Trainer David: ${reference}`;
  } else if (arg1 === 'video') {
    tokens = 1;
    reference = `video_${arg2 || Date.now()}`;
    description = `Watch video masterclass ${arg2 || ''}`;
  } else if (arg1 === 'monthly-pass') {
    tokens = 99;
    reference = `monthly_pass_${Date.now()}`;
    description = 'Monthly All-Access Pass Subscription';
  } else {
    tokens = Number(arg1) || 1;
    reference = String(arg2 || `spend_${Date.now()}`);
    description = arg3 || `Trainer David: ${reference}`;
  }

  return callApi('/api/tokens/spend', {
    method: 'POST',
    body: {
      tokens,
      app: APP_TAG,
      reference,
      description
    }
  });
};

// SuperAdmin: Grant universal tokens to any account across the ecosystem
export const grantTokens = (uid, tokens, note = '') => {
  return callApi('/api/tokens/grant', {
    method: 'POST',
    body: {
      uid,
      tokens: Number(tokens),
      requestId: `grant_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      note: note || 'Administrative top-up'
    }
  });
};

// SuperAdmin: Inspect current token pricing settings and live FX rates
export const getPricingSettings = () => callApi('/api/tokens/pricing-settings');

// SuperAdmin: Set USD/AUD token prices across the ecosystem (PROCESS 016 & 030)
export const updatePricingSettings = (usd, aud = null) => {
  return callApi('/api/tokens/pricing-settings', {
    method: 'PUT',
    body: { usd, aud }
  });
};

// Confirm a paid Stripe Checkout session (PROCESS 090)
export const confirmStripeCheckout = (sessionId) => {
  return callApi('/api/tokens/confirm', {
    method: 'POST',
    body: { sessionId }
  });
};

// Backward-compatible alias
export const claimStripeSession = confirmStripeCheckout;
