// Frontend service for Trainer Applications, Video Publishing, and 50/50 Video Unlocking
import { auth } from '../firebase';
import { fileTypeOf, checkFile } from './driveUploadApi';

async function callApi(path, options = {}) {
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
    const err = new Error(data.error || 'Request failed.');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// XHR upload for progress tracking to Google Drive resumable session
function putFileToDrive(uploadUrl, file, mimeType, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', mimeType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(e.loaded / e.total);
      }
    };
    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error('Google Drive accepted the credentials, but returned invalid response.'));
        }
      } else {
        reject(new Error(`Google Drive rejected credentials upload (HTTP ${xhr.status}).`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error while uploading credentials to Google Drive.'));
    xhr.send(file);
  });
}

// Upload applicant credentials directly to Google Drive
export async function uploadCredentialsToDrive(file, onProgress) {
  const problem = await checkFile(file);
  if (problem) throw new Error(problem);

  const mimeType = fileTypeOf(file);
  const { uploadUrl, folderPath, folderId, folderUrl } = await callApi('/api/trainer/start-credential-upload', {
    method: 'POST',
    body: {
      fileName: file.name,
      mimeType,
      size: file.size
    }
  });

  const driveData = await putFileToDrive(uploadUrl, file, mimeType, onProgress);
  return {
    fileId: driveData.id,
    fileName: driveData.name,
    fileSize: Number(driveData.size) || file.size,
    webViewLink: driveData.webViewLink,
    folderId,
    folderPath,
    folderUrl
  };
}

// Submit a new application to become a trainer or health & fitness professional
export async function submitTrainerApplication(applicationData) {
  return callApi('/api/trainer/submit-application', {
    method: 'POST',
    body: applicationData
  });
}

// SuperAdmin & MainAdmin: List all trainer applications
export async function listTrainerApplications() {
  const data = await callApi('/api/trainer/list-applications', { method: 'POST' });
  return data.applications || [];
}

// SuperAdmin & MainAdmin: Review (Approve or Reject) an application
export async function reviewTrainerApplication({ applicantUid, action, assignedRole, notes }) {
  return callApi('/api/trainer/review-application', {
    method: 'POST',
    body: { applicantUid, action, assignedRole, notes }
  });
}

// Trainers & Staff: Publish a workout video with custom token rate
export async function publishWorkoutVideo(videoData) {
  return callApi('/api/videos/publish', {
    method: 'POST',
    body: videoData
  });
}

// Public/Member: Fetch all published community videos
export async function fetchCommunityVideos() {
  const data = await callApi('/api/videos/list', { method: 'POST' });
  return data.videos || [];
}

// Public/Member: Unlock a video with 50/50 token revenue split
export async function unlockVideoWithSplit(videoId) {
  return callApi('/api/videos/unlock', {
    method: 'POST',
    body: { videoId }
  });
}

// Extract YouTube title, description, and thumbnail
export async function extractVideoMetadata(videoUrl) {
  return callApi('/api/videos/extract', {
    method: 'POST',
    body: { url: videoUrl }
  });
}

// Fetch all video IDs the authenticated user has unlocked for lifetime access
export async function fetchMyUnlockedVideos() {
  const data = await callApi('/api/videos/my-unlocks', { method: 'POST' });
  return data.unlockedVideoIds || [];
}


