// POST /api/videos/extract
// Extracts title, description, and thumbnail from a YouTube URL (works for public & unlisted videos).
import { handler, requireUser, HttpError } from '../_lib/firebaseAdmin.js';

export function decodeHtmlEntities(str) {
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

export function cleanVideoTitle(raw) {
  if (!raw) return '';
  return raw
    .replace(/#\w+/g, '')
    .replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\p{Emoji_Presentation}\p{Emoji_Modifier}\s]+/u, '')
    .replace(/[\p{Extended_Pictographic}\uFE0F\u200D\p{Emoji_Presentation}\p{Emoji_Modifier}\s]+$/u, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function extractYouTubeId(url) {
  const match = String(url || '').match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
  return match ? match[1] : null;
}

export default handler(async (req) => {
  await requireUser(req);

  const { url, videoUrl } = req.body || {};
  const targetUrl = String(url || videoUrl || '').trim();

  if (!targetUrl) {
    throw new HttpError(400, 'Please provide a YouTube video URL.');
  }

  const youtubeId = extractYouTubeId(targetUrl);
  if (!youtubeId) {
    throw new HttpError(400, 'Invalid YouTube link. Please enter a valid YouTube watch, short, or share URL.');
  }

  const canonicalUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
  const embedUrl = `https://www.youtube.com/embed/${youtubeId}`;
  const defaultThumbnailUrl = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
  const maxresThumbnailUrl = `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`;

  let rawTitle = '';
  let author = '';
  let thumbnailUrl = defaultThumbnailUrl;
  let description = '';

  // 1. Fetch YouTube oEmbed for structured Title, Author, Thumbnail
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(canonicalUrl)}&format=json`;
    const oembedRes = await fetch(oembedUrl);
    if (oembedRes.ok) {
      const data = await oembedRes.json();
      rawTitle = decodeHtmlEntities(data.title || '');
      author = data.author_name || '';
      thumbnailUrl = data.thumbnail_url || defaultThumbnailUrl;
    }
  } catch (err) {
    console.warn('oEmbed fetch notice:', err.message);
  }

  // 2. Fetch page HTML to extract meta description and fallback title
  try {
    const pageRes = await fetch(canonicalUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });

    if (pageRes.ok) {
      const html = await pageRes.text();

      const descMatch = html.match(/<meta\s+(?:name|property)="description"\s+content="([^"]*)"/i) ||
                        html.match(/<meta\s+(?:name|property)="og:description"\s+content="([^"]*)"/i);

      if (descMatch && descMatch[1]) {
        description = decodeHtmlEntities(descMatch[1]);
      } else {
        const shortDescMatch = html.match(/"shortDescription":"([^"]*)"/);
        if (shortDescMatch && shortDescMatch[1]) {
          description = decodeHtmlEntities(shortDescMatch[1]);
        }
      }

      if (!rawTitle) {
        const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i);
        if (titleMatch && titleMatch[1]) {
          rawTitle = decodeHtmlEntities(titleMatch[1]);
        }
      }
    }
  } catch (err) {
    console.warn('Page description extraction notice:', err.message);
  }

  const cleanTitle = cleanVideoTitle(rawTitle) || rawTitle;

  return {
    success: true,
    youtubeId,
    canonicalUrl,
    embedUrl,
    title: cleanTitle,
    rawTitle: rawTitle || cleanTitle,
    description: description.slice(0, 500),
    thumbnailUrl,
    maxresThumbnailUrl,
    author,
    unlistedNotice: 'Always list your tutorial as Unlisted on YouTube Studio so only paying members on Trainer David can stream it.'
  };
});
