// Timezone service with high-precision Daylight Savings Time (DST) detection and closest UTC time resolution.

/**
 * Calculates current live timezone details including UTC offset and DST status.
 * @param {string} timezoneId - IANA Timezone ID (e.g. 'Australia/Sydney', 'Australia/Brisbane')
 * @param {Date} date - Optional Date to evaluate (defaults to now)
 */
export function getTimezoneDetails(timezoneId, date = new Date()) {
  try {
    const getEpochInTz = (targetTz, d) => {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: targetTz,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hourCycle: 'h23'
      }).formatToParts(d);
      const val = (type) => parseInt(parts.find(p => p.type === type)?.value || '0', 10);
      return Date.UTC(val('year'), val('month') - 1, val('day'), val('hour'), val('minute'), val('second'));
    };

    const tzLocalAsUtc = getEpochInTz(timezoneId, date);
    const actualUtc = date.getTime();
    const offsetMinutes = Math.round((tzLocalAsUtc - actualUtc) / 60000);

    // Compute winter vs summer offsets to accurately detect DST
    // Southern Hemisphere winter is July (month 6); Northern Hemisphere winter is January (month 0).
    const janDate = new Date(date.getFullYear(), 0, 15);
    const julDate = new Date(date.getFullYear(), 6, 15);
    const janOffset = Math.round((getEpochInTz(timezoneId, janDate) - janDate.getTime()) / 60000);
    const julOffset = Math.round((getEpochInTz(timezoneId, julDate) - julDate.getTime()) / 60000);
    const minOffset = Math.min(janOffset, julOffset);
    const maxOffset = Math.max(janOffset, julOffset);

    // A region has DST if maxOffset > minOffset
    const hasDstInRegion = maxOffset > minOffset;
    // DST is currently active if the offset matches the summer (higher) offset
    const isDstActive = hasDstInRegion && offsetMinutes === maxOffset;

    // Get canonical timezone abbreviation (e.g., AEDT, AEST, ACDT, AWST, NZDT, EDT)
    let shortName = null;
    const CANONICAL_TZ_NAMES = {
      'Australia/Sydney': { standard: 'AEST', dst: 'AEDT' },
      'Australia/Melbourne': { standard: 'AEST', dst: 'AEDT' },
      'Australia/Hobart': { standard: 'AEST', dst: 'AEDT' },
      'Australia/Brisbane': { standard: 'AEST', dst: 'AEST' },
      'Australia/Adelaide': { standard: 'ACST', dst: 'ACDT' },
      'Australia/Darwin': { standard: 'ACST', dst: 'ACST' },
      'Australia/Perth': { standard: 'AWST', dst: 'AWST' },
      'Australia/Broken_Hill': { standard: 'ACST', dst: 'ACDT' },
      'Australia/Lord_Howe': { standard: 'LHST', dst: 'LHDT' },
      'Pacific/Auckland': { standard: 'NZST', dst: 'NZDT' },
      'Pacific/Chatham': { standard: 'CHAST', dst: 'CHADT' },
      'Pacific/Fiji': { standard: 'FJT', dst: 'FJST' }
    };

    if (CANONICAL_TZ_NAMES[timezoneId]) {
      shortName = isDstActive ? CANONICAL_TZ_NAMES[timezoneId].dst : CANONICAL_TZ_NAMES[timezoneId].standard;
    } else {
      const shortNameParts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezoneId,
        timeZoneName: 'short'
      }).formatToParts(date);
      shortName = shortNameParts.find(p => p.type === 'timeZoneName')?.value || 'UTC';
    }

    // Format UTC string (e.g. UTC+10:00, UTC+11:00)
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absMin = Math.abs(offsetMinutes);
    const h = String(Math.floor(absMin / 60)).padStart(2, '0');
    const m = String(absMin % 60).padStart(2, '0');
    const utcFormatted = `UTC${sign}${h}:${m}`;
    const offsetHours = offsetMinutes / 60;

    let dstLabel = 'No DST';
    if (hasDstInRegion) {
      dstLabel = isDstActive ? 'Daylight Savings Active' : 'Standard Time';
    }

    return {
      timezone: timezoneId,
      shortName,
      offsetMinutes,
      offsetHours,
      utcFormatted,
      isDstActive,
      hasDstInRegion,
      dstLabel,
      description: `${shortName} • ${utcFormatted} (${dstLabel})`
    };
  } catch (err) {
    return {
      timezone: timezoneId,
      shortName: 'UTC',
      offsetMinutes: 0,
      offsetHours: 0,
      utcFormatted: 'UTC+00:00',
      isDstActive: false,
      hasDstInRegion: false,
      dstLabel: 'UTC',
      description: 'UTC • UTC+00:00'
    };
  }
}

