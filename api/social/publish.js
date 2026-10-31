// POST /api/social/publish
// Allows all users (supporters, coaches, admins) to post social media posts (Instagram, Facebook, TikTok, YouTube Shorts, X, Threads, etc.)
// Cost to view: Custom token rate (0 tokens = Free to view, 1 token = standard, 2+ tokens = custom).
import { handler, requireUser, db, HttpError } from '../_lib/firebaseAdmin.js';

const VALID_PLATFORMS = [
  'instagram',
  'facebook',
  'tiktok',
  'youtube',
  'x',
  'twitter',
  'threads',
  'linkedin',
  'other'
];

export default handler(async (req) => {
  const caller = await requireUser(req);
  const {
    platform: rawPlatform = 'instagram',
    url: rawUrl,
    title: rawTitle,
    caption: rawCaption,
    thumbnailUrl: rawThumb,
    tokenCost: rawCost = 1,
    messageTokenCost: rawMsgCost,
    tags: rawTags
  } = req.body || {};

  const platform = String(rawPlatform || 'instagram').trim().toLowerCase();
  if (!VALID_PLATFORMS.includes(platform)) {
    throw new HttpError(400, `Invalid platform. Supported platforms: ${VALID_PLATFORMS.join(', ')}.`);
  }

  const url = String(rawUrl || '').trim();
  if (!url) throw new HttpError(400, 'Please provide the post URL.');

  // Validate URL format for specific platforms
  if (platform === 'instagram' && !/(?:instagram\.com\/|instagr\.am\/)/i.test(url)) {
    throw new HttpError(400, 'Invalid Instagram URL. Must be an instagram.com link.');
  }

  if (platform === 'facebook' && !/(?:facebook\.com\/|fb\.watch\/|fb\.com\/)/i.test(url)) {
    throw new HttpError(400, 'Invalid Facebook URL. Must be a facebook.com link.');
  }

  if (platform === 'tiktok' && !/(?:tiktok\.com\/)/i.test(url)) {
    throw new HttpError(400, 'Invalid TikTok URL. Must be a tiktok.com link.');
  }

  if ((platform === 'x' || platform === 'twitter') && !/(?:x\.com\/|twitter\.com\/)/i.test(url)) {
    throw new HttpError(400, 'Invalid X/Twitter URL. Must be an x.com or twitter.com link.');
  }

  const title = String(rawTitle || '').trim();
  if (!title) throw new HttpError(400, 'Post title or headline is required.');

  const caption = String(rawCaption || '').trim();
  const now = new Date().toISOString();
  const id = `soc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  // Token cost: strict non-negative integer. If 0, post is free to view!
  const tokenCost = Math.max(0, Math.round(Number(rawCost !== undefined ? rawCost : 1)));
  const isFree = tokenCost === 0;

  // Custom message token cost chosen by creator (0 = free to message, default 1)
  const messageTokenCost = rawMsgCost !== undefined
    ? Math.max(0, Math.round(Number(rawMsgCost) || 0))
    : 1;

  // Platform fallback thumbnail images
  const defaultThumbs = {
    instagram: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
    facebook: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
    tiktok: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=80',
    youtube: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&auto=format&fit=crop&q=80',
    x: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
    twitter: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
    threads: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
    linkedin: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80',
    other: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80'
  };

  const thumbnailUrl = String(rawThumb || '').trim() || defaultThumbs[platform] || defaultThumbs.other;

  const authorName = caller.name || caller.email.split('@')[0] || 'Member';
  const roleName = caller.role || caller.pt_role || 'supporter';

  const postDoc = {
    id,
    platform,
    url,
    title,
    caption,
    author: `${authorName} (${roleName === 'supporter' ? 'Member' : roleName.replace('_', ' ')})`,
    creatorUid: caller.uid,
    creatorEmail: caller.email,
    creatorRole: roleName,
    thumbnailUrl,
    tokenCost,
    messageTokenCost,
    isFree,
    likesCount: 1,
    tags: Array.isArray(rawTags) ? rawTags.map(t => String(t).trim()).filter(Boolean).slice(0, 5) : [],
    createdAt: now,
    updatedAt: now
  };

  await db.collection('social_posts').doc(id).set(postDoc);

  return {
    success: true,
    message: isFree
      ? `Your ${platform} post was published live for FREE viewing!`
      : `Your ${platform} post was published live with a ${tokenCost} FitToken rate!`,
    post: postDoc
  };
});
