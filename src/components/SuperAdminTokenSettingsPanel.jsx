import React, { useState, useEffect } from 'react';
import { 
  COUNTRY_CATALOG, 
  DEFAULT_SYSTEM_SETTINGS, 
  getLocalSystemSettings, 
  getDetectedVisitorCountry, 
  saveSystemSettings,
  fetchSystemSettings,
  calculateVisitorTokenPrice
} from '../services/systemSettings';
import { Coins, Globe, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Trash2, Plus } from './Icons';

export default function SuperAdminTokenSettingsPanel({ isSuperAdmin, onToast }) {
  const [settings, setSettings] = useState(getLocalSystemSettings);
  const [selectedCountryCode, setSelectedCountryCode] = useState('KH');
  const [customTokensPerUsd, setCustomTokensPerUsd] = useState('10');
  const [basePriceInput, setBasePriceInput] = useState('1.00');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  const [visitorCountry, setVisitorCountry] = useState(getDetectedVisitorCountry);

  // Sync settings from server
  useEffect(() => {
    fetchSystemSettings().then(fetched => {
      if (fetched) {
        setSettings(fetched);
        setBasePriceInput(Number(fetched.defaultTokenPriceUsd || 1.00).toFixed(2));
      }
    });

    const handleUpdate = (e) => {
      if (e.detail) {
        setSettings(e.detail);
        if (e.detail.defaultTokenPriceUsd) {
          setBasePriceInput(Number(e.detail.defaultTokenPriceUsd).toFixed(2));
        }
      }
    };
    const handleGeo = (e) => {
      if (e.detail?.country) {
        setVisitorCountry(e.detail.country.toUpperCase());
      }
    };

    window.addEventListener('systemSettingsUpdated', handleUpdate);
    window.addEventListener('geoTimeSettingsUpdated', handleGeo);
    return () => {
      window.removeEventListener('systemSettingsUpdated', handleUpdate);
      window.removeEventListener('geoTimeSettingsUpdated', handleGeo);
    };
  }, []);

  if (!isSuperAdmin) return null;

  const handleToggle = (key) => {
    const nextVal = !settings[key];
    const updated = {
      ...settings,
      [key]: nextVal
    };
    setSettings(updated);
    persistSettings(updated);
  };

  const handleBasePriceChange = (e) => {
    setBasePriceInput(e.target.value);
  };

  const handleSaveBasePrice = () => {
    const parsed = parseFloat(basePriceInput);
    if (isNaN(parsed) || parsed <= 0) {
      setSaveError('Please enter a valid base USD price greater than 0.');
      return;
    }
    const updated = {
      ...settings,
      defaultTokenPriceUsd: Math.round(parsed * 100) / 100
    };
    setSettings(updated);
    persistSettings(updated);
  };

  const handleResetBasePrice = () => {
    setBasePriceInput('1.00');
    const updated = {
      ...settings,
      defaultTokenPriceUsd: 1.00
    };
    setSettings(updated);
    persistSettings(updated);
  };

  const handleAddCountryRate = (e) => {
    e.preventDefault();
    const tokens = parseInt(customTokensPerUsd, 10);
    if (isNaN(tokens) || tokens <= 0) {
      setSaveError('Please enter a positive whole number of tokens for USD $1.');
      return;
    }
    const countryMeta = COUNTRY_CATALOG.find(c => c.code === selectedCountryCode);
    const countryName = countryMeta ? countryMeta.name : selectedCountryCode;
    const countryFlag = countryMeta ? countryMeta.flag : '🌐';

    const updatedRates = {
      ...(settings.countryTokenRates || {}),
      [selectedCountryCode]: {
        country: countryName,
        code: selectedCountryCode,
        tokensPerUsd: tokens,
        flag: countryFlag
      }
    };

    const updated = {
      ...settings,
      countryTokenRates: updatedRates
    };
    setSettings(updated);
    persistSettings(updated, `Added rate for ${countryName}: USD $1 = ${tokens} Tokens`);
  };

  const handleRemoveCountryRate = (code, countryName) => {
    const updatedRates = { ...(settings.countryTokenRates || {}) };
    delete updatedRates[code];

    const updated = {
      ...settings,
      countryTokenRates: updatedRates
    };
    setSettings(updated);
    persistSettings(updated, `Removed custom token rate for ${countryName || code}`);
  };

  const persistSettings = async (nextSettings, customSuccessMsg = '') => {
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      await saveSystemSettings(nextSettings);
      const msg = customSuccessMsg || 'SuperAdmin token and currency settings saved!';
      setSaveSuccess(msg);
      if (onToast) onToast(msg);
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err) {
      setSaveError(err.message || 'Failed to persist settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const activePricing = calculateVisitorTokenPrice(visitorCountry, settings);
  const activeCountryRates = Object.entries(settings.countryTokenRates || {});

  return (
    <div 
      className="glass-panel"
      data-agent-id="superadmin-token-settings-panel"
      data-testid="superadmin-token-settings-panel"
      style={{
        padding: '1.75rem',
        borderRadius: '18px',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        background: 'linear-gradient(135deg, rgba(20, 24, 38, 0.95) 0%, rgba(13, 16, 26, 0.98) 100%)',
        marginBottom: '2rem',
        boxShadow: '0 12px 32px rgba(0,0,0,0.45)'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="badge badge-red" style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem' }}>
              👑 SuperAdmin Controls
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#fff', margin: 0 }}>
              Token Pricing, Geolocated Country Overrides & Currencies
            </h2>
          </div>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0', maxWidth: '780px' }}>
            Configure base USD token price, country-specific geolocated token quantities (e.g. USD $1 = 10 Tokens for Cambodia), AUD/USD display rules, and global token system toggles.
          </p>
        </div>

        {/* Live Visitor Geolocation Badge */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
          padding: '0.6rem 0.9rem',
          fontSize: '0.8rem',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Globe size={16} color="var(--accent-lime)" />
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Detected Geolocation:</div>
            <strong style={{ color: 'var(--accent-lime)' }}>{visitorCountry}</strong> • Currency: <strong>{activePricing.currency}</strong>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid #22c55e', color: '#22c55e', padding: '0.65rem 1rem', borderRadius: '10px', fontSize: '0.84rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.65rem 1rem', borderRadius: '10px', fontSize: '0.84rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} />
          <span>{saveError}</span>
        </div>
      )}

      {/* Grid: 3 Main Control Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        
        {/* CARD 1: SYSTEM TOGGLES */}
        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <ShieldCheck size={16} color="var(--accent-orange)" />
            System Toggles
          </h3>

          {/* Toggle 1: isTokenSystemEnabled */}
          <div style={{ marginBottom: '1rem', paddingBottom: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>Token System Master</span>
              <button
                type="button"
                role="switch"
                aria-checked={settings.isTokenSystemEnabled}
                aria-label="Toggle Token System"
                data-agent-id="toggle-token-system"
                data-testid="toggle-token-system"
                onClick={() => handleToggle('isTokenSystemEnabled')}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '20px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: settings.isTokenSystemEnabled ? 'var(--accent-lime)' : 'rgba(239, 68, 68, 0.25)',
                  color: settings.isTokenSystemEnabled ? '#000' : '#f87171',
                  transition: 'all 0.2s'
                }}
              >
                {settings.isTokenSystemEnabled ? 'ON (Tokens Active)' : 'OFF (Open Access)'}
              </button>
            </div>
            <div style={{ fontSize: '0.76rem', color: settings.isTokenSystemEnabled ? 'var(--text-muted)' : '#f59e0b' }}>
              {settings.isTokenSystemEnabled 
                ? 'Videos, social posts, and direct messaging require token unlocks or creator rates.'
                : '⚡ OFF: No tokens anywhere and all contract/contact details are visible to everyone.'}
            </div>
          </div>

          {/* Toggle 2: isAudEnabled */}
          <div style={{ marginBottom: '1rem', paddingBottom: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>AUD Currency (AU & NZ)</span>
              <button
                type="button"
                role="switch"
                aria-checked={settings.isAudEnabled}
                aria-label="Toggle AUD Currency"
                data-agent-id="toggle-aud-currency"
                data-testid="toggle-aud-currency"
                onClick={() => handleToggle('isAudEnabled')}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '20px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: settings.isAudEnabled ? 'var(--accent-orange)' : 'rgba(255, 255, 255, 0.1)',
                  color: settings.isAudEnabled ? '#fff' : 'var(--text-secondary)'
                }}
              >
                {settings.isAudEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Shown only to visitors located in Australia and New Zealand via geolocation.
            </div>
          </div>

          {/* Toggle 3: isUsdEnabled */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>USD Currency (Global)</span>
              <button
                type="button"
                role="switch"
                aria-checked={settings.isUsdEnabled}
                aria-label="Toggle USD Currency"
                data-agent-id="toggle-usd-currency"
                data-testid="toggle-usd-currency"
                onClick={() => handleToggle('isUsdEnabled')}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '20px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: settings.isUsdEnabled ? 'var(--accent-orange)' : 'rgba(255, 255, 255, 0.1)',
                  color: settings.isUsdEnabled ? '#fff' : 'var(--text-secondary)'
                }}
              >
                {settings.isUsdEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Shown to all other countries other than Australia and New Zealand.
            </div>
          </div>
        </div>

        {/* CARD 2: DEFAULT TOKEN PRICE BASELINE */}
        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Coins size={16} color="#f59e0b" />
            Universal Base Token Price
          </h3>

          <div style={{ marginBottom: '1.1rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Default Price per Token (USD)
            </label>
            {/* Integrated single-line input: USD $ and amount box */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0 0.85rem',
              marginBottom: '0.65rem',
              height: '44px',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <span style={{
                color: '#f59e0b',
                fontWeight: 800,
                fontSize: '0.95rem',
                whiteSpace: 'nowrap',
                marginRight: '0.5rem',
                userSelect: 'none'
              }}>
                USD $
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={basePriceInput}
                onChange={handleBasePriceChange}
                data-agent-id="input-base-token-price"
                data-testid="input-base-token-price"
                aria-label="Default USD token price"
                placeholder="1.00"
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  padding: 0
                }}
              />
            </div>

            {/* Action buttons placed cleanly underneath */}
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
              <button
                type="button"
                onClick={handleSaveBasePrice}
                disabled={isSaving}
                className="btn-primary"
                data-agent-id="btn-save-base-token-price"
                data-testid="btn-save-base-token-price"
                style={{ flex: 1, padding: '0.55rem 0.9rem', fontSize: '0.85rem', justifyContent: 'center' }}
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleResetBasePrice}
                disabled={isSaving}
                className="btn-secondary"
                title="Reset to default USD $1.00"
                style={{ flex: 1, padding: '0.55rem 0.75rem', fontSize: '0.85rem', justifyContent: 'center' }}
              >
                Reset to $1.00
              </button>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
              Default baseline is <strong>USD $1.00 per token</strong>. This can be customized at any time.
            </div>
          </div>

          <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '10px', padding: '0.75rem 0.9rem', fontSize: '0.8rem' }}>
            <div style={{ color: '#f59e0b', fontWeight: 700, marginBottom: '0.2rem' }}>
              Live Australia & NZ Conversion:
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              1 Token = USD ${Number(settings.defaultTokenPriceUsd || 1).toFixed(2)} ≈ <strong>AUD ${(Number(settings.defaultTokenPriceUsd || 1) * 1.45).toFixed(2)}</strong> (live exchange conversion).
            </div>
          </div>
        </div>

        {/* CARD 3: ADD SPECIAL COUNTRY TOKEN AMOUNT */}
        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Plus size={16} color="var(--accent-lime)" />
            Add Country Rate Override
          </h3>

          <form onSubmit={handleAddCountryRate}>
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Select Country
              </label>
              <select
                value={selectedCountryCode}
                onChange={(e) => {
                  setSelectedCountryCode(e.target.value);
                  const matched = COUNTRY_CATALOG.find(c => c.code === e.target.value);
                  if (matched) setCustomTokensPerUsd(String(matched.defaultTokens));
                }}
                data-agent-id="select-country-override"
                data-testid="select-country-override"
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '8px',
                  background: '#121622',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                  fontSize: '0.88rem'
                }}
              >
                {COUNTRY_CATALOG.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.name} ({country.code})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Tokens for USD $1.00
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '0 0.85rem',
                height: '44px',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 700, whiteSpace: 'nowrap', marginRight: '0.5rem', userSelect: 'none' }}>
                  USD $1 =
                </span>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  step="1"
                  value={customTokensPerUsd}
                  onChange={(e) => setCustomTokensPerUsd(e.target.value)}
                  placeholder="e.g. 10"
                  required
                  data-agent-id="input-tokens-per-usd"
                  data-testid="input-tokens-per-usd"
                  aria-label="Tokens per USD $1"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    height: '100%',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 800,
                    padding: 0
                  }}
                />
                <span style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 700, marginLeft: '0.5rem', whiteSpace: 'nowrap', userSelect: 'none' }}>
                  Tokens
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary"
              data-agent-id="btn-add-country-rate"
              data-testid="btn-add-country-rate"
              style={{
                width: '100%',
                padding: '0.55rem',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem'
              }}
            >
              <Plus size={15} />
              <span>Set Country Token Amount</span>
            </button>
          </form>
        </div>
      </div>

      {/* Country Overrides Table */}
      <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '14px', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Active Geolocated Country Allocations ({activeCountryRates.length})
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0' }}>
              Visitors from these countries receive the customized token allocation automatically via IP & timezone geolocation.
            </p>
          </div>
        </div>

        {activeCountryRates.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
            No special country allocations configured. All countries use the default USD $1 = 1 Token baseline.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.85rem' }}>
            {activeCountryRates.map(([code, item]) => {
              const tokensPerUsd = item.tokensPerUsd || item.tokens || 1;
              const unitCostUsd = (1 / tokensPerUsd).toFixed(2);

              return (
                <div
                  key={code}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <span>{item.flag || '🌐'}</span>
                      <span>{item.country || code} ({code})</span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#f59e0b', fontWeight: 700, marginTop: '0.2rem' }}>
                      USD $1 = {tokensPerUsd} Tokens
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      (1 Token = ${unitCostUsd} USD • 100 Tokens = ${(100 / tokensPerUsd).toFixed(2)} USD)
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveCountryRate(code, item.country)}
                    data-agent-id={`btn-remove-country-${code.toLowerCase()}`}
                    data-testid={`btn-remove-country-${code.toLowerCase()}`}
                    aria-label={`Remove override for ${item.country || code}`}
                    title="Remove Country Override"
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#ef4444',
                      padding: '0.45rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