// Major Australian and International Reference Points
const REGIONAL_REFERENCE_ZONES = [
  // Queensland: AEST year-round (UTC+10:00, NEVER daylight savings)
  { id: 'Australia/Brisbane', state: 'QLD', country: 'AU', lat: -27.4698, lon: 153.0251, label: 'Brisbane, Gold Coast, QLD' },
  
  // New South Wales / ACT: AEST in winter (UTC+10), AEDT in summer (UTC+11, Daylight Savings)
  { id: 'Australia/Sydney', state: 'NSW', country: 'AU', lat: -33.8688, lon: 151.2093, label: 'Sydney, Canberra, NSW/ACT' },
  
  // Victoria: AEST / AEDT (UTC+10 / UTC+11, Daylight Savings)
  { id: 'Australia/Melbourne', state: 'VIC', country: 'AU', lat: -37.8136, lon: 144.9631, label: 'Melbourne, VIC' },
  
  // Tasmania: AEST / AEDT (UTC+10 / UTC+11, Daylight Savings)
  { id: 'Australia/Hobart', state: 'TAS', country: 'AU', lat: -42.8821, lon: 147.3272, label: 'Hobart, TAS' },
  
  // South Australia: ACST in winter (UTC+9:30), ACDT in summer (UTC+10:30, Daylight Savings)
  { id: 'Australia/Adelaide', state: 'SA', country: 'AU', lat: -34.9285, lon: 138.6007, label: 'Adelaide, SA' },
  
  // Northern Territory: ACST year-round (UTC+9:30, NEVER daylight savings)
  { id: 'Australia/Darwin', state: 'NT', country: 'AU', lat: -12.4634, lon: 130.8456, label: 'Darwin, NT' },
  
  // Western Australia: AWST year-round (UTC+8:00, NEVER daylight savings)
  { id: 'Australia/Perth', state: 'WA', country: 'AU', lat: -31.9505, lon: 115.8605, label: 'Perth, WA' },
  
  // Broken Hill (NSW regional exception, follows SA time)
  { id: 'Australia/Broken_Hill', state: 'NSW', country: 'AU', lat: -31.9567, lon: 141.4678, label: 'Broken Hill, NSW' },
  
  // Lord Howe Island (+10:30 standard / +11:00 DST)
  { id: 'Australia/Lord_Howe', state: 'NSW', country: 'AU', lat: -31.5544, lon: 159.0831, label: 'Lord Howe Island' },

  // New Zealand: NZST in winter (UTC+12), NZDT in summer (UTC+13, Daylight Savings)
  { id: 'Pacific/Auckland', state: 'NZ', country: 'NZ', lat: -36.8485, lon: 174.7633, label: 'Auckland, Wellington, NZ' },

  // Key Global Timezones
  { id: 'Europe/London', country: 'GB', lat: 51.5074, lon: -0.1278, label: 'London, UK' },
  { id: 'America/New_York', country: 'US', lat: 40.7128, lon: -74.0060, label: 'New York, US' },
  { id: 'America/Los_Angeles', country: 'US', lat: 34.0522, lon: -118.2437, label: 'Los Angeles, US' },
  { id: 'Asia/Tokyo', country: 'JP', lat: 35.6762, lon: 139.6503, label: 'Tokyo, Japan' },
  { id: 'UTC', country: '', lat: 0, lon: 0, label: 'UTC (Universal Coordinated Time)' }
];

