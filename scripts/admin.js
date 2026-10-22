// Shared Firebase Admin SDK setup for local scripts. Never import this from src/.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const defaultKeyPath = fileURLToPath(new URL('../secrets/service-account.json', import.meta.url));

function resolveCredential() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return applicationDefault();
  if (existsSync(defaultKeyPath)) return cert(JSON.parse(readFileSync(defaultKeyPath, 'utf8')));
  throw new Error(
    'No service account key found. Put it at secrets/service-account.json ' +
      'or set GOOGLE_APPLICATION_CREDENTIALS to its path.'
  );
}

initializeApp({ credential: resolveCredential(), projectId: 'ai-foundation-firebase' });

export const auth = getAuth();
export const db = getFirestore();
