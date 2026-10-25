// Unit tests for Daylight Savings Time (DST) and closest UTC timezone resolution
const { test } = require('node:test');
const assert = require('node:assert/strict');

// Import from timezoneService
async function loadTimezoneService() {
  return await import('../src/services/timezoneService.js');
}

test('Daylight Savings: Sydney, NSW observes AEDT (UTC+11) in October 2026', async () => {
  const { getTimezoneDetails } = await loadTimezoneService();
  const octDate = new Date('2026-10-25T08:00:00Z');
  const details = getTimezoneDetails('Australia/Sydney', octDate);

  assert.equal(details.timezone, 'Australia/Sydney');
  assert.equal(details.utcFormatted, 'UTC+11:00');
  assert.equal(details.isDstActive, true);
  assert.equal(details.offsetHours, 11);
  assert.ok(details.shortName.includes('DT') || details.shortName === 'AEDT' || details.shortName === 'GMT+11');
});

test('Daylight Savings: Brisbane/Robina, QLD observes AEST (UTC+10) with NO Daylight Savings', async () => {
  const { getTimezoneDetails } = await loadTimezoneService();
  const octDate = new Date('2026-10-25T08:00:00Z');
  const details = getTimezoneDetails('Australia/Brisbane', octDate);

  assert.equal(details.timezone, 'Australia/Brisbane');
  assert.equal(details.utcFormatted, 'UTC+10:00');
  assert.equal(details.isDstActive, false);
  assert.equal(details.offsetHours, 10);
});

test('Daylight Savings: Adelaide, SA observes ACDT (UTC+10:30) with Daylight Savings active in October', async () => {
  const { getTimezoneDetails } = await loadTimezoneService();
  const octDate = new Date('2026-10-25T08:00:00Z');
  const details = getTimezoneDetails('Australia/Adelaide', octDate);

  assert.equal(details.timezone, 'Australia/Adelaide');
  assert.equal(details.utcFormatted, 'UTC+10:30');
  assert.equal(details.isDstActive, true);
  assert.equal(details.offsetHours, 10.5);
});

test('Daylight Savings: Perth, WA observes AWST (UTC+08:00) with NO Daylight Savings', async () => {
  const { getTimezoneDetails } = await loadTimezoneService();
  const octDate = new Date('2026-10-25T08:00:00Z');
  const details = getTimezoneDetails('Australia/Perth', octDate);

  assert.equal(details.timezone, 'Australia/Perth');
  assert.equal(details.utcFormatted, 'UTC+08:00');
  assert.equal(details.isDstActive, false);
  assert.equal(details.offsetHours, 8);
});

test('Daylight Savings: Auckland, NZ observes NZDT (UTC+13:00) with Daylight Savings active in October', async () => {
  const { getTimezoneDetails } = await loadTimezoneService();
  const octDate = new Date('2026-10-25T08:00:00Z');
  const details = getTimezoneDetails('Pacific/Auckland', octDate);

  assert.equal(details.timezone, 'Pacific/Auckland');
  assert.equal(details.utcFormatted, 'UTC+13:00');
  assert.equal(details.isDstActive, true);
  assert.equal(details.offsetHours, 13);
});

test('resolveClosestTimezone selects Queensland (Australia/Brisbane, UTC+10) for Robina, QLD coordinates', async () => {
  const { resolveClosestTimezone } = await loadTimezoneService();
  const octDate = new Date('2026-10-25T08:00:00Z');
  
  // Robina, QLD: -28.0718, 153.3824
  const res = resolveClosestTimezone({
    lat: -28.0718,
    lon: 153.3824,
    suburb: 'Robina',
    state: 'QLD',
    date: octDate
  });

  assert.equal(res.timezone, 'Australia/Brisbane');
  assert.equal(res.utcFormatted, 'UTC+10:00');
  assert.equal(res.isDstActive, false);
});

test('resolveClosestTimezone selects Sydney (Australia/Sydney, UTC+11) for Summer Hill, NSW coordinates', async () => {
  const { resolveClosestTimezone } = await loadTimezoneService();
  const octDate = new Date('2026-10-25T08:00:00Z');
  
  // Summer Hill, NSW: -33.8917, 151.1378
  const res = resolveClosestTimezone({
    lat: -33.8917,
    lon: 151.1378,
    suburb: 'Summer Hill',
    state: 'NSW',
    date: octDate
  });

  assert.equal(res.timezone, 'Australia/Sydney');
  assert.equal(res.utcFormatted, 'UTC+11:00');
  assert.equal(res.isDstActive, true);
});
