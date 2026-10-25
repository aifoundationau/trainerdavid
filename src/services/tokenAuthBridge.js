// Bridge between Trainer David Firebase Authentication and the universal token kit (PROCESS 119 - 132).
// 1. Injects the signed-in user's Firebase ID token into /api/tokens, /api/profile, /api/exchange-rates.
// 2. Calls POST /api/profile/sync upon Google sign-in to guarantee universal token profile readiness.
// 3. Exposes window.appAuth and fires 'appAuthChanged' for vanilla / tokens-ui.js compatibility.
import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, logoutUser } from '../firebase';

const TOKEN_API = /^\/api\/(tokens|profile|exchange-rates)(\/|$)/;

const nativeFetch = window.fetch.bind(window);

window.fetch = async (input, init = {}) => {
  const rawUrl = typeof input === 'string' ? input : (input instanceof URL ? input.href : input.url);
  const url = new URL(rawUrl, window.location.origin);
  const user = auth.currentUser;
  if (user && url.origin === window.location.origin && TOKEN_API.test(url.pathname)) {
    try {
      const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${await user.getIdToken()}`);
      }
      init = { ...init, headers };
    } catch (e) {
      console.warn('[Tokens] Could not attach ID token:', e.message);
    }
  }
  return nativeFetch(input, init);
};

// Vanilla bridge for tokens-ui.js
window.appAuth = {
  signIn: () => signInWithGoogle(),
  signOut: () => logoutUser(),
  currentUser: () => auth.currentUser
};

onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      await fetch('/api/profile/sync', { method: 'POST' });
    } catch (e) {
      console.warn('[Tokens] Profile sync failed:', e.message);
    }
  }
  window.appAuthState = { user: user || null };
  window.dispatchEvent(new CustomEvent('appAuthChanged', { detail: { user: user || null } }));
});
