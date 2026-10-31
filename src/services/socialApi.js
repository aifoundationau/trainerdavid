// Client-side API client for Social Posts (Instagram & Facebook)
import { auth } from '../firebase';
import { INITIAL_SOCIAL_POSTS } from '../data/socialPosts';

async function getAuthHeader() {
  const user = auth.currentUser;
  if (!user) return {};
  try {
    const token = await user.getIdToken();
    return { Authorization: `Bearer ${token}` };
  } catch {
    return {};
  }
}

export async function fetchSocialPosts() {
  try {
    const headers = await getAuthHeader();
    const res = await fetch('/api/social/list', { headers });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.posts) && data.posts.length > 0) {
        return data.posts;
      }
    }
  } catch (err) {
    console.warn('Could not fetch social posts from /api/social/list:', err.message);
  }
  return INITIAL_SOCIAL_POSTS;
}

export async function publishSocialPost(payload) {
  const headers = await getAuthHeader();
  const res = await fetch('/api/social/publish', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Failed to publish social post.');
  }
  return data;
}

export async function unlockSocialPost(postId) {
  const headers = await getAuthHeader();
  const res = await fetch('/api/social/unlock', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify({ postId })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Failed to unlock social post.');
  }
  return data;
}

export async function messageSocialCreator({ postId, message }) {
  const headers = await getAuthHeader();
  const res = await fetch('/api/social/message-creator', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify({ postId, message })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Failed to send message to creator.');
  }
  return data;
}

export async function deleteSocialPost(postId) {
  const headers = await getAuthHeader();
  const res = await fetch('/api/social/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify({ postId })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Failed to delete post.');
  }
  return data;
}
