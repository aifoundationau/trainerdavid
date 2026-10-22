// Google Drive client for Vercel functions, signed in as the upload service account.
// Credentials: GOOGLE_SERVICE_ACCOUNT (the whole key JSON), or GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY.
import { google } from 'googleapis';

const FOLDER_MIME = 'application/vnd.google-apps.folder';

function credentials() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT) {
    const { client_email, private_key } = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
    return { client_email, private_key };
  }
  return {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    // Env vars often store the key with literal "\n" sequences
    private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
  };
}

let auth;
let drive;
function getAuth() {
  auth ??= new google.auth.GoogleAuth({
    credentials: credentials(),
    scopes: ['https://www.googleapis.com/auth/drive']
  });
  return auth;
}

export function getDrive() {
  drive ??= google.drive({ version: 'v3', auth: getAuth() });
  return drive;
}

// Open a resumable upload session so the browser can send the file straight to Drive
// (Vercel caps request bodies at 4.5 MB). Google pins the session to this exact type and size,
// and allows browser requests from `origin`. Returns the session URL the browser PUTs the file to.
export async function startResumableUpload({ name, parentId, mimeType, size, origin, fields }) {
  const client = await getAuth().getClient();
  const res = await client.request({
    url: 'https://www.googleapis.com/upload/drive/v3/files',
    method: 'POST',
    params: { uploadType: 'resumable', supportsAllDrives: true, fields },
    headers: {
      'X-Upload-Content-Type': mimeType,
      'X-Upload-Content-Length': String(size),
      ...(origin ? { Origin: origin } : {})
    },
    data: { name, parents: [parentId] }
  });
  return res.headers.get?.('location') || res.headers.location;
}

// Return the id of the folder `name` directly inside `parentId`, creating it if missing.
// Works in My Drive and Shared Drives (service accounts can only upload into Shared Drives).
export async function ensureFolder(parentId, name) {
  const escaped = name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const { data } = await getDrive().files.list({
    q: `'${parentId}' in parents and name = '${escaped}' and mimeType = '${FOLDER_MIME}' and trashed = false`,
    fields: 'files(id)',
    pageSize: 1,
    corpora: 'allDrives',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true
  });
  if (data.files.length) return data.files[0].id;

  const created = await getDrive().files.create({
    requestBody: { name, mimeType: FOLDER_MIME, parents: [parentId] },
    fields: 'id',
    supportsAllDrives: true
  });
  return created.data.id;
}
