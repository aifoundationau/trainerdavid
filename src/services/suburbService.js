// Suburb and City Autocomplete & Detection Service
// Provides instant offline matching for Australian suburbs and international locations,
// with free Open-Meteo Geocoding API lookup for global coverage.

import { resolveClosestTimezone } from './timezoneService.js';

export const AUSTRALIAN_STATE_MAP = {
  'NEW SOUTH WALES': 'NSW',
  'QUEENSLAND': 'QLD',
  'VICTORIA': 'VIC',
  'WESTERN AUSTRALIA': 'WA',
  'SOUTH AUSTRALIA': 'SA',
  'TASMANIA': 'TAS',
  'NORTHERN TERRITORY': 'NT',
  'AUSTRALIAN CAPITAL TERRITORY': 'ACT'
};

export const POPULAR_SUBURBS = [
  // NSW / Sydney Metro & Regionals
  { suburb: 'Sydney', state: 'NSW', country: 'AU', lat: -33.8688, lon: 151.2093, timezone: 'Australia/Sydney' },
  { suburb: 'Bondi', state: 'NSW', country: 'AU', lat: -33.8915, lon: 151.2647, timezone: 'Australia/Sydney' },
  { suburb: 'Bondi Beach', state: 'NSW', country: 'AU', lat: -33.8915, lon: 151.2767, timezone: 'Australia/Sydney' },
  { suburb: 'Bondi Junction', state: 'NSW', country: 'AU', lat: -33.8920, lon: 151.2480, timezone: 'Australia/Sydney' },
  { suburb: 'Summer Hill', state: 'NSW', country: 'AU', lat: -33.8917, lon: 151.1378, timezone: 'Australia/Sydney' },
  { suburb: 'Manly', state: 'NSW', country: 'AU', lat: -33.7970, lon: 151.2880, timezone: 'Australia/Sydney' },
  { suburb: 'Coogee', state: 'NSW', country: 'AU', lat: -33.9210, lon: 151.2560, timezone: 'Australia/Sydney' },
  { suburb: 'Surry Hills', state: 'NSW', country: 'AU', lat: -33.8860, lon: 151.2110, timezone: 'Australia/Sydney' },
  { suburb: 'Parramatta', state: 'NSW', country: 'AU', lat: -33.8150, lon: 151.0011, timezone: 'Australia/Sydney' },
  { suburb: 'Chatswood', state: 'NSW', country: 'AU', lat: -33.7961, lon: 151.1780, timezone: 'Australia/Sydney' },
  { suburb: 'Cronulla', state: 'NSW', country: 'AU', lat: -34.0570, lon: 151.1520, timezone: 'Australia/Sydney' },
  { suburb: 'Wollongong', state: 'NSW', country: 'AU', lat: -34.4278, lon: 150.8931, timezone: 'Australia/Sydney' },
  { suburb: 'Newcastle', state: 'NSW', country: 'AU', lat: -32.9283, lon: 151.7817, timezone: 'Australia/Sydney' },
  { suburb: 'Byron Bay', state: 'NSW', country: 'AU', lat: -28.6474, lon: 153.6120, timezone: 'Australia/Sydney' },
  { suburb: 'Broken Hill', state: 'NSW', country: 'AU', lat: -31.9567, lon: 141.4678, timezone: 'Australia/Broken_Hill' },
  { suburb: 'Lord Howe Island', state: 'NSW', country: 'AU', lat: -31.5544, lon: 159.0831, timezone: 'Australia/Lord_Howe' },

  // QLD / Brisbane, Gold Coast & Regionals (AEST UTC+10 Year-Round)
  { suburb: 'Brisbane', state: 'QLD', country: 'AU', lat: -27.4698, lon: 153.0251, timezone: 'Australia/Brisbane' },
  { suburb: 'Robina', state: 'QLD', country: 'AU', lat: -28.0718, lon: 153.3824, timezone: 'Australia/Brisbane' },
  { suburb: 'Gold Coast', state: 'QLD', country: 'AU', lat: -28.0167, lon: 153.4000, timezone: 'Australia/Brisbane' },
  { suburb: 'Surfers Paradise', state: 'QLD', country: 'AU', lat: -28.0000, lon: 153.4333, timezone: 'Australia/Brisbane' },
  { suburb: 'Broadbeach', state: 'QLD', country: 'AU', lat: -28.0333, lon: 153.4333, timezone: 'Australia/Brisbane' },
  { suburb: 'Burleigh Heads', state: 'QLD', country: 'AU', lat: -28.0833, lon: 153.4500, timezone: 'Australia/Brisbane' },
  { suburb: 'Southport', state: 'QLD', country: 'AU', lat: -27.9667, lon: 153.4000, timezone: 'Australia/Brisbane' },
  { suburb: 'Sunshine Coast', state: 'QLD', country: 'AU', lat: -26.6500, lon: 153.0667, timezone: 'Australia/Brisbane' },
  { suburb: 'Noosa', state: 'QLD', country: 'AU', lat: -26.3900, lon: 153.0900, timezone: 'Australia/Brisbane' },
  { suburb: 'Cairns', state: 'QLD', country: 'AU', lat: -16.9186, lon: 145.7781, timezone: 'Australia/Brisbane' },
  { suburb: 'Townsville', state: 'QLD', country: 'AU', lat: -19.2590, lon: 146.8169, timezone: 'Australia/Brisbane' },
  { suburb: 'Toowoomba', state: 'QLD', country: 'AU', lat: -27.5598, lon: 151.9507, timezone: 'Australia/Brisbane' },

  // VIC / Melbourne Metro & Regionals
  { suburb: 'Melbourne', state: 'VIC', country: 'AU', lat: -37.8136, lon: 144.9631, timezone: 'Australia/Melbourne' },
  { suburb: 'St Kilda', state: 'VIC', country: 'AU', lat: -37.8640, lon: 144.9820, timezone: 'Australia/Melbourne' },
  { suburb: 'South Yarra', state: 'VIC', country: 'AU', lat: -37.8390, lon: 144.9890, timezone: 'Australia/Melbourne' },
  { suburb: 'Richmond', state: 'VIC', country: 'AU', lat: -37.8230, lon: 144.9980, timezone: 'Australia/Melbourne' },
  { suburb: 'Carlton', state: 'VIC', country: 'AU', lat: -37.8000, lon: 144.9670, timezone: 'Australia/Melbourne' },
  { suburb: 'Fitzroy', state: 'VIC', country: 'AU', lat: -37.7980, lon: 144.9780, timezone: 'Australia/Melbourne' },
  { suburb: 'Geelong', state: 'VIC', country: 'AU', lat: -38.1499, lon: 144.3617, timezone: 'Australia/Melbourne' },
  { suburb: 'Ballarat', state: 'VIC', country: 'AU', lat: -37.5622, lon: 143.8503, timezone: 'Australia/Melbourne' },
  { suburb: 'Bendigo', state: 'VIC', country: 'AU', lat: -36.7570, lon: 144.2794, timezone: 'Australia/Melbourne' },

  // SA / Adelaide & Regionals
  { suburb: 'Adelaide', state: 'SA', country: 'AU', lat: -34.9285, lon: 138.6007, timezone: 'Australia/Adelaide' },
  { suburb: 'Glenelg', state: 'SA', country: 'AU', lat: -34.9810, lon: 138.5150, timezone: 'Australia/Adelaide' },
  { suburb: 'North Adelaide', state: 'SA', country: 'AU', lat: -34.9080, lon: 138.5980, timezone: 'Australia/Adelaide' },
  { suburb: 'Mount Gambier', state: 'SA', country: 'AU', lat: -37.8294, lon: 140.7828, timezone: 'Australia/Adelaide' },

  // WA / Perth & Regionals
  { suburb: 'Perth', state: 'WA', country: 'AU', lat: -31.9505, lon: 115.8605, timezone: 'Australia/Perth' },
  { suburb: 'Fremantle', state: 'WA', country: 'AU', lat: -32.0569, lon: 115.7439, timezone: 'Australia/Perth' },
  { suburb: 'Scarborough', state: 'WA', country: 'AU', lat: -31.8940, lon: 115.7580, timezone: 'Australia/Perth' },
  { suburb: 'Bunbury', state: 'WA', country: 'AU', lat: -33.3271, lon: 115.6414, timezone: 'Australia/Perth' },

  // TAS / Hobart & Regionals
  { suburb: 'Hobart', state: 'TAS', country: 'AU', lat: -42.8821, lon: 147.3272, timezone: 'Australia/Hobart' },
  { suburb: 'Sandy Bay', state: 'TAS', country: 'AU', lat: -42.9030, lon: 147.3380, timezone: 'Australia/Hobart' },
  { suburb: 'Launceston', state: 'TAS', country: 'AU', lat: -41.4332, lon: 147.1441, timezone: 'Australia/Hobart' },

  // NT / Darwin & Regionals
  { suburb: 'Darwin', state: 'NT', country: 'AU', lat: -12.4634, lon: 130.8456, timezone: 'Australia/Darwin' },
  { suburb: 'Palmerston', state: 'NT', country: 'AU', lat: -12.4833, lon: 130.9833, timezone: 'Australia/Darwin' },
  { suburb: 'Alice Springs', state: 'NT', country: 'AU', lat: -23.6980, lon: 133.8807, timezone: 'Australia/Darwin' },

  // ACT / Canberra
  { suburb: 'Canberra', state: 'ACT', country: 'AU', lat: -35.2809, lon: 149.1300, timezone: 'Australia/Sydney' },
  { suburb: 'Belconnen', state: 'ACT', country: 'AU', lat: -35.2386, lon: 149.0661, timezone: 'Australia/Sydney' },

  // NZ / New Zealand
  { suburb: 'Auckland', state: 'NZ', country: 'NZ', lat: -36.8485, lon: 174.7633, timezone: 'Pacific/Auckland' },
  { suburb: 'Wellington', state: 'NZ', country: 'NZ', lat: -41.2865, lon: 174.7762, timezone: 'Pacific/Auckland' },
  { suburb: 'Christchurch', state: 'NZ', country: 'NZ', lat: -43.5321, lon: 172.6362, timezone: 'Pacific/Auckland' },
  { suburb: 'Queenstown', state: 'NZ', country: 'NZ', lat: -45.0312, lon: 168.6626, timezone: 'Pacific/Auckland' },

  // International Key Hubs
  { suburb: 'Bangkok', state: '', country: 'TH', lat: 13.7563, lon: 100.5018, timezone: 'Asia/Bangkok' },
  { suburb: 'Phnom Penh', state: '', country: 'KH', lat: 11.5564, lon: 104.9282, timezone: 'Asia/Phnom_Penh' },
  { suburb: 'Siem Reap', state: '', country: 'KH', lat: 13.3671, lon: 103.8448, timezone: 'Asia/Phnom_Penh' },
  { suburb: 'Singapore', state: '', country: 'SG', lat: 1.3521, lon: 103.8198, timezone: 'Asia/Singapore' },
  { suburb: 'London', state: '', country: 'GB', lat: 51.5074, lon: -0.1278, timezone: 'Europe/London' },
  { suburb: 'New York', state: 'NY', country: 'US', lat: 40.7128, lon: -74.0060, timezone: 'America/New_York' },
  { suburb: 'Los Angeles', state: 'CA', country: 'US', lat: 34.0522, lon: -118.2437, timezone: 'America/Los_Angeles' },
  { suburb: 'Tokyo', state: '', country: 'JP', lat: 35.6762, lon: 139.6503, timezone: 'Asia/Tokyo' }
];

