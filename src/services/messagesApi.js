// Frontend service for Community & Creator Messaging inside Admin Panel
import { auth } from '../firebase';

async function callMessageApi(path, options = {}) {
  const fbUser = auth.currentUser;
  const headers = {
    'Content-Type': 'application/json',
    ...(fbUser ? { Authorization: `Bearer ${await fbUser.getIdToken()}` } : {}),
    ...(options.headers || {})
  };

  const res = await fetch(path, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Messaging request failed.');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function fetchMessages() {
  return callMessageApi('/api/messages/list', { method: 'POST' });
}

export async function sendDirectMessage({ recipientUid, message, videoId, videoTitle, postId, postTitle }) {
  return callMessageApi('/api/messages/send', {
    method: 'POST',
    body: { recipientUid, message, videoId, videoTitle, postId, postTitle }
  });
}

export async function markMessageAsRead(messageId) {
  return callMessageApi('/api/messages/mark-read', {
    method: 'POST',
    body: { messageId }
  });
}

export async function updateCreatorMessageRate(messageTokenCost) {
  return callMessageApi('/api/users/update-rates', {
    method: 'POST',
    body: { messageTokenCost }
  });
}

