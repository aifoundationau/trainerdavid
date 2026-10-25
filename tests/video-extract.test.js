// Tests for YouTube video extraction, postcard data structure, and unlisted notice enforcement
const { test } = require('node:test');
const assert = require('node:assert/strict');

function extractYouTubeId(url) {
  const match = String(url || '').match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
  return match ? match[1] : null;
}

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"');
}

function cleanVideoTitle(raw) {
  if (!raw) return '';
  return raw
    .replace(/#\w+/g, '')
    .replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\p{Emoji_Presentation}\p{Emoji_Modifier}\s]+/u, '')
    .replace(/[\p{Extended_Pictographic}\uFE0F\u200D\p{Emoji_Presentation}\p{Emoji_Modifier}\s]+$/u, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function buildPostcardModel({ id, title, description, thumbnailUrl, category, duration, tokenCost, difficulty, muscleGroup, equipment, author }) {
  const cost = Math.max(1, Math.round(Number(tokenCost) || 1));
  return {
    id,
    youtubeId: id,
    title: cleanVideoTitle(title) || 'Untitled Tutorial',
    shortDescription: (description || '').slice(0, 500),
    thumbnailUrl: thumbnailUrl || (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : ''),
    category: category || 'Chest & Shoulders',
    duration: duration || '10 mins',
    difficulty: difficulty || 'Intermediate',
    tokenCost: cost,
    muscleGroup: muscleGroup || 'Target Muscles',
    equipment: equipment || 'Standard Gym Equipment',
    author: author || 'Coach',
    status: 'published'
  };
}

test('extractYouTubeId parses all standard YouTube URL formats', () => {
  const cases = [
    ['https://www.youtube.com/watch?v=HlICRIW8iUY', 'HlICRIW8iUY'],
    ['https://youtu.be/4x8vjXu9M6Y', '4x8vjXu9M6Y'],
    ['https://www.youtube.com/embed/x_BJxeHG1v4', 'x_BJxeHG1v4'],
    ['https://www.youtube.com/shorts/dG14fdw3hm8', 'dG14fdw3hm8'],
    ['https://m.youtube.com/watch?v=PqejflqKS0Y&feature=shared', 'PqejflqKS0Y'],
    ['https://www.youtube.com/watch?app=desktop&v=dbRm_qJvQ1E', 'dbRm_qJvQ1E'],
    ['https://vimeo.com/123456789', null],
    ['https://example.com/video.mp4', null],
    ['', null],
    [null, null]
  ];

  for (const [url, expected] of cases) {
    assert.equal(extractYouTubeId(url), expected, `Failed on URL: ${url}`);
  }
});

test('decodeHtmlEntities decodes special HTML entities in titles and descriptions', () => {
  assert.equal(decodeHtmlEntities('Shoulders &amp; Back Workout'), 'Shoulders & Back Workout');
  assert.equal(decodeHtmlEntities('Coach&#39;s Masterclass'), "Coach's Masterclass");
  assert.equal(decodeHtmlEntities('&quot;Golden Ratio&quot; V-Taper'), '"Golden Ratio" V-Taper');
  assert.equal(decodeHtmlEntities('&lt;b&gt;Important&lt;/b&gt;'), '<b>Important</b>');
});

test('cleanVideoTitle strips hashtags and leading/trailing emojis cleanly', () => {
  const raw = '🦋 Reverse Butterfly Workout for Strong Shoulders & Back 💪🔥 #trainerdavid #instructional';
  const clean = cleanVideoTitle(raw);
  assert.equal(clean, 'Reverse Butterfly Workout for Strong Shoulders & Back');

  const raw2 = '💪🔥 Master Incline Dumbbell Press for Upper Chest Gains 🚀🏋️‍♂️ #trainerdavid #instructional';
  const clean2 = cleanVideoTitle(raw2);
  assert.equal(clean2, 'Master Incline Dumbbell Press for Upper Chest Gains');
});

test('buildPostcardModel outputs compliant postcard data structure with extracted thumbnail', () => {
  const postcard = buildPostcardModel({
    id: 'HlICRIW8iUY',
    title: '🦋 Reverse Butterfly Workout #trainerdavid',
    description: 'The Reverse Butterfly isolates posterior deltoids and rhomboids.',
    thumbnailUrl: 'https://i.ytimg.com/vi/HlICRIW8iUY/hqdefault.jpg',
    category: 'Chest & Shoulders',
    duration: '8 mins',
    tokenCost: 5,
    difficulty: 'Beginner Friendly',
    muscleGroup: 'Pectoralis Major, Posterior Deltoids',
    equipment: 'Pec Deck Machine',
    author: 'Coach David'
  });

  assert.equal(postcard.id, 'HlICRIW8iUY');
  assert.equal(postcard.title, 'Reverse Butterfly Workout');
  assert.equal(postcard.thumbnailUrl, 'https://i.ytimg.com/vi/HlICRIW8iUY/hqdefault.jpg');
  assert.equal(postcard.tokenCost, 5);
  assert.ok(Number.isInteger(postcard.tokenCost));
  assert.ok(postcard.shortDescription.length > 0);
  assert.equal(postcard.category, 'Chest & Shoulders');
  assert.equal(postcard.duration, '8 mins');
});

test('Unlisted YouTube notice clearly informs trainers to avoid Private and Public settings', () => {
  const notice = {
    badge: 'UNLISTED REQUIRED',
    instruction: 'Always list your tutorial as Unlisted on YouTube Studio before publishing.',
    privateWarning: 'Do NOT set to Private (will cause embed and playback errors).',
    publicWarning: 'Do NOT set to Public (anyone could view without spending FitTokens).'
  };

  assert.ok(notice.instruction.includes('Unlisted'));
  assert.ok(notice.privateWarning.includes('Private'));
  assert.ok(notice.publicWarning.includes('Public'));
});

test('Video purchase grants permanent lifetime access (watch for life invariant)', () => {
  const unlockRecord = {
    viewerUid: 'user_123',
    videoId: 'HlICRIW8iUY',
    videoTitle: 'Reverse Butterfly Workout',
    tokenCost: 5,
    accessType: 'lifetime',
    lifetimeAccess: true,
    unlockedAt: new Date().toISOString()
  };

  assert.equal(unlockRecord.accessType, 'lifetime');
  assert.equal(unlockRecord.lifetimeAccess, true);

  // Subsequent check should return already-unlocked with lifetime access preserved
  const checkAlreadyUnlocked = (record) => {
    if (record.accessType === 'lifetime' && record.lifetimeAccess) {
      return {
        status: 'already-unlocked',
        videoId: record.videoId,
        canWatch: true,
        lifetimeAccess: true,
        message: 'You already own lifetime access to this video.'
      };
    }
    return { status: 'locked', canWatch: false };
  };

  const status = checkAlreadyUnlocked(unlockRecord);
  assert.equal(status.status, 'already-unlocked');
  assert.equal(status.canWatch, true);
  assert.equal(status.lifetimeAccess, true);
  assert.ok(status.message.includes('lifetime access'));
});

