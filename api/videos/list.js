// GET or POST /api/videos/list
// Returns all community workout videos published by trainers and staff from Firestore.
import { handler, db } from '../_lib/firebaseAdmin.js';

export default handler(async () => {
  try {
    const snapshot = await db.collection('pt_videos').where('status', '==', 'published').get();
    const videos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { videos };
  } catch (err) {
    console.warn('Could not fetch community videos from Firestore:', err);
    return { videos: [] };
  }
});
