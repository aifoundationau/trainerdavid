import 'dotenv/config';
import { getDrive } from '../api/_lib/googleDrive.js';

async function main() {
  console.log('--- Google Drive Configuration Check ---');
  console.log('Client Email:', process.env.GOOGLE_CLIENT_EMAIL || '(not set)');
  console.log('Private Key length:', process.env.GOOGLE_PRIVATE_KEY?.length || 0);
  console.log('Root Folder ID:', process.env.ROOT_FOLDER_ID || '(not set)');
  console.log('Google App Credentials:', process.env.GOOGLE_APPLICATION_CREDENTIALS || '(not set)');

  if (!process.env.ROOT_FOLDER_ID) {
    console.error('ERROR: ROOT_FOLDER_ID is missing from .env');
    process.exit(1);
  }

  try {
    const drive = getDrive();
    console.log('\nQuerying Google Drive API for ROOT_FOLDER_ID:', process.env.ROOT_FOLDER_ID);
    const res = await drive.files.get({
      fileId: process.env.ROOT_FOLDER_ID,
      supportsAllDrives: true,
      fields: 'id, name, mimeType, capabilities, driveId, sharedWithMeTime, owners, permissions'
    });

    console.log('\nAPI Response Status: SUCCESS');
    console.log('Folder Name:', res.data.name);
    console.log('MIME Type:', res.data.mimeType);
    console.log('Shared Drive ID:', res.data.driveId || '(Standard Drive / None)');
    console.log('Can Add Children:', res.data.capabilities?.canAddChildren);
    console.log('Can List Children:', res.data.capabilities?.canListChildren);
    console.log('Capabilities:', JSON.stringify(res.data.capabilities, null, 2));

    // Test listing children or subfolders
    const listRes = await drive.files.list({
      q: `'${process.env.ROOT_FOLDER_ID}' in parents and trashed = false`,
      pageSize: 10,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      fields: 'files(id, name, mimeType)'
    });
    console.log('\nExisting items in ROOT_FOLDER (up to 10):', listRes.data.files);
  } catch (err) {
    console.error('\nAPI Response Status: FAILED');
    console.error('Error message:', err.message);
    if (err.response?.data) {
      console.error('API Error details:', JSON.stringify(err.response.data, null, 2));
    }
  }
}

main();