/**
 * Resolves the closest timezone taking daylight savings and geographical location into account.
 * @param {Object} params - { lat, lon, suburb, state, country, date }
 * @returns {Object} Full timezone details and metadata
 */
export function resolveClosestTimezone({ lat, lon, suburb = '', state = '', country = '', date = new Date() } = {}) {
  const cleanState = String(state || '').trim().toUpperCase();
  const cleanSuburb = String(suburb || '').trim().toLowerCase();
  const cleanCountry = String(country || '').trim().toUpperCase();

  // 1. Direct State Mappings for Australia (strict jurisdictional Daylight Savings rules)
  if (cleanState === 'QLD' || cleanSuburb.includes('gold coast') || cleanSuburb.includes('brisbane') || cleanSuburb.includes('robina')) {
    return getTimezoneDetails('Australia/Brisbane', date);
  }
  if (cleanState === 'NSW' || cleanState === 'ACT' || cleanSuburb.includes('sydney') || cleanSuburb.includes('summer hill')) {
    if (cleanSuburb.includes('broken hill')) return getTimezoneDetails('Australia/Broken_Hill', date);
    if (cleanSuburb.includes('lord howe')) return getTimezoneDetails('Australia/Lord_Howe', date);
    return getTimezoneDetails('Australia/Sydney', date);
  }
  if (cleanState === 'VIC' || cleanSuburb.includes('melbourne') || cleanSuburb.includes('geelong')) {
    return getTimezoneDetails('Australia/Melbourne', date);
  }
  if (cleanState === 'TAS' || cleanSuburb.includes('hobart') || cleanSuburb.includes('launceston')) {
    return getTimezoneDetails('Australia/Hobart', date);
  }
  if (cleanState === 'SA' || cleanSuburb.includes('adelaide')) {
    return getTimezoneDetails('Australia/Adelaide', date);
  }
  if (cleanState === 'NT' || cleanSuburb.includes('darwin') || cleanSuburb.includes('alice springs')) {
    return getTimezoneDetails('Australia/Darwin', date);
  }
  if (cleanState === 'WA' || cleanSuburb.includes('perth') || cleanSuburb.includes('fremantle')) {
    return getTimezoneDetails('Australia/Perth', date);
  }
  if (cleanCountry === 'NZ' || cleanState === 'NZ' || cleanSuburb.includes('auckland') || cleanSuburb.includes('wellington')) {
    return getTimezoneDetails('Pacific/Auckland', date);
  }

  // 2. Spatial / Coordinate Nearest Timezone Resolution
  const latitude = typeof lat === 'number' && !isNaN(lat) ? lat : null;
  const longitude = typeof lon === 'number' && !isNaN(lon) ? lon : null;

  if (latitude !== null && longitude !== null) {
    // Check if coordinates fall inside Australia bounds (approx lat -44 to -10, lon 113 to 154)
    if (latitude >= -44 && latitude <= -10 && longitude >= 113 && longitude <= 154) {
      // Bounding box heuristic for Queensland (north of border approx lat -28.16, east of 138)
      // Queensland has NO daylight savings (UTC+10:00)
      if (latitude > -28.16 && longitude >= 138.0) {
        return getTimezoneDetails('Australia/Brisbane', date);
      }

      // Western Australia: west of longitude 129
      if (longitude < 129.0) {
        return getTimezoneDetails('Australia/Perth', date);
      }

      // Northern Territory: north of -26, longitude 129 to 138
      if (latitude > -26.0 && longitude >= 129.0 && longitude < 138.0) {
        return getTimezoneDetails('Australia/Darwin', date);
      }

      // South Australia: south of -26, longitude 129 to 141
      if (latitude <= -26.0 && longitude >= 129.0 && longitude <= 141.0) {
        return getTimezoneDetails('Australia/Adelaide', date);
      }

      // Tasmania: south of -39.5
      if (latitude <= -39.5) {
        return getTimezoneDetails('Australia/Hobart', date);
      }

      // Victoria: south of -34.0, north of -39.5, longitude 140.9 to 150
      if (latitude > -39.5 && latitude <= -34.0 && longitude >= 140.9 && longitude <= 150.0) {
        return getTimezoneDetails('Australia/Melbourne', date);
      }

      // Default Eastern Australia with DST (NSW/ACT)
      return getTimezoneDetails('Australia/Sydney', date);
    }

    // New Zealand coordinate bounds
    if (latitude >= -48 && latitude <= -34 && longitude >= 165 && longitude <= 179) {
      return getTimezoneDetails('Pacific/Auckland', date);
    }

    // Great circle distance to nearest reference zone
    let closestZone = REGIONAL_REFERENCE_ZONES[0];
    let shortestDist = Infinity;

    for (const ref of REGIONAL_REFERENCE_ZONES) {
      const dLat = (latitude - ref.lat) * (Math.PI / 180);
      const dLon = (longitude - ref.lon) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(latitude * (Math.PI / 180)) * Math.cos(ref.lat * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      if (c < shortestDist) {
        shortestDist = c;
        closestZone = ref;
      }
    }

    return getTimezoneDetails(closestZone.id, date);
  }

  // 3. Fallback to Browser System Timezone if available
  try {
    const systemTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (systemTz) return getTimezoneDetails(systemTz, date);
  } catch (_) {}

  // 4. Default Australian Sydney
  return getTimezoneDetails('Australia/Sydney', date);
}

/**
 * Returns dynamic list of timezone options annotated with live Daylight Savings and UTC time.
 */
export function getLiveTimezoneCatalog(date = new Date()) {
  return [
    {
      group: 'Australia',
      zones: [
        { id: 'Australia/Sydney', name: 'Sydney, Melbourne, ACT' },
        { id: 'Australia/Brisbane', name: 'Brisbane, Gold Coast (QLD)' },
        { id: 'Australia/Adelaide', name: 'Adelaide (SA)' },
        { id: 'Australia/Perth', name: 'Perth (WA)' },
        { id: 'Australia/Darwin', name: 'Darwin (NT)' },
        { id: 'Australia/Hobart', name: 'Hobart (TAS)' },
        { id: 'Australia/Broken_Hill', name: 'Broken Hill (NSW)' },
        { id: 'Australia/Lord_Howe', name: 'Lord Howe Island' }
      ]
    },
    {
      group: 'New Zealand & Pacific',
      zones: [
        { id: 'Pacific/Auckland', name: 'Auckland, Wellington (NZ)' },
        { id: 'Pacific/Chatham', name: 'Chatham Islands (NZ)' },
        { id: 'Pacific/Fiji', name: 'Fiji' }
      ]
    },
    {
      group: 'International & UTC',
      zones: [
        { id: 'UTC', name: 'UTC (Universal Coordinated Time)' },
        { id: 'Europe/London', name: 'London (UK)' },
        { id: 'Europe/Paris', name: 'Paris, Berlin (CET/CEST)' },
        { id: 'America/New_York', name: 'New York (US Eastern)' },
        { id: 'America/Chicago', name: 'Chicago (US Central)' },
        { id: 'America/Denver', name: 'Denver (US Mountain)' },
        { id: 'America/Los_Angeles', name: 'Los Angeles (US Pacific)' },
        { id: 'Asia/Tokyo', name: 'Tokyo (Japan)' },
        { id: 'Asia/Singapore', name: 'Singapore' },
        { id: 'Asia/Dubai', name: 'Dubai (UAE)' }
      ]
    }
  ].map(group => ({
    group: group.group,
    options: group.zones.map(z => {
      const details = getTimezoneDetails(z.id, date);
      return {
        id: z.id,
        label: `${z.name} — ${details.description}`,
        details
      };
    })
  }));
}
