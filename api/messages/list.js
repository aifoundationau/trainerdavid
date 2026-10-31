// GET or POST /api/messages/list
// Returns message inbox/threads and eligible contacts for messaging.
// Rule:
// - Regular users can message each other once payment has been made (unlocked video/post or service).
// - SuperAdmin can message anyone at any time without tokens.
import { handler, requireUser, isSuperAdmin, db, HttpError } from '../_lib/firebaseAdmin.js';

const SUPERADMIN_UID = 'ZK79FRQoVlYhsgvMibhi81dRUWj2';

export default handler(async (req) => {
  const caller = await requireUser(req);
  const callerIsSuperAdmin = isSuperAdmin(caller) || caller.uid === SUPERADMIN_UID;

  // 1. Fetch messages
  let messages = [];
  try {
    if (callerIsSuperAdmin) {
      // SuperAdmin can view all messages in the platform
      const snap = await db.collection('creator_messages')
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get();
      messages = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      // Fetch messages where caller is sender or creator/recipient
      const [sentSnap, receivedSnap] = await Promise.all([
        db.collection('creator_messages')
          .where('senderUid', '==', caller.uid)
          .get()
          .catch(() => ({ docs: [] })),
        db.collection('creator_messages')
          .where('creatorUid', '==', caller.uid)
          .get()
          .catch(() => ({ docs: [] }))
      ]);

      const map = new Map();
      sentSnap.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() }));
      receivedSnap.docs.forEach(d => map.set(d.id, { id: d.id, ...d.data() }));

      messages = Array.from(map.values()).sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
    }
  } catch (err) {
    console.warn('[Messages List] Error querying creator_messages:', err);
  }

  // 2. Fetch eligible contacts
  let eligibleContacts = [];
  try {
    if (callerIsSuperAdmin) {
      // SuperAdmin can message ANY registered user
      const usersSnap = await db.collection('users').limit(100).get();
      eligibleContacts = usersSnap.docs
        .map(d => ({
          uid: d.id,
          name: d.get('displayName') || d.get('name') || d.get('email')?.split('@')[0] || 'User',
          email: d.get('email') || '',
          role: d.get('role') || 'supporter',
          photoURL: d.get('photoURL') || null,
          messageTokenCost: d.get('messageTokenCost') !== undefined 
            ? Math.max(0, Math.round(Number(d.get('messageTokenCost')) || 0)) 
            : 1
        }))
        .filter(u => u.uid !== caller.uid);
    } else {
      // Regular user: find users where payment has been made (unlocked video/post)
      const paidContactUids = new Set();
      const reasonsMap = new Map();

      // Check video unlocks by this user
      const videoUnlocksSnap = await db.collection('video_unlocks')
        .where('uid', '==', caller.uid)
        .get()
        .catch(() => ({ docs: [] }));

      videoUnlocksSnap.docs.forEach(d => {
        const cUid = d.get('creatorUid');
        if (cUid && cUid !== caller.uid) {
          paidContactUids.add(cUid);
          reasonsMap.set(cUid, 'Unlocked Workout Video');
        }
      });

      // Check social unlocks by this user
      const socialUnlocksSnap = await db.collection('social_unlocks')
        .where('uid', '==', caller.uid)
        .get()
        .catch(() => ({ docs: [] }));

      socialUnlocksSnap.docs.forEach(d => {
        const cUid = d.get('creatorUid');
        if (cUid && cUid !== caller.uid) {
          paidContactUids.add(cUid);
          reasonsMap.set(cUid, 'Unlocked Social Post');
        }
      });

      // Check video unlocks where this user was the creator
      const myVideoSalesSnap = await db.collection('video_unlocks')
        .where('creatorUid', '==', caller.uid)
        .get()
        .catch(() => ({ docs: [] }));

      myVideoSalesSnap.docs.forEach(d => {
        const bUid = d.get('uid');
        if (bUid && bUid !== caller.uid) {
          paidContactUids.add(bUid);
          reasonsMap.set(bUid, 'Purchased Your Workout Video');
        }
      });

      // Also include SuperAdmin / Head Coach as available to message
      paidContactUids.add(SUPERADMIN_UID);
      if (!reasonsMap.has(SUPERADMIN_UID)) {
        reasonsMap.set(SUPERADMIN_UID, 'Head Coach & Platform Support');
      }

      // Fetch user profile details for each eligible UID
      const contactPromises = Array.from(paidContactUids).map(async (uid) => {
        if (uid === caller.uid) return null;
        try {
          const uSnap = await db.collection('users').doc(uid).get();
          if (uSnap.exists) {
            const data = uSnap.data();
            return {
              uid,
              name: data.displayName || data.name || (uid === SUPERADMIN_UID ? 'Trainer David (Head Coach)' : data.email?.split('@')[0] || 'Member'),
              email: data.email || (uid === SUPERADMIN_UID ? 'support@aifoundation.net.au' : ''),
              role: data.role || (uid === SUPERADMIN_UID ? 'superadmin' : 'supporter'),
              reason: reasonsMap.get(uid) || 'Unlocked Content',
              messageTokenCost: data.messageTokenCost !== undefined 
                ? Math.max(0, Math.round(Number(data.messageTokenCost) || 0)) 
                : (uid === SUPERADMIN_UID ? 0 : 1)
            };
          } else if (uid === SUPERADMIN_UID) {
            return {
              uid,
              name: 'Trainer David (Head Coach)',
              email: 'support@aifoundation.net.au',
              role: 'superadmin',
              reason: 'Head Coach & Platform Support',
              messageTokenCost: 0
            };
          }
        } catch (_) {}
        return null;
      });

      const resolved = await Promise.all(contactPromises);
      eligibleContacts = resolved.filter(Boolean);
    }
  } catch (err) {
    console.warn('[Messages List] Error compiling contacts:', err);
  }

  // Also read caller's own messageTokenCost setting
  let callerMessageTokenCost = 1;
  try {
    const callerSnap = await db.collection('users').doc(caller.uid).get();
    if (callerSnap.exists && callerSnap.get('messageTokenCost') !== undefined) {
      callerMessageTokenCost = Math.max(0, Math.round(Number(callerSnap.get('messageTokenCost')) || 0));
    }
  } catch (_) {}

  return {
    success: true,
    callerIsSuperAdmin,
    callerMessageTokenCost,
    messages,
    eligibleContacts
  };
});

