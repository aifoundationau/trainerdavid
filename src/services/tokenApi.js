// Client for the FitToken server functions in api/tokens/.
// Every call sends the signed-in user's Firebase ID token; the server decides the balance.
import { auth } from '../firebase';

async function callApi(path, body) {
  const fbUser = auth.currentUser;
  if (!fbUser) throw new Error('Sign in with Google to use FitTokens.');

  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${await fbUser.getIdToken()}`
    },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'FitToken request failed.');
    err.status = res.status;
    throw err;
  }
  return data;
}

// Spend tokens: reason is 'video' (1 token) or 'monthly-pass' (99 tokens). Returns { balance }.
export const spendTokens = (reason, itemId) => callApi('/api/tokens/spend', { reason, itemId });

// SuperAdmin: add or remove tokens for a member. Returns { balance, email }.
export const grantTokens = (uid, delta) => callApi('/api/tokens/grant', { uid, delta });

// Credit a paid Stripe Checkout session. Returns { balance, tokens }.
export const claimStripeSession = (sessionId) => callApi('/api/tokens/claim-stripe', { sessionId });
