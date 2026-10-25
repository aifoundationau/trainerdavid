// The universal Tokens tab for Trainer David: Token Price Settings (SuperAdmin).
// Embeds the universal token system (token-kit) markup and connects seamlessly with public/tokens-ui.js.
import React, { memo, useEffect } from 'react';

const STYLESHEET = '/tokens.css?v=2';
const SCRIPTS = ['/token-pricing.js?v=1', '/tokens-ui.js?v=3'];

const MARKUP = `
<!-- Shown until the visitor signs in with Google -->
<section id="tokensSignedOut" class="tokens-card">
    <h2>Tokens</h2>
    <p class="tokens-intro">Sign in to manage token pricing and view settings.</p>
    <button type="button" id="tokensSignInBtn" class="tokens-btn">Sign in with Google</button>
</section>

<div id="tokensSignedIn" hidden>
    <div class="tokens-boxes-grid">
        <!-- BOX: TOKEN PRICE SETTINGS (SuperAdmins only) -->

        <details id="tokenPricingSection" class="tokens-card tokens-collapsible" data-agent-id="token-pricing-admin-section" data-testid="token-pricing-admin-section" hidden open>
            <summary class="tokens-summary" data-agent-id="summary-token-pricing" data-testid="summary-token-pricing">
                <span class="tokens-summary-title">Token Price Settings (SuperAdmin)</span>
                <span class="tokens-chevron" aria-hidden="true">▾</span>
            </summary>
            <div class="tokens-card-body">
                <p class="tokens-intro">Set the universal baseline USD price for 1 token across all applications in AI Foundation. The AUD price converts automatically at today's exchange rate.</p>
                <div class="token-pricing-admin-grid">
                    <div class="token-pricing-field">
                        <label for="adminTokenPriceUsd">
                            <span>1 Token = USD Price ($)</span>
                            <small>Baseline price in US Dollars</small>
                        </label>
                        <div class="token-pricing-input-wrap">
                            <span class="currency-prefix">USD $</span>
                            <input type="number" id="adminTokenPriceUsd" step="0.01" min="0.01" max="1000000" placeholder="1.00" data-agent-id="input-token-price-usd" data-testid="input-token-price-usd" aria-label="USD price per token">
                        </div>
                    </div>
                    <div class="token-pricing-field">
                        <label for="adminTokenPriceAud">
                            <span>Converted AUD Price ($)</span>
                            <small id="adminExchangeRateHint">Calculated via live exchange rate</small>
                        </label>
                        <div class="token-pricing-input-wrap">
                            <span class="currency-prefix">AUD $</span>
                            <input type="number" id="adminTokenPriceAud" step="0.01" min="0.01" max="1000000" placeholder="Auto-converted" data-agent-id="input-token-price-aud" data-testid="input-token-price-aud" aria-label="AUD price per token">
                        </div>
                    </div>
                </div>
                <div class="token-pricing-meta" id="adminTokenPriceMeta">
                    <span id="adminExchangeRateInfo">Exchange rate: Loading live rate...</span>
                    <span id="adminPriceLastUpdated"></span>
                </div>
                <div class="token-pricing-actions">
                    <button type="button" id="adminSaveTokenPriceBtn" class="tokens-btn" data-agent-id="btn-save-token-price" data-testid="btn-save-token-price" aria-label="Save Token Price">Save Token Price</button>
                    <button type="button" id="adminResetTokenPriceBtn" class="tokens-btn-secondary" data-agent-id="btn-reset-token-price" data-testid="btn-reset-token-price" aria-label="Reset to Default" title="Reset to USD $1.00">Reset to $1.00</button>
                </div>
                <div id="tokenPricingStatus" class="tokens-status" role="status" style="display: none;" data-agent-id="status-token-pricing" data-testid="status-token-pricing"></div>
            </div>
        </details>
    </div>
</div>`;

function load(tag, attributes, parent) {
  return new Promise((resolve, reject) => {
    const element = Object.assign(document.createElement(tag), attributes);
    element.onload = resolve;
    element.onerror = () => reject(new Error(`Could not load ${attributes.src || attributes.href}`));
    parent.appendChild(element);
  });
}

let loading = null;
function loadTokenFiles() {
  if (!loading) {
    load('link', { rel: 'stylesheet', href: STYLESHEET }, document.head)
      .catch(e => console.error('[Tokens]', e.message));
    loading = SCRIPTS.reduce((previous, src) => previous.then(() => load('script', { src }, document.body)), Promise.resolve())
      .catch(e => console.error('[Tokens]', e.message));
  }
  return loading;
}

function TokensPanel({ hidden }) {
  useEffect(() => {
    loadTokenFiles();
  }, []);

  return (
    <div hidden={hidden}>
      <div className="tokens-panel animate-fade-in" dangerouslySetInnerHTML={{ __html: MARKUP }} />
    </div>
  );
}

export default memo(TokensPanel);
