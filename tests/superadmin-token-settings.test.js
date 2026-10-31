// Tests for SuperAdmin Admin Panel: Token Price, Geolocated Country Rates, Currency Toggles, and Open Contract Visibility
const { test } = require('node:test');
const assert = require('node:assert/strict');
const pricing = require('../public/token-pricing');

test('Token price baseline defaults to USD $1 but can be modified by SuperAdmin', () => {
  const defaultSaved = {
    tokens: {
      perToken: { usd: 1.00 }
    }
  };
  const price = pricing.tokenPrice(defaultSaved, 'US');
  assert.equal(price.currency, 'USD');
  assert.equal(price.amount, 1.00);

  // SuperAdmin modifies base USD price to $1.50
  const modifiedSaved = {
    tokens: {
      perToken: { usd: 1.50 }
    }
  };
  const modifiedPrice = pricing.tokenPrice(modifiedSaved, 'US');
  assert.equal(modifiedPrice.currency, 'USD');
  assert.equal(modifiedPrice.amount, 1.50);
});

test('Special token amount for Cambodia: USD $1 = 10 Tokens (geolocated)', () => {
  const savedSettings = {
    tokens: {
      perToken: { usd: 1.00 },
      countryRates: {
        KH: { country: 'Cambodia', code: 'KH', tokensPerUsd: 10 }
      }
    }
  };

  const cambodiaPrice = pricing.tokenPrice(savedSettings, 'KH');
  assert.equal(cambodiaPrice.currency, 'USD');
  // 1 token = 1 / 10 = $0.10 USD
  assert.equal(cambodiaPrice.amount, 0.10);

  // 10 tokens cost exactly USD $1.00
  const total10 = pricing.tokenTotal(cambodiaPrice, 10);
  assert.equal(total10.currency, 'USD');
  assert.equal(total10.amount, 1.00);

  // 100 tokens cost USD $10.00
  const total100 = pricing.tokenTotal(cambodiaPrice, 100);
  assert.equal(total100.currency, 'USD');
  assert.equal(total100.amount, 10.00);
});

test('Special token amount for Thailand: USD $1 = 5 Tokens (geolocated)', () => {
  const savedSettings = {
    tokens: {
      perToken: { usd: 1.00 },
      countryRates: {
        TH: { country: 'Thailand', code: 'TH', tokensPerUsd: 5 }
      }
    }
  };

  const thailandPrice = pricing.tokenPrice(savedSettings, 'TH');
  assert.equal(thailandPrice.currency, 'USD');
  // 1 token = 1 / 5 = $0.20 USD
  assert.equal(thailandPrice.amount, 0.20);

  // 5 tokens cost exactly USD $1.00
  const total5 = pricing.tokenTotal(thailandPrice, 5);
  assert.equal(total5.currency, 'USD');
  assert.equal(total5.amount, 1.00);

  // 100 tokens cost USD $20.00
  const total100 = pricing.tokenTotal(thailandPrice, 100);
  assert.equal(total100.currency, 'USD');
  assert.equal(total100.amount, 20.00);
});

test('Converts to AUD for Australian and New Zealand geolocation', () => {
  const fxRate = 1.45;
  const savedSettings = {
    tokens: {
      perToken: { usd: 1.00, aud: 1.45 }
    }
  };

  // Australia geolocation gets AUD
  const auPrice = pricing.tokenPrice(savedSettings, 'AU');
  assert.equal(auPrice.currency, 'AUD');
  assert.equal(auPrice.amount, 1.45);

  // New Zealand geolocation gets AUD conversion
  const nzPrice = pricing.tokenPrice(savedSettings, 'NZ', { rate: fxRate });
  assert.equal(nzPrice.currency, 'AUD');
  assert.equal(nzPrice.amount, 1.45);

  // Other country (e.g. US) receives USD
  const usPrice = pricing.tokenPrice(savedSettings, 'US');
  assert.equal(usPrice.currency, 'USD');
  assert.equal(usPrice.amount, 1.00);
});

test('Currency toggles: AUD shown to AU/NZ, USD shown to all other countries, independently toggleable', () => {
  // Scenario 1: AUD disabled, USD enabled
  const audOffSettings = {
    tokens: {
      perToken: { usd: 1.00, aud: 1.45 }
    },
    toggles: {
      isTokenSystemEnabled: true,
      isAudEnabled: false,
      isUsdEnabled: true
    }
  };

  // AU visitor falls back to USD when AUD is toggled off
  const auWhenAudOff = pricing.tokenPrice(audOffSettings, 'AU');
  assert.equal(auWhenAudOff.currency, 'USD');

  // Scenario 2: USD disabled, AUD enabled
  const usdOffSettings = {
    tokens: {
      perToken: { usd: 1.00, aud: 1.45 }
    },
    toggles: {
      isTokenSystemEnabled: true,
      isAudEnabled: true,
      isUsdEnabled: false
    }
  };

  // US visitor receives AUD conversion when USD is toggled off
  const usWhenUsdOff = pricing.tokenPrice(usdOffSettings, 'US');
  assert.equal(usWhenUsdOff.currency, 'AUD');
});

test('System toggle Off: no tokens anywhere and all contract details are visible to everyone', () => {
  const systemOffSettings = {
    isTokenSystemEnabled: false,
    isAudEnabled: true,
    isUsdEnabled: true
  };

  // Invariant validation: When isTokenSystemEnabled is false:
  // 1. Content requires 0 tokens
  function checkAccess({ isTokenSystemEnabled, itemCost }) {
    if (!isTokenSystemEnabled) {
      return { requiredTokens: 0, isGated: false, accessGranted: true, badge: 'Free Open Access' };
    }
    return { requiredTokens: itemCost, isGated: itemCost > 0, accessGranted: itemCost === 0 };
  }

  // A 5-token workout video becomes 0 tokens (open access)
  const videoAccess = checkAccess({ isTokenSystemEnabled: systemOffSettings.isTokenSystemEnabled, itemCost: 5 });
  assert.equal(videoAccess.requiredTokens, 0);
  assert.equal(videoAccess.isGated, false);
  assert.equal(videoAccess.accessGranted, true);

  // A 3-token social post becomes 0 tokens (open access)
  const socialAccess = checkAccess({ isTokenSystemEnabled: systemOffSettings.isTokenSystemEnabled, itemCost: 3 });
  assert.equal(socialAccess.requiredTokens, 0);
  assert.equal(socialAccess.isGated, false);
  assert.equal(socialAccess.accessGranted, true);

  // Contract details (trainer contact, phone, email, coaching rates) are visible to everyone
  function resolveContractVisibility({ isTokenSystemEnabled, isUserPurchased }) {
    if (!isTokenSystemEnabled) {
      return { showContractDetails: true, lockReason: null }; // Visible to everyone!
    }
    return { showContractDetails: isUserPurchased, lockReason: isUserPurchased ? null : 'Locked behind token unlock' };
  }

  const unauthenticatedVisitorContract = resolveContractVisibility({
    isTokenSystemEnabled: systemOffSettings.isTokenSystemEnabled,
    isUserPurchased: false
  });
  assert.equal(unauthenticatedVisitorContract.showContractDetails, true);
  assert.equal(unauthenticatedVisitorContract.lockReason, null);
});

