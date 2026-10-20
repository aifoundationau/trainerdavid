/**
 * Stripe Checkout Client Utility for Trainer David
 * Handles redirection to Stripe-hosted Checkout Sessions & Payment Links
 */

import { tokenPackages, membershipTiers } from '../data/services';

/**
 * Initiates Stripe Checkout for a token recharge package or membership pass
 * @param {Object} options
 * @param {string} options.packageId - 'recharge-100', 'recharge-300', 'recharge-600', or 'monthly-pass'
 * @param {number} [options.customAmount] - Optional custom token amount
 * @param {Object} [options.user] - Logged in user profile
 */
export async function startStripeCheckout({ packageId, customAmount, user }) {
  const customerEmail = user?.email || '';
  const clientName = user?.name || user?.displayName || 'Supporter';

  // Find pre-configured fallback link if available
  const pkg = tokenPackages.find(p => p.id === packageId) || membershipTiers.find(t => t.id === packageId);
  const fallbackUrl = pkg?.stripePaymentUrl;

  try {
    const res = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageId,
        customAmount,
        customerEmail,
        clientName,
        tokens: pkg?.tokens || customAmount || 0
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return { success: true, url: data.url };
      }
    }
  } catch (err) {
    console.warn('[Stripe] Dynamic checkout session creation failed, using direct Payment Link:', err);
  }

  // Fallback to pre-generated Stripe Payment Link
  if (fallbackUrl) {
    let finalUrl = fallbackUrl;
    const urlObj = new URL(fallbackUrl);
    if (customerEmail) {
      urlObj.searchParams.set('prefilled_email', customerEmail);
    }
    urlObj.searchParams.set('client_reference_id', customerEmail || clientName);
    window.location.href = urlObj.toString();
    return { success: true, url: urlObj.toString() };
  }

  throw new Error("Unable to initialize Stripe Checkout. Please verify your internet connection.");
}
