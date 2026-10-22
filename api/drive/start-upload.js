// POST /api/drive/start-upload  { email, fileName, mimeType, size }  (SuperAdmin, admin or trainer)
// Makes sure ROOT_FOLDER_ID/<email>/<YYYY-MM-DD>/ exists in Google Drive, then opens a resumable
// upload session there. The browser PUTs the file to the returned uploadUrl, and Drive replies
// with the new file's id, name, size and link.
import { handler, requireUser, isSuperAdmin, db, HttpError } from '../_lib/firebaseAdmin.js';
import { ensureFolder, startResumableUpload } from '../_lib/googleDrive.js';

const MAX_BYTES = 100 * 1024 * 1024;
const UPLOAD_ROLES = ['admin', 'trainer'];
// Date folders follow the business's local day, not the server's UTC day
const TIMEZONE = 'Australia/Sydney';

const FILE_TYPES = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'application/pdf': ['pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx']
};

async function canUpload(user) {
  if (isSuperAdmin(user)) return true;
  const profile = await db.collection('users').doc(user.uid).get();
  return UPLOAD_ROLES.includes((profile.get('role') || '').toLowerCase());
}

export default handler(async (req) => {
  const user = await requireUser(req);
  if (!(await canUpload(user))) throw new HttpError(403, 'Only admins and trainers can upload files.');

  const rootId = process.env.ROOT_FOLDER_ID;
  if (!rootId) throw new Error('ROOT_FOLDER_ID is not set.');

  const { email: rawEmail, fileName: rawName, mimeType, size } = req.body || {};
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!/^[^\s@/\\]+@[^\s@/\\]+\.[^\s@/\\]+$/.test(email)) throw new HttpError(400, 'Enter a valid email address.');

  const fileName = String(rawName || '').trim();
  if (!fileName || fileName.length > 200) throw new HttpError(400, 'Missing file name.');

  const ext = fileName.split('.').pop().toLowerCase();
  if (!FILE_TYPES[mimeType]?.includes(ext)) throw new HttpError(400, 'Only JPG, PNG, WEBP, PDF and DOCX files are allowed.');

  const bytes = Number(size);
  if (!Number.isInteger(bytes) || bytes <= 0) throw new HttpError(400, 'The file is empty.');
  if (bytes > MAX_BYTES) throw new HttpError(413, 'File is too large (100 MB max).');

  const date = new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date()); // YYYY-MM-DD
  const emailFolderId = await ensureFolder(rootId, email);
  const dateFolderId = await ensureFolder(emailFolderId, date);

  const uploadUrl = await startResumableUpload({
    name: fileName,
    parentId: dateFolderId,
    mimeType,
    size: bytes,
    origin: req.headers.origin,
    fields: 'id,name,mimeType,size,webViewLink,createdTime'
  });
  if (!uploadUrl) throw new Error('Drive did not return an upload session URL.');

  return { uploadUrl, folderPath: `${email}/${date}`, folderId: dateFolderId };
});
