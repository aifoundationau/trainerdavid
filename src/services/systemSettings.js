// System Settings Service: Universal Token Pricing, Geolocated Country Rates, and Currency Toggles
import { callApi } from './tokenApi';

const STORAGE_KEY = 'trainer_david_system_settings';

export const COUNTRY_CATALOG = [
  { code: 'KH', name: 'Cambodia', flag: '🇰🇭', defaultTokens: 10 },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', defaultTokens: 5 },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', defaultTokens: 1 },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', defaultTokens: 1 },
  { code: 'US', name: 'United States', flag: '🇺🇸', defaultTokens: 1 },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', defaultTokens: 1 },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', defaultTokens: 1 },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', defaultTokens: 10 },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', defaultTokens: 10 },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', defaultTokens: 10 },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', defaultTokens: 4 },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', defaultTokens: 1 },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', defaultTokens: 1 },
  { code: 'IN', name: 'India', flag: '🇮🇳', defaultTokens: 10 },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', defaultTokens: 1 },
  { code: 'FR', name: 'France', flag: '🇫🇷', defaultTokens: 1 },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', defaultTokens: 5 },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', defaultTokens: 5 },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', defaultTokens: 5 }
];

export const DEFAULT_SYSTEM_SETTINGS = {
  isTokenSystemEnabled: true,
  isAudEnabled: true,
  isUsdEnabled: true,
  defaultTokenPriceUsd: 1.00,
  countryTokenRates: {
    KH: { country: 'Cambodia', code: 'KH', tokensPerUsd: 10, flag: '🇰🇭' },
    TH: { country: 'Thailand', code: 'TH', tokensPerUsd: 5, flag: '🇹🇭' }
  }
};

/**
 * Retrieve cached system settings from local storage or default fallback
 */
export function getLocalSystemSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SYSTEM_SETTINGS,
        ...parsed,
        countryTokenRates: {
          ...DEFAULT_SYSTEM_SETTINGS.countryTokenRates,
          ...(parsed.countryTokenRates || {})
        }
      };
    }
  } catch (_) {}
  return DEFAULT_SYSTEM_SETTINGS;
}

/**
 * Detect visitor country from GeoTimeWidget storage or browser timezone
 */
export function getDetectedVisitorCountry() {
  try {
    const geoRaw = localStorage.getItem('trainer_david_geo_time_settings');
    if (geoRaw) {
      const parsed = JSON.parse(geoRaw);
      if (parsed.country && /^[A-Z]{2}$/i.test(parsed.country)) {
        return parsed.country.toUpperCase();
      }
    }
  } catch (_) {}

  // Fallback to timezone inference
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.startsWith('Australia/')) return 'AU';
    if (tz.includes('Auckland') || tz.includes('Chatham')) return 'NZ';
    if (tz.includes('Phnom_Penh')) return 'KH';
    if (tz.includes('Bangkok')) return 'TH';
    if (tz.startsWith('America/')) return 'US';
    if (tz.startsWith('Europe/London')) return 'GB';
  } catch (_) {}

  return 'AU';
}

/**
 * Determine effective currency for visitor:
 * - AUD only for Australia and New Zealand (if isAudEnabled)
 * - USD for all other countries (if isUsdEnabled)
 */
export function getEffectiveCurrency(countryCode, settings = null) {
  const current = settings || getLocalSystemSettings();
  const code = String(countryCode || getDetectedVisitorCountry()).toUpperCase();
  const isAuNz = code === 'AU' || code === 'NZ';

  if (isAuNz) {
    if (current.isAudEnabled) return 'AUD';
    if (current.isUsdEnabled) return 'USD';
    return null;
  }

  // All other countries
  if (current.isUsdEnabled) return 'USD';
  if (current.isAudEnabled) return 'AUD';
  return null;
}

/**
 * Calculate token cost and exchange rate for visitor
 */
