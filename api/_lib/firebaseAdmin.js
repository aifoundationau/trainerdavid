// Shared Firebase Admin setup for Vercel functions. Files under api/_lib are not routes.
// Needs the FIREBASE_SERVICE_ACCOUNT env var (the whole service account JSON, no VITE_ prefix).
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')) });
}

export const adminAuth = getAuth();
export const db = getFirestore();

// Keep in sync with isSuperAdmin() in the Firestore security rules
const SUPERADMIN_UIDS = ['ZK79FRQoVlYhsgvMibhi81dRUWj2', 'L5euSJAfNKdDOX6mT0qmrCGjUA53'];
const SUPERADMIN_EMAILS = ['support@aifoundation.net.au', 'davidrobertson.info@gmail.com', 'david@aifoundation.com.au'];

export function isSuperAdmin(decoded) {
  return SUPERADMIN_UIDS.includes(decoded.uid) ||
    (decoded.email_verified === true && SUPERADMIN_EMAILS.includes(decoded.email));
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Verify the caller's Firebase ID token from "Authorization: Bearer <token>"
export async function requireUser(req) {
  const match = (req.headers.authorization || '').match(/^Bearer (.+)$/);
  if (!match) throw new HttpError(401, 'Sign in with Google first.');
  try {
    return await adminAuth.verifyIdToken(match[1]);
  } catch {
    throw new HttpError(401, 'Your sign-in has expired. Please sign in with Google again.');
  }
}

// Atomically change a member's universal token balance and record it in global token_ledger.
// `entryId` makes the change happen at most once (idempotent transaction key).
export async function changeTokens(uid, delta, entry, entryId) {
  const userRef = db.collection('users').doc(uid);
  const globalLedgerRef = entryId ? db.collection('token_ledger').doc(entryId) : db.collection('token_ledger').doc();
  const PARTITION_KEY = { tag: 'pt', businessId: 'pt', businessName: 'Trainer David', source: 'pt' };

  return db.runTransaction(async (tx) => {
    const [userSnap, ledgerSnap] = await Promise.all([tx.get(userRef), tx.get(globalLedgerRef)]);
    if (!userSnap.exists) throw new HttpError(404, 'Member not found.');
    if (entryId && ledgerSnap.exists) throw new HttpError(409, 'This has already been applied.');

    const currentRaw = userSnap.get('token_balance') ?? userSnap.get('fitTokens') ?? 0;
    const balance = Number.isFinite(currentRaw) ? Math.trunc(currentRaw) : 0;
    const next = balance + Math.trunc(delta);
    if (next < 0) throw new HttpError(400, `Not enough tokens (you have ${balance}).`);

    const now = new Date().toISOString();
    tx.update(userRef, { token_balance: next, fitTokens: next, updatedAt: now });
    tx.set(globalLedgerRef, {
      ...PARTITION_KEY,
      ...entry,
      uid,
      delta: Math.trunc(delta),
      balanceAfter: next,
      createdAt: now,
      at: FieldValue.serverTimestamp()
    });
    return { balance: next, email: userSnap.get('email') || '' };
  });
}

// Wrap a handler: POST only, JSON errors
export function handler(fn) {
  return async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    try {
      res.status(200).json(await fn(req));
    } catch (err) {
      if (!(err instanceof HttpError)) console.error(err);
      res.status(err.status || 500).json({ error: err.status ? err.message : 'Server error' });
    }
  };
}
