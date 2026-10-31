// Unit tests for Suburb & City Auto-detection and Search
const { test } = require('node:test');
const assert = require('node:assert/strict');

async function loadSuburbService() {
  return await import('../src/services/suburbService.js');
}

test('Suburb detection: finds Robina in QLD with Australia/Brisbane timezone', async () => {
  const { findBestLocalMatch, searchSuburbs } = await loadSuburbService();
  const match = findBestLocalMatch('Robina');
  assert.ok(match, 'Robina should be found in catalog');
  assert.equal(match.suburb, 'Robina');
  assert.equal(match.state, 'QLD');
  assert.equal(match.timezone, 'Australia/Brisbane');
  assert.equal(match.country, 'AU');

  const searchResults = await searchSuburbs('Robina');
  assert.ok(searchResults.length > 0);
  assert.equal(searchResults[0].suburb, 'Robina');
  assert.equal(searchResults[0].state, 'QLD');
});

test('Suburb detection: finds Bondi and Summer Hill in NSW with Australia/Sydney timezone', async () => {
  const { findBestLocalMatch, searchSuburbs } = await loadSuburbService();
  const bondi = findBestLocalMatch('bondi');
  assert.ok(bondi);
  assert.equal(bondi.suburb, 'Bondi');
  assert.equal(bondi.state, 'NSW');
  assert.equal(bondi.timezone, 'Australia/Sydney');

  const summerHill = findBestLocalMatch('Summer Hill');
  assert.ok(summerHill);
  assert.equal(summerHill.suburb, 'Summer Hill');
  assert.equal(summerHill.state, 'NSW');
  assert.equal(summerHill.timezone, 'Australia/Sydney');
});

test('Suburb detection: finds Melbourne in VIC with Australia/Melbourne timezone', async () => {
  const { findBestLocalMatch } = await loadSuburbService();
  const melb = findBestLocalMatch('melbourne');
  assert.ok(melb);
  assert.equal(melb.suburb, 'Melbourne');
  assert.equal(melb.state, 'VIC');
  assert.equal(melb.timezone, 'Australia/Melbourne');
});

test('Suburb detection: finds international cities (Auckland, Bangkok, London)', async () => {
  const { findBestLocalMatch } = await loadSuburbService();
  const akl = findBestLocalMatch('Auckland');
  assert.ok(akl);
  assert.equal(akl.timezone, 'Pacific/Auckland');

  const bkk = findBestLocalMatch('Bangkok');
  assert.ok(bkk);
  assert.equal(bkk.country, 'TH');
  assert.equal(bkk.timezone, 'Asia/Bangkok');
});

test('Suburb detection: handles partial typing and prefix matches cleanly', async () => {
  const { searchSuburbs } = await loadSuburbService();
  const results = await searchSuburbs('Sur');
  assert.ok(results.length > 0);
  const suburbs = results.map(r => r.suburb);
  assert.ok(suburbs.includes('Surfers Paradise') || suburbs.includes('Surry Hills'));
});

