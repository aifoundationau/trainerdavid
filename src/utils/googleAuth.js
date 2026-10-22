// Stored user session helpers (identity comes from Firebase Auth, see src/firebase.js)

const STORAGE_KEY = "trainer_david_user";

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
  } catch (e) {
    console.error("Error during logout:", e);
  }
}
