// Uploads a file to Google Drive under <email>/<date>/ in two steps:
// 1. api/drive/start-upload checks the signed-in user, creates the folders and opens a Drive upload session.
// 2. The browser PUTs the file straight to that session, so file size isn't limited by Vercel.
import { auth } from '../firebase';

export const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

// Allowed types, with the extensions and first bytes each one must have
const FILE_TYPES = {
  'image/jpeg': { exts: ['jpg', 'jpeg'], magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png': { exts: ['png'], magic: (b) => [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((x, i) => b[i] === x) },
  'image/webp': { exts: ['webp'], magic: (b) => ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 12) === 'WEBP' },
  'application/pdf': { exts: ['pdf'], magic: (b) => ascii(b, 0, 5) === '%PDF-' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    exts: ['docx'],
    magic: (b) => b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04
  }
};

const ascii = (bytes, start, end) => String.fromCharCode(...bytes.subarray(start, end));

// Value for <input type="file" accept>
export const ACCEPT_ATTR = Object.entries(FILE_TYPES)
  .flatMap(([type, { exts }]) => [type, ...exts.map(ext => `.${ext}`)])
  .join(',');

const extOf = (name) => name.split('.').pop().toLowerCase();

// Browsers sometimes leave file.type blank (often for .docx), so fall back to the extension
export function fileTypeOf(file) {
  if (FILE_TYPES[file.type]?.exts.includes(extOf(file.name))) return file.type;
  return Object.keys(FILE_TYPES).find(type => FILE_TYPES[type].exts.includes(extOf(file.name))) || '';
}

// Returns an error message, or '' if the file can be uploaded
export async function checkFile(file) {
  const type = fileTypeOf(file);
  if (!type) return 'Only JPG, PNG, WEBP, PDF and DOCX files are allowed.';
  if (!file.size) return `${file.name} is empty.`;
  if (file.size > MAX_UPLOAD_BYTES) return `${file.name} is larger than the 100 MB limit.`;
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!FILE_TYPES[type].magic(head)) return `${file.name} isn't a valid ${extOf(file.name).toUpperCase()} file.`;
  return '';
}

async function startUpload(email, file, mimeType) {
  const fbUser = auth.currentUser;
  if (!fbUser) throw new Error('Sign in with Google to upload files.');

  const res = await fetch('/api/drive/start-upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${await fbUser.getIdToken()}`
    },
    body: JSON.stringify({ email: email.trim(), fileName: file.name, mimeType, size: file.size })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Could not start the upload.');
  return data;
}

// XHR rather than fetch, for upload progress events
function putFile(uploadUrl, file, mimeType, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', mimeType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error('Drive accepted the file but sent an unreadable reply.'));
        }
      } else {
        reject(new Error(`Google Drive rejected the upload (HTTP ${xhr.status}).`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error while uploading to Google Drive.'));
    xhr.send(file);
  });
}

// Returns { status, fileId, name, mimeType, size, webViewLink, createdTime, folderPath, folderId }
export async function uploadToDrive(email, file, onProgress) {
  const mimeType = fileTypeOf(file);
  const { uploadUrl, folderPath, folderId } = await startUpload(email, file, mimeType);
  const data = await putFile(uploadUrl, file, mimeType, onProgress);
  return {
    status: 'uploaded',
    fileId: data.id,
    name: data.name,
    mimeType: data.mimeType,
    size: Number(data.size),
    webViewLink: data.webViewLink,
    createdTime: data.createdTime,
    folderPath,
    folderId
  };
}

export function formatSize(bytes) {
  if (!bytes && bytes !== 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

