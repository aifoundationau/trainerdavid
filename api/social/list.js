// GET /api/social/list
// Returns all published Instagram and Facebook social posts.
import { handler, db } from '../_lib/firebaseAdmin.js';
import { INITIAL_SOCIAL_POSTS } from '../../src/data/socialPosts.js';

export default handler(async () => {
  let dbPosts = [];
  try {
    const snap = await db.collection('social_posts').orderBy('createdAt', 'desc').limit(100).get();
    dbPosts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.warn('Could not read social_posts from Firestore:', err.message);
  }

  // Merge Firestore posts with seed posts, deduplicated by id
  const dbPostIds = new Set(dbPosts.map(p => p.id));
  const merged = [...dbPosts, ...INITIAL_SOCIAL_POSTS.filter(p => !dbPostIds.has(p.id))];

  return {
    success: true,
    count: merged.length,
    posts: merged
  };
});