/**
 * Searches local catalog first, then queries Open-Meteo geocoding if query is non-empty.
 * @param {string} rawQuery
 * @returns {Promise<Array>} List of matching place objects
 */
export async function searchSuburbs(rawQuery) {
  const query = String(rawQuery || '').trim().toLowerCase();
  if (!query || query.length < 1) return [];

  // Parse if user entered "Suburb, State" or "Suburb State" (e.g. "Bondi NSW" or "Robina, QLD")
  const parts = query.split(/[,\s]+/).filter(Boolean);
  const primaryName = parts[0] || query;

  // 1. Local Curated Catalog Match (instant zero-latency)
  const localMatches = POPULAR_SUBURBS.filter(item => {
    const itemSub = item.suburb.toLowerCase();
    const itemState = item.state.toLowerCase();
    return itemSub.startsWith(query) ||
           itemSub.includes(query) ||
           (parts.length > 1 && itemSub.includes(primaryName) && (itemState.includes(parts[1]) || item.country.toLowerCase().includes(parts[1])));
  });

  if (localMatches.length >= 4) {
    return localMatches.slice(0, 6);
  }

  // 2. Open-Meteo Free Geocoding API (Global coverage)
  if (query.length >= 2) {
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.results)) {
          const remoteMatches = data.results.map(r => {
            const countryCode = String(r.country_code || '').toUpperCase();
            let stateCode = '';
            if (countryCode === 'AU' && r.admin1) {
              stateCode = AUSTRALIAN_STATE_MAP[r.admin1.toUpperCase()] || r.admin1;
            } else {
              stateCode = r.admin1 || '';
            }

            const tzRes = resolveClosestTimezone({
              lat: r.latitude,
              lon: r.longitude,
              suburb: r.name,
              state: stateCode,
              country: countryCode,
              date: new Date()
            });

            return {
              suburb: r.name,
              state: stateCode,
              country: countryCode,
              lat: r.latitude,
              lon: r.longitude,
              timezone: r.timezone || tzRes.timezone
            };
          });

          // Merge & Deduplicate by suburb + state + country
          const seen = new Set(localMatches.map(m => `${m.suburb.toLowerCase()}-${m.state.toLowerCase()}-${m.country}`));
          const merged = [...localMatches];
          for (const rm of remoteMatches) {
            const key = `${rm.suburb.toLowerCase()}-${rm.state.toLowerCase()}-${rm.country}`;
            if (!seen.has(key)) {
              seen.add(key);
              merged.push(rm);
            }
          }
          return merged.slice(0, 6);
        }
      }
    } catch (_) {}
  }

  return localMatches.slice(0, 6);
}

/**
 * Finds the single best immediate match from local catalog or query string
 */
export function findBestLocalMatch(rawQuery) {
  const query = String(rawQuery || '').trim().toLowerCase();
  if (!query) return null;

  // Exact match
  const exact = POPULAR_SUBURBS.find(p => p.suburb.toLowerCase() === query);
  if (exact) return exact;

  // Starts with
  const startsWith = POPULAR_SUBURBS.find(p => p.suburb.toLowerCase().startsWith(query));
  if (startsWith) return startsWith;

  // Substring match
  const includes = POPULAR_SUBURBS.find(p => p.suburb.toLowerCase().includes(query));
  return includes || null;
}
