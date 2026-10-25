// POST /api/trainer/start-credential-upload  { fileName, mimeType, size }
// Creates ROOT_FOLDER_ID/Trainer Applications/<applicant_email>/ on Google Drive,
// then opens a resumable upload session for the applicant's credentials.
import { handler, requireUser, HttpError } from '../_lib/firebaseAdmin.js';
import { ensureFolder, startResumableUpload } from '../_lib/googleDrive.js';

const MAX_BYTES = 100 * 1024 * 1024; // 100 MB max

const FILE_TYPES = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'application/pdf': ['pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx']
};

export default handler(async (req) => {
  const user = await requireUser(req);
  const email = String(user.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    throw new HttpError(400, 'A valid Google email is required.');
  }

  const rootId = process.env.ROOT_FOLDER_ID;
  if (!rootId) throw new Error('ROOT_FOLDER_ID is not configured.');

  const { fileName: rawName, mimeType, size } = req.body || {};
  const fileName = String(rawName || '').trim();
  if (!fileName || fileName.length > 200) throw new HttpError(400, 'Missing or invalid file name.');

  const ext = fileName.split('.').pop().toLowerCase();
  if (!FILE_TYPES[mimeType]?.includes(ext)) {
    throw new HttpError(400, 'Only JPG, PNG, WEBP, PDF and DOCX files are allowed.');
  }

  const bytes = Number(size);
  if (!Number.isInteger(bytes) || bytes <= 0) throw new HttpError(400, 'The file is empty.');
  if (bytes > MAX_BYTES) throw new HttpError(413, 'File is too large (100 MB max).');

  // Create or retrieve folder: ROOT_FOLDER_ID / "Trainer Applications" / <email>
  const appsFolderId = await ensureFolder(rootId, 'Trainer Applications');
  const applicantFolderId = await ensureFolder(appsFolderId, email);

  const uploadUrl = await startResumableUpload({
    name: fileName,
    parentId: applicantFolderId,
    mimeType,
    size: bytes,
    origin: req.headers.origin,
    fields: 'id,name,mimeType,size,webViewLink,createdTime'
  });

  if (!uploadUrl) throw new Error('Drive did not return an upload session URL.');

  return {
    uploadUrl,
    folderPath: `Trainer Applications/${email}`,
    folderId: applicantFolderId,
    folderUrl: `https://drive.google.com/drive/folders/${applicantFolderId}`
  };
});
