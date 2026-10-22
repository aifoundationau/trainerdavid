// Google Authentication Utilities using Google Identity Services (GIS)

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "614773274800-9pooin0jia9ij91qjlk7r6r6ne02mbhg.apps.googleusercontent.com";

const STORAGE_KEY = "trainer_david_user";

// Parse JWT token from Google Credential Response
export function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Failed to parse JWT:", e);
    return null;
  }
}

// Retrieve currently stored user
export function getStoredUser() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

// Save user in localStorage
export function setStoredUser(user) {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    console.error("Failed to persist user:", e);
  }
}

// Log out user
export function clearStoredUser() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  } catch (e) {
    console.error("Error during logout:", e);
  }
}
