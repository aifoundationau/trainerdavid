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

const APP_ROLES = [
  'supporter',
  'athlete',
  'trainer',
  'strength_coach',
  'nutritionist',
  'physiotherapist',
  'exercise_physiologist',
  'rehab_specialist',
  'doctor',
  'yoga_pilates',
  'accountant',
  'admin',
  'mainadmin',
  'superadmin'
];

const CLASSIFICATIONS = {
  supporter: 'Supporter',
  athlete: 'Athlete',
  trainer: 'Trainer',
  strength_coach: 'Strength Coach',
  nutritionist: 'Nutritionist',
  physiotherapist: 'Physiotherapist',
  exercise_physiologist: 'Exercise Physiologist',
  rehab_specialist: 'Rehab Specialist',
  doctor: 'Doctor',
  yoga_pilates: 'Yoga & Pilates',
  accountant: 'Accountant',
  admin: 'Admin',
  mainadmin: 'MainAdmin',
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
  const universalBalance = Number.isFinite(profile.token_balance)
    ? Math.trunc(profile.token_balance)
    : Number(profile.fitTokens ?? 0);
  return {
    id: profile.uid,
    uid: profile.uid,
    email: profile.email,
    name,
    givenName: name.split(' ')[0],
    picture: profile.photoURL || profile.avatar || '',
    role: toAppRole(profile, profile.email),
    tokens: universalBalance,
    token_balance: universalBalance,
    registeredAt: profile.ptRegisteredAt || profile.registeredAt || profile.createdAt || '',
    source: 'firestore'
  };
}

// Create (as supporter) or refresh the signed-in user's profile and tag it with #pt.
// Universal tokens (token_balance) are never written here: only the server functions change them.
// With `register: false` it only refreshes existing #pt members and returns null otherwise.
export async function syncUserProfile(fbUser, { register = true } = {}) {
  const ref = doc(db, 'users', fbUser.uid);
  const snap = await getDoc(ref);
  const now = new Date().toISOString();

  if (!register && !(snap.exists() && (snap.data().apps || []).includes(APP_TAG))) {
    return null;
  }

  if (!snap.exists()) {
    const isSuper = isUserSuperAdmin(fbUser.email);
    const initialRole = isSuper ? 'superadmin' : 'supporter';
    const profile = {
      uid: fbUser.uid,
      id: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName || fbUser.email.split('@')[0],
      photoURL: fbUser.photoURL || '',
      role: initialRole,
      status: initialRole,
      classification: CLASSIFICATIONS[initialRole] || 'Supporter',
      isSuperAdmin: isSuper,
      source: APP_TAG,
      tag: APP_TAG,
      businessName: 'Trainer David',
      apps: [APP_TAG],
      token_balance: isSuper ? 9999 : 0,
      fitTokens: isSuper ? 9999 : 0,
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
  if (!existing.displayName && fbUser.displayName) patch.displayName = fbUser.displayName;
  if (!existing.photoURL && fbUser.photoURL) patch.photoURL = fbUser.photoURL;
  if (isUserSuperAdmin(fbUser.email) && existing.role !== 'superadmin') {
    patch.role = 'superadmin';
    patch.status = 'superadmin';
    patch.classification = 'Superadmin';
    patch.isSuperAdmin = true;
  }
  await updateDoc(ref, patch);

  const universalBalance = Number.isFinite(existing.token_balance)
    ? Math.trunc(existing.token_balance)
    : Number(existing.fitTokens ?? 0);

  return {
    ...existing,
    ...patch,
    apps: Array.from(new Set([...(existing.apps || []), APP_TAG])),
    loginCount: (existing.loginCount || 0) + 1,
    token_balance: universalBalance,
    fitTokens: universalBalance
  };
}

// Admin: list every Trainer David (#pt) member
export async function listPtUsers() {
  const snap = await getDocs(query(collection(db, 'users'), where('apps', 'array-contains', APP_TAG)));
  return snap.docs.map(d => toPanelUser({ uid: d.id, ...d.data() }));
}

// SuperAdmin or MainAdmin: change a member's role
export async function setUserRole(uid, role, byEmail, callerRole = '') {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    if (isUserSuperAdmin(data.email) && role !== 'superadmin') {
      throw new Error('SuperAdmin role is permanent and cannot be demoted or changed.');
    }
    if ((data.role === 'superadmin' || data.role === 'mainadmin') && callerRole === 'mainadmin') {
      throw new Error('MainAdmin cannot modify SuperAdmin or MainAdmin accounts.');
    }
  }
  if (callerRole === 'mainadmin' && (role === 'superadmin' || role === 'mainadmin')) {
    throw new Error('MainAdmin cannot assign SuperAdmin or MainAdmin credentials.');
  }
  const now = new Date().toISOString();
  await updateDoc(ref, {
    role,
    status: role,
    classification: CLASSIFICATIONS[role] || 'Supporter',
    role_updated_at: now,
    role_updated_by: byEmail || '',
    updatedAt: now
  });
}
