// Firestore user directory for Trainer David (#pt).
// The `users` collection is shared with other AI Foundation apps, so Trainer David
// members are marked with 'pt' in the `apps` array instead of overwriting another app's tag.
// Security rules only let a user create their own profile as a supporter; roles are
// changed by a SuperAdmin.
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
  increment
} from 'firebase/firestore';
import { db } from '../firebase';
import { isUserSuperAdmin } from '../data/adminStore';

export const APP_TAG = 'pt';

const APP_ROLES = ['supporter', 'trainer', 'doctor', 'accountant', 'admin', 'superadmin'];

const CLASSIFICATIONS = {
  supporter: 'Supporter',
  trainer: 'Trainer',
  doctor: 'Doctor',
  accountant: 'Accountant',
  admin: 'Admin',
  superadmin: 'Superadmin'
};

// Map a Firestore profile to a Trainer David role (other apps' roles, e.g. 'student', become supporter)
export function toAppRole(profile, email) {
  const role = (profile?.role || '').toLowerCase();
  if (profile?.isSuperAdmin === true || role === 'superadmin' || role === 'super_admin' || isUserSuperAdmin(email)) {
    return 'superadmin';
  }
  return APP_ROLES.includes(role) ? role : 'supporter';
}

// Convert a Firestore profile into the user shape the admin panel renders
export function toPanelUser(profile) {
  const name = profile.displayName || profile.name || profile.email?.split('@')[0] || 'User';
  return {
    id: profile.uid,
    uid: profile.uid,
    email: profile.email,
    name,
    givenName: name.split(' ')[0],
    picture: profile.photoURL || profile.avatar || '',
    role: toAppRole(profile, profile.email),
    tokens: profile.fitTokens ?? 0,
    registeredAt: profile.ptRegisteredAt || profile.registeredAt || profile.createdAt || '',
    source: 'firestore'
  };
}

// Create (as supporter) or refresh the signed-in user's profile and tag it with #pt.
// `fallbackTokens` seeds fitTokens for users who only had a local balance before.
// With `register: false` it only refreshes existing #pt members and returns null otherwise.
export async function syncUserProfile(fbUser, { fallbackTokens = 0, register = true } = {}) {
  const ref = doc(db, 'users', fbUser.uid);
  const snap = await getDoc(ref);
  const now = new Date().toISOString();

  if (!register && !(snap.exists() && (snap.data().apps || []).includes(APP_TAG))) {
    return null;
  }

  if (!snap.exists()) {
    const profile = {
      uid: fbUser.uid,
      id: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName || fbUser.email.split('@')[0],
      photoURL: fbUser.photoURL || '',
      role: 'supporter',
      status: 'supporter',
      classification: 'Supporter',
      isSuperAdmin: false,
      source: APP_TAG,
      tag: APP_TAG,
      businessName: 'Trainer David',
      apps: [APP_TAG],
      fitTokens: 0,
      authProvider: 'google',
      registeredAt: now,
      ptRegisteredAt: now,
      createdAt: now,
      lastLoginAt: now,
      updatedAt: now,
      loginCount: 1
    };
    await setDoc(ref, profile);
    return profile;
  }

  const existing = snap.data();
  const patch = {
    apps: arrayUnion(APP_TAG),
    lastLoginAt: now,
    updatedAt: now,
    loginCount: increment(1)
  };
  if (!existing.ptRegisteredAt) patch.ptRegisteredAt = now;
  if (existing.fitTokens === undefined) patch.fitTokens = fallbackTokens;
  if (!existing.displayName && fbUser.displayName) patch.displayName = fbUser.displayName;
  if (!existing.photoURL && fbUser.photoURL) patch.photoURL = fbUser.photoURL;
  await updateDoc(ref, patch);

  return {
    ...existing,
    ...patch,
    apps: Array.from(new Set([...(existing.apps || []), APP_TAG])),
    loginCount: (existing.loginCount || 0) + 1,
    fitTokens: existing.fitTokens ?? fallbackTokens
  };
}

// Save the signed-in user's own FitToken balance
export async function saveOwnTokens(uid, tokens) {
  await updateDoc(doc(db, 'users', uid), { fitTokens: tokens, updatedAt: new Date().toISOString() });
}

// Admin: list every Trainer David (#pt) member
export async function listPtUsers() {
  const snap = await getDocs(query(collection(db, 'users'), where('apps', 'array-contains', APP_TAG)));
  return snap.docs.map(d => toPanelUser({ uid: d.id, ...d.data() }));
}

// SuperAdmin: change a member's role
export async function setUserRole(uid, role, byEmail) {
  const now = new Date().toISOString();
  await updateDoc(doc(db, 'users', uid), {
    role,
    status: role,
    classification: CLASSIFICATIONS[role] || 'Supporter',
    role_updated_at: now,
    role_updated_by: byEmail || '',
    updatedAt: now
  });
}

// SuperAdmin: add or remove FitTokens for a member
export async function adjustRemoteTokens(uid, delta) {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, { fitTokens: increment(delta), updatedAt: new Date().toISOString() });
  const snap = await getDoc(ref);
  return toPanelUser({ uid, ...snap.data() });
}
