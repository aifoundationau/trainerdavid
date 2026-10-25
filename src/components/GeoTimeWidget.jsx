import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getTimezoneDetails, resolveClosestTimezone, getLiveTimezoneCatalog } from '../services/timezoneService';

// Default Australian regional baseline
const DEFAULT_SETTINGS = {
  suburb: 'Sydney',
  state: 'NSW',
  country: 'AU',
  lat: -33.8688,
  lon: 151.2093,
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '12h',
  timezone: 'Australia/Sydney',
  tempUnit: 'C'
};

const STORAGE_KEY = 'trainer_david_geo_time_settings';

// WMO Weather Interpretation Codes
const WEATHER_CODES = {
  0: { label: 'Clear', icon: '☀️' },
  1: { label: 'Mainly Clear', icon: '🌤️' },
  2: { label: 'Partly Cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Foggy', icon: '🌫️' },
  48: { label: 'Depositing Rime Fog', icon: '🌫️' },
  51: { label: 'Light Drizzle', icon: '🌦️' },
  53: { label: 'Moderate Drizzle', icon: '🌧️' },
  55: { label: 'Dense Drizzle', icon: '🌧️' },
  61: { label: 'Slight Rain', icon: '🌦️' },
  63: { label: 'Moderate Rain', icon: '🌧️' },
  65: { label: 'Heavy Rain', icon: '🌧️' },
  71: { label: 'Slight Snow', icon: '🌨️' },
  73: { label: 'Moderate Snow', icon: '❄️' },
  75: { label: 'Heavy Snow', icon: '❄️' },
  80: { label: 'Rain Showers', icon: '🌦️' },
  81: { label: 'Moderate Showers', icon: '🌧️' },
  82: { label: 'Violent Showers', icon: '⛈️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
  96: { label: 'Thunderstorm & Hail', icon: '⛈️' }
};

export default function GeoTimeWidget() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (_) {}
    return DEFAULT_SETTINGS;
  });

  const [isOpen, setIsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState({ temp: 22, code: 0, loading: true });
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [detectStatus, setDetectStatus] = useState('');

  // Form draft state for the popup modal
  const [draft, setDraft] = useState(settings);

  // Synchronize live clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch weather data for currently selected coordinates
  const fetchWeather = useCallback(async (lat, lon) => {
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`
      );
      if (!res.ok) throw new Error('Weather unavailable');
      const data = await res.json();
      if (data?.current) {
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          code: data.current.weather_code ?? 0,
          loading: false
        });
      }
    } catch (err) {
      // Graceful fallback
      setWeather(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchWeather(settings.lat, settings.lon);
    const interval = setInterval(() => fetchWeather(settings.lat, settings.lon), 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [settings.lat, settings.lon, fetchWeather]);

  // Open modal and sync draft
  const handleOpen = () => {
    setDraft({ ...settings });
    setDetectStatus('');
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setDetectStatus('');
  };

  // Close on Escape key
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  // Auto-detect browser location via HTML5 Geolocation + free reverse geocoding
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setDetectStatus('Geolocation not supported by browser.');
      return;
    }
    setDetectingLocation(true);
    setDetectStatus('Detecting closest suburb & coordinates...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await res.json();
          const detectedSuburb = data.locality || data.city || data.principalSubdivision || 'Local Area';
          const detectedState = data.principalSubdivisionCode || data.countryCode || '';
          
          // Resolve closest timezone taking daylight savings and coordinates into account
          const tzResolution = resolveClosestTimezone({
            lat: latitude,
            lon: longitude,
            suburb: detectedSuburb,
            state: detectedState,
            country: data.countryCode || 'AU',
            date: new Date()
          });

          setDraft(prev => ({
            ...prev,
            suburb: detectedSuburb,
            state: detectedState,
            lat: latitude,
            lon: longitude,
            timezone: tzResolution.timezone
          }));
          setDetectStatus(`Detected: ${detectedSuburb}, ${detectedState} • Timezone: ${tzResolution.timezone} (${tzResolution.description})`);
        } catch (err) {
          const tzResolution = resolveClosestTimezone({
            lat: latitude,
            lon: longitude,
            date: new Date()
          });
          setDraft(prev => ({
            ...prev,
            lat: latitude,
            lon: longitude,
            timezone: tzResolution.timezone
          }));
          setDetectStatus(`Coordinates detected. Closest Timezone: ${tzResolution.description}`);
        } finally {
          setDetectingLocation(false);
        }
      },
      (err) => {
        setDetectingLocation(false);
        setDetectStatus(`Location access denied or unavailable (${err.message}).`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Save settings from popup
  const handleSave = (e) => {
    e?.preventDefault();
    const sanitized = {
      ...draft,
      suburb: draft.suburb.trim() || 'Sydney',
      state: draft.state.trim().toUpperCase() || 'NSW'
    };
    setSettings(sanitized);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      window.dispatchEvent(new CustomEvent('geoTimeSettingsUpdated', { detail: sanitized }));
    } catch (_) {}
    fetchWeather(sanitized.lat, sanitized.lon);
    handleClose();
  };

  // Reset to default
  const handleReset = () => {
    setDraft({ ...DEFAULT_SETTINGS });
    setDetectStatus('Reset to default (Sydney, NSW). Click Save to apply.');
  };

  // Draft timezone details (evaluated dynamically against current clock)
  const draftTzDetails = useMemo(() => {
    return getTimezoneDetails(draft.timezone || 'Australia/Sydney', currentTime);
  }, [draft.timezone, currentTime]);

  const liveTimezoneCatalog = useMemo(() => {
    return getLiveTimezoneCatalog(currentTime);
  }, [currentTime]);

  // Format time and date string taking timezone and DST into account
  const formattedDisplay = useMemo(() => {
    try {
      const tz = settings.timezone || 'Australia/Sydney';
      const tzDetails = getTimezoneDetails(tz, currentTime);
      
      // Time string
      const timeOptions = {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: settings.timeFormat === '12h'
      };
      const timeStr = new Intl.DateTimeFormat('en-AU', timeOptions).format(currentTime);

      // Date string
      const dateParts = new Intl.DateTimeFormat('en-AU', {
        timeZone: tz,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).formatToParts(currentTime);

      const d = dateParts.find(p => p.type === 'day')?.value || '01';
      const m = dateParts.find(p => p.type === 'month')?.value || '01';
      const y = dateParts.find(p => p.type === 'year')?.value || '2026';

      let dateStr = `${d}/${m}/${y}`;
      if (settings.dateFormat === 'MM/DD/YYYY') dateStr = `${m}/${d}/${y}`;
      if (settings.dateFormat === 'YYYY-MM-DD') dateStr = `${y}-${m}-${d}`;

      // Temperature conversion
      let displayTemp = `${weather.temp}°C`;
      if (settings.tempUnit === 'F') {
        displayTemp = `${Math.round((weather.temp * 9) / 5 + 32)}°F`;
      }

      const weatherObj = WEATHER_CODES[weather.code] || WEATHER_CODES[0];

      return {
        suburbText: `${settings.suburb}${settings.state ? `, ${settings.state}` : ''}`,
        weatherText: `${weatherObj.icon} ${displayTemp}`,
        weatherLabel: weatherObj.label,
        timeText: timeStr,
        dateText: dateStr,
        tzDetails,
        timeZoneBadge: `${tzDetails.shortName} (${tzDetails.utcFormatted})`,
        isDstActive: tzDetails.isDstActive
      };
    } catch (_) {
      return {
        suburbText: 'Sydney, NSW',
        weatherText: '☀️ 22°C',
        weatherLabel: 'Clear',
        timeText: currentTime.toLocaleTimeString(),
        dateText: currentTime.toLocaleDateString(),
        tzDetails: null,
        timeZoneBadge: 'UTC',
        isDstActive: false
      };
    }
  }, [settings, currentTime, weather]);


  return (
    <>
      {/* ======================================================== */}
      {/* 1. THIN GEOLOCATION, WEATHER & TIME FOOTER BUTTON BAR    */}
      {/* ======================================================== */}
      <div 
        style={{
          position: 'fixed',
          bottom: '8px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 990,
          pointerEvents: 'auto',
          maxWidth: 'calc(100vw - 20px)'
        }}
      >
        <button
          type="button"
          onClick={handleOpen}
          id="geo-time-widget-btn"
          data-agent-id="geo-time-widget-btn"
          data-testid="geo-time-widget-btn"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-label={`Location: ${formattedDisplay.suburbText}. Weather: ${formattedDisplay.weatherText}. Current time: ${formattedDisplay.timeText}. Click to configure regional formats.`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.65rem',
            height: '28px',
            padding: '0 12px',
            background: 'rgba(8, 12, 16, 0.92)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 107, 0, 0.35)',
            borderRadius: '9999px',
            color: '#e2e8f0',
            fontSize: '0.74rem',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6), 0 0 10px rgba(255, 107, 0, 0.12)',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
            lineHeight: 1
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#ff6b00';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.7), 0 0 16px rgba(255, 107, 0, 0.35)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 107, 0, 0.35)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.6), 0 0 10px rgba(255, 107, 0, 0.12)';
            e.currentTarget.style.transform = 'none';
          }}
        >
          {/* Suburb & State */}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#ff9e40' }}>
            <span style={{ fontSize: '0.82rem' }}>📍</span>
            <span style={{ fontWeight: 700 }}>{formattedDisplay.suburbText}</span>
          </span>

          <span style={{ color: 'rgba(255, 255, 255, 0.25)', fontSize: '0.7rem' }}>•</span>

          {/* Weather */}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#38bdf8' }} title={formattedDisplay.weatherLabel}>
            <span>{formattedDisplay.weatherText}</span>
          </span>

          <span style={{ color: 'rgba(255, 255, 255, 0.25)', fontSize: '0.7rem' }}>•</span>

          {/* Current Time with Timezone & Daylight Savings */}
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: '#a3e635', fontFamily: 'monospace' }}
            title={formattedDisplay.tzDetails?.description || 'Time'}
          >
            <span>🕒</span>
            <span>{formattedDisplay.timeText}</span>
            <span style={{ fontSize: '0.66rem', color: '#86efac', fontWeight: 700, marginLeft: '2px' }}>
              {formattedDisplay.tzDetails?.shortName || ''}
            </span>
            <span style={{ fontSize: '0.62rem', color: '#cbd5e1', marginLeft: '1px' }}>
              ({formattedDisplay.tzDetails?.utcFormatted || 'UTC'})
            </span>
            {formattedDisplay.isDstActive && (
              <span title="Daylight Savings Time Active" style={{ fontSize: '0.68rem', color: '#f59e0b', marginLeft: '1px' }}>☀️</span>
            )}
          </span>

          <span style={{ color: 'rgba(255, 255, 255, 0.25)', fontSize: '0.7rem' }}>•</span>

          {/* Settings Indicator Icon */}
          <span style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.78rem' }} title="Configure date, time & location formats">
            ⚙️
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 2. CENTERED POPUP MODAL (RESPONSIVE, STRICT NO SCROLLBAR) */}
      {/* ======================================================== */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="geo-settings-title"
          data-agent-id="geo-time-modal"
          data-testid="geo-time-modal"
          onClick={handleClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 6, 10, 0.82)',
            backdropFilter: 'blur(10px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(94vw, 470px)',
              background: '#090d13',
              border: '1px solid rgba(255, 107, 0, 0.45)',
              borderRadius: '20px',
              boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.9), 0 0 35px rgba(255, 107, 0, 0.2)',
              overflow: 'hidden', /* Strict directive: no scrollbar */
              display: 'flex',
              flexDirection: 'column',
              color: '#f8fafc',
              animation: 'scaleUp 0.2s ease-out'
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '1rem 1.25rem 0.85rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(180deg, rgba(255, 107, 0, 0.1) 0%, transparent 100%)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, rgba(255, 107, 0, 0.25) 0%, rgba(255, 138, 0, 0.1) 100%)',
                  border: '1px solid rgba(255, 107, 0, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem'
                }}>
                  📍
                </div>
                <div>
                  <h2 id="geo-settings-title" style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading, inherit)' }}>
                    Regional, Weather & Time Settings
                  </h2>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    Configure local suburb, timezones, and display formats
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                data-agent-id="geo-close-btn"
                data-testid="geo-close-btn"
                aria-label="Close settings popup"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1.25rem',
                  lineHeight: 1,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
              >
                &times;
              </button>
            </div>

            {/* Modal Body: Compact form (no scrollbar) */}
            <form onSubmit={handleSave} style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              
              {/* Field 1: Suburb & State + Detect Button */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label htmlFor="geo-suburb-input" style={{ fontSize: '0.76rem', fontWeight: 700, color: '#ff9e40', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Closest Suburb & State
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={detectingLocation}
                    data-agent-id="geo-detect-btn"
                    data-testid="geo-detect-btn"
                    style={{
                      background: 'rgba(255, 107, 0, 0.15)',
                      border: '1px solid rgba(255, 107, 0, 0.35)',
                      color: '#ff9e40',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: detectingLocation ? 'wait' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <span>🛰️</span>
                    <span>{detectingLocation ? 'Detecting...' : 'Auto-Detect GPS'}</span>
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem' }}>
                  <input
                    type="text"
                    id="geo-suburb-input"
                    data-agent-id="geo-suburb-input"
                    data-testid="geo-suburb-input"
                    value={draft.suburb}
                    placeholder="Suburb / Town (e.g. Bondi)"
                    onChange={(e) => setDraft({ ...draft, suburb: e.target.value })}
                    style={{
                      background: '#04070a',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.82rem',
                      color: '#fff',
                      outline: 'none'
                    }}
                  />
                  <input
                    type="text"
                    id="geo-state-input"
                    data-agent-id="geo-state-input"
                    data-testid="geo-state-input"
                    value={draft.state}
                    placeholder="State (NSW)"
                    maxLength={6}
                    onChange={(e) => {
                      const cleanState = e.target.value.toUpperCase();
                      const tzRes = resolveClosestTimezone({
                        lat: draft.lat,
                        lon: draft.lon,
                        suburb: draft.suburb,
                        state: cleanState,
                        country: draft.country || 'AU',
                        date: currentTime
                      });
                      setDraft(prev => ({
                        ...prev,
                        state: cleanState,
                        timezone: tzRes.timezone
                      }));
                    }}
                    style={{
                      background: '#04070a',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.82rem',
                      color: '#fff',
                      outline: 'none',
                      textAlign: 'center'
                    }}
                  />
                </div>

                {/* Quick Suburb Chips with Timezone Awareness */}
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.35rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Quick:</span>
                  {[
                    { suburb: 'Robina', state: 'QLD', lat: -28.0718, lon: 153.3824 },
                    { suburb: 'Summer Hill', state: 'NSW', lat: -33.8917, lon: 151.1378 },
                    { suburb: 'Melbourne', state: 'VIC', lat: -37.8136, lon: 144.9631 },
                    { suburb: 'Adelaide', state: 'SA', lat: -34.9285, lon: 138.6007 },
                    { suburb: 'Perth', state: 'WA', lat: -31.9505, lon: 115.8605 }
                  ].map(place => (
                    <button
                      key={place.suburb}
                      type="button"
                      onClick={() => {
                        const tzRes = resolveClosestTimezone({
                          lat: place.lat,
                          lon: place.lon,
                          suburb: place.suburb,
                          state: place.state,
                          date: currentTime
                        });
                        setDraft(prev => ({
                          ...prev,
                          suburb: place.suburb,
                          state: place.state,
                          lat: place.lat,
                          lon: place.lon,
                          timezone: tzRes.timezone
                        }));
                        setDetectStatus(`Selected ${place.suburb}, ${place.state} • ${tzRes.description}`);
                      }}
                      style={{
                        fontSize: '0.65rem',
                        padding: '2px 6px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        color: '#e2e8f0',
                        cursor: 'pointer'
                      }}
                    >
                      {place.suburb}, {place.state}
                    </button>
                  ))}
                </div>

                {detectStatus && (
                  <div style={{ fontSize: '0.68rem', color: '#38bdf8', marginTop: '0.3rem', fontFamily: 'monospace' }}>
                    {detectStatus}
                  </div>
                )}
              </div>

              {/* Field 2: Date & Time Formats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label htmlFor="geo-date-format-select" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '0.3rem' }}>
                    Date Format
                  </label>
                  <select
                    id="geo-date-format-select"
                    data-agent-id="geo-date-format-select"
                    data-testid="geo-date-format-select"
                    value={draft.dateFormat}
                    onChange={(e) => setDraft({ ...draft, dateFormat: e.target.value })}
                    style={{
                      width: '100%',
                      background: '#04070a',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '0.45rem 0.6rem',
                      fontSize: '0.78rem',
                      color: '#fff',
                      outline: 'none'
                    }}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (AU/UK)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="geo-time-format-select" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '0.3rem' }}>
                    Time Clock
                  </label>
                  <select
                    id="geo-time-format-select"
                    data-agent-id="geo-time-format-select"
                    data-testid="geo-time-format-select"
                    value={draft.timeFormat}
                    onChange={(e) => setDraft({ ...draft, timeFormat: e.target.value })}
                    style={{
                      width: '100%',
                      background: '#04070a',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '0.45rem 0.6rem',
                      fontSize: '0.78rem',
                      color: '#fff',
                      outline: 'none'
                    }}
                  >
                    <option value="12h">12-Hour (AM / PM)</option>
                    <option value="24h">24-Hour (Military)</option>
                  </select>
                </div>
              </div>

              {/* Field 3: Timezone & Temperature Unit */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.65rem' }}>
                <div>
                  <label htmlFor="geo-timezone-select" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '0.3rem' }}>
                    Active Timezone (with Daylight Savings)
                  </label>
                  <select
                    id="geo-timezone-select"
                    data-agent-id="geo-timezone-select"
                    data-testid="geo-timezone-select"
                    value={draft.timezone}
                    onChange={(e) => setDraft({ ...draft, timezone: e.target.value })}
                    style={{
                      width: '100%',
                      background: '#04070a',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '0.45rem 0.6rem',
                      fontSize: '0.78rem',
                      color: '#fff',
                      outline: 'none'
                    }}
                  >
                    {liveTimezoneCatalog.map(group => (
                      <optgroup key={group.group} label={group.group}>
                        {group.options.map(opt => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {draftTzDetails && (
                    <div style={{
                      marginTop: '0.3rem',
                      fontSize: '0.68rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      color: draftTzDetails.isDstActive ? '#f59e0b' : '#38bdf8'
                    }}>
                      <span>{draftTzDetails.isDstActive ? '☀️' : '🌐'}</span>
                      <span style={{ fontWeight: 600 }}>{draftTzDetails.description}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="geo-temp-unit-select" style={{ fontSize: '0.72rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '0.3rem' }}>
                    Temp Unit
                  </label>
                  <select
                    id="geo-temp-unit-select"
                    data-agent-id="geo-temp-unit-select"
                    data-testid="geo-temp-unit-select"
                    value={draft.tempUnit}
                    onChange={(e) => setDraft({ ...draft, tempUnit: e.target.value })}
                    style={{
                      width: '100%',
                      background: '#04070a',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '8px',
                      padding: '0.45rem 0.6rem',
                      fontSize: '0.78rem',
                      color: '#fff',
                      outline: 'none'
                    }}
                  >
                    <option value="C">°C (Celsius)</option>
                    <option value="F">°F (Fahrenheit)</option>
                  </select>
                </div>
              </div>

              {/* Live Preview Box */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: '10px',
                  padding: '0.6rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.74rem'
                }}
              >
                <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <span>Preview: </span>
                  <strong style={{ color: '#ff9e40' }}>{draft.suburb}, {draft.state}</strong>
                  {draftTzDetails && (
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: draftTzDetails.isDstActive ? 'rgba(245, 158, 11, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                      color: draftTzDetails.isDstActive ? '#f59e0b' : '#38bdf8',
                      border: `1px solid ${draftTzDetails.isDstActive ? 'rgba(245, 158, 11, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`
                    }}>
                      {draftTzDetails.shortName} • {draftTzDetails.utcFormatted} {draftTzDetails.isDstActive ? '(☀️ DST)' : '(No DST)'}
                    </span>
                  )}
                </div>
                <div style={{ color: '#a3e635', fontFamily: 'monospace', fontWeight: 700 }}>
                  {formattedDisplay.timeText} &bull; {formattedDisplay.dateText}
                </div>
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.35rem' }}>
                <button
                  type="button"
                  onClick={handleReset}
                  data-agent-id="geo-reset-btn"
                  data-testid="geo-reset-btn"
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#94a3b8',
                    borderRadius: '8px',
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Reset
                </button>
                <button
                  type="submit"
                  data-agent-id="geo-save-btn"
                  data-testid="geo-save-btn"
                  style={{
                    background: 'linear-gradient(135deg, #ff6b00 0%, #ff8a00 100%)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '0.45rem 1.1rem',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(255, 107, 0, 0.35)',
                    transition: 'transform 0.1s'
                  }}
                  onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
                  onMouseUp={(e) => (e.currentTarget.style.transform = 'none')}
                >
                  Save Preferences
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