export function calculateVisitorTokenPrice(countryCode, settings = null, fxRate = 1.43) {
  const current = settings || getLocalSystemSettings();
  const code = String(countryCode || getDetectedVisitorCountry()).toUpperCase();
  const currency = getEffectiveCurrency(code, current);

  // Check country rate override (e.g. 1 USD = 10 Tokens for Cambodia, 5 Tokens for Thailand)
  let tokensPerUsd = 1;
  const rateConfig = current.countryTokenRates && current.countryTokenRates[code];
  if (rateConfig && Number(rateConfig.tokensPerUsd) > 0) {
    tokensPerUsd = Number(rateConfig.tokensPerUsd);
  }

  const baseUsd = current.defaultTokenPriceUsd || 1.00;
  // USD price for 1 token:
  const unitUsd = Math.round((baseUsd / tokensPerUsd) * 100) / 100;

  if (currency === 'AUD') {
    const unitAud = Math.round((unitUsd * fxRate) * 100) / 100;
    return {
      currency: 'AUD',
      unitPrice: unitAud,
      tokensPerUsd,
      country: code,
      isTokenSystemEnabled: current.isTokenSystemEnabled
    };
  }

  return {
    currency: currency || 'USD',
    unitPrice: unitUsd,
    tokensPerUsd,
    country: code,
    isTokenSystemEnabled: current.isTokenSystemEnabled
  };
}

/**
 * Fetch settings from server
 */
export async function fetchSystemSettings() {
  try {
    const res = await callApi('/api/tokens/pricing-settings');
    if (res) {
      const merged = {
        isTokenSystemEnabled: res.toggles?.isTokenSystemEnabled !== false,
        isAudEnabled: res.toggles?.isAudEnabled !== false,
        isUsdEnabled: res.toggles?.isUsdEnabled !== false,
        defaultTokenPriceUsd: Number(res.usd) || 1.00,
        countryTokenRates: res.countryRates || DEFAULT_SYSTEM_SETTINGS.countryTokenRates
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent('systemSettingsUpdated', { detail: merged }));
      return merged;
    }
  } catch (err) {
    // Non-superadmin fallback to public endpoint
    try {
      const pubRes = await fetch('/api/tokens/public-pricing');
      if (pubRes.ok) {
        const pubData = await pubRes.json();
        const merged = {
          isTokenSystemEnabled: pubData.toggles?.isTokenSystemEnabled !== false,
          isAudEnabled: pubData.toggles?.isAudEnabled !== false,
          isUsdEnabled: pubData.toggles?.isUsdEnabled !== false,
          defaultTokenPriceUsd: Number(pubData.price?.amount) || 1.00,
          countryTokenRates: pubData.countryRates || DEFAULT_SYSTEM_SETTINGS.countryTokenRates
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        window.dispatchEvent(new CustomEvent('systemSettingsUpdated', { detail: merged }));
        return merged;
      }
    } catch (_) {}
  }
  return getLocalSystemSettings();
}

/**
 * Save updated settings as SuperAdmin
 */
export async function saveSystemSettings(updatedSettings) {
  const sanitized = {
    usd: Number(updatedSettings.defaultTokenPriceUsd) || 1.00,
    countryRates: updatedSettings.countryTokenRates || {},
    toggles: {
      isTokenSystemEnabled: updatedSettings.isTokenSystemEnabled !== false,
      isAudEnabled: updatedSettings.isAudEnabled !== false,
      isUsdEnabled: updatedSettings.isUsdEnabled !== false
    }
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...updatedSettings,
    ...sanitized.toggles,
    defaultTokenPriceUsd: sanitized.usd,
    countryTokenRates: sanitized.countryRates
  }));

  window.dispatchEvent(new CustomEvent('systemSettingsUpdated', { detail: updatedSettings }));

  return callApi('/api/tokens/pricing-settings', {
    method: 'PUT',
    body: sanitized
  });
}

