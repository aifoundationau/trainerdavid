# Trainer David

React (Vite) site with Vercel serverless functions in `api/` and Firebase for sign-in and data.

## Admin panel: Upload to Google Drive

The **📤 Upload** tab in the admin panel lets the SuperAdmin, admins and trainers send a file into Google Drive for a member. Each upload is filed as:

```
ROOT_FOLDER_ID/
└── member@example.com/        ← created on the first upload for that email
    └── 2026-10-23/            ← today's date (Australia/Sydney), created once per day
        └── progress-photo.jpg
```

- Accepted files: JPG, PNG, WEBP, PDF and DOCX, up to 100 MB.
- How an upload works:
  1. The browser checks the file's type, size and first bytes, then calls `POST /api/drive/start-upload`.
  2. The server checks the caller's Firebase sign-in and role, creates the email and date folders if needed, and opens a Drive [resumable upload session](https://developers.google.com/workspace/drive/api/guides/manage-uploads#resumable) fixed to that file's type and size.
  3. The browser sends the file straight to Google Drive, so it never passes through Vercel and isn't affected by Vercel's 4.5 MB request limit. Drive replies with the file's ID, size and link, which the form shows with the folder path.
- Code: `src/components/AdminUploadPanel.jsx` (form), `src/services/driveUploadApi.js` (client), `api/drive/start-upload.js` and `api/_lib/googleDrive.js` (server).

### 1. Create a service account and key

1. Open [Google Cloud Console → IAM & Admin → Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts) for your project (this app uses `ai-foundation-firebase`).
2. Click **Create service account**, name it (e.g. `gdrive-uploader`), and skip the optional role steps. It needs no project roles, only access to the Drive folder.
3. Open the account → **Keys → Add key → Create new key → JSON**. A `.json` file downloads. Treat it like a password.
4. Enable the **Google Drive API** for the project: [APIs & Services → Library → Google Drive API → Enable](https://console.cloud.google.com/apis/library/drive.googleapis.com).

### 2. Add the credentials

The server reads the key from environment variables. Use **one** of these options:

**Option A: the whole JSON in one variable**

```env
GOOGLE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...","client_email":"gdrive-uploader@ai-foundation-firebase.iam.gserviceaccount.com",...}
```

Paste the file's contents on a single line. In Vercel you can paste the file as-is into the value box.

**Option B: just the two fields that are needed**

```env
GOOGLE_CLIENT_EMAIL="gdrive-uploader@ai-foundation-firebase.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

Copy `client_email` and `private_key` from the JSON file. Keep the `\n` sequences as they are, because the server converts them back to line breaks.

Then set where uploads go:

```env
ROOT_FOLDER_ID="0AB6rUwSYF0xlUk9PVA"
```

Where to put them:

- **Local:** add them to `.env`. Never commit the key: `.env*` and `secrets/` are already in `.gitignore`, so keep any downloaded key file in `secrets/`.
- **Vercel:** Project → **Settings → Environment Variables**. Add the same variables, then redeploy.
- Never prefix these with `VITE_`, because that would ship the private key to every visitor's browser.

### 3. Share the root Drive folder with the service account

> **Use a Shared Drive.** Service accounts have no storage of their own, so uploads into a folder in someone's personal *My Drive* fail with `403 Service Accounts do not have storage quota`. Sharing a My Drive folder doesn't help. Files must go into a **Shared Drive**, which needs Google Workspace.

1. In [Google Drive](https://drive.google.com), go to **Shared drives → + New** and name it, for example `GDrive Uploader`. If you don't see *Shared drives*, ask your Workspace admin to enable them.
2. Open the Shared Drive → click its name → **Manage members**.
3. Add the service account's email, for example `gdrive-uploader@ai-foundation-firebase.iam.gserviceaccount.com`, as **Content manager**. Untick *Notify people*, because the address can't receive mail.
4. Copy the ID into `ROOT_FOLDER_ID`:
   - for the Shared Drive itself, it's the last part of the URL: `https://drive.google.com/drive/folders/`**`0AB6rUwSYF0xlUk9PVA`**
   - for a folder inside it, open the folder and copy the same part of its URL.

Content managers can add, edit and move files to the trash, but can't permanently delete them. Use **Manager** only if the app ever needs to delete files.

### 4. Test it

Run the app with the API routes (`vercel dev`, since plain `npm run dev` doesn't serve `api/`). Sign in with Google as an admin, open the admin panel → **📤 Upload**, enter an email, and drop a file. The "Uploaded this session" list links to the new file in Drive.

| Error | Fix |
| --- | --- |
| `Service Accounts do not have storage quota` | `ROOT_FOLDER_ID` is in a My Drive. Use a Shared Drive (step 3). |
| `File not found` / 404 on the root folder | The Shared Drive isn't shared with the service account, or the ID is wrong. |
| `invalid_grant` / `error:1E08010C` | `GOOGLE_PRIVATE_KEY` is truncated, or its `\n`s were lost. Copy it again from the JSON. |
| `Google Drive rejected the upload (HTTP 0)` or a CORS error in the console | The upload session was opened without the page's `Origin`, for example by a proxy that strips it. Open the upload from the same site the page is served from. |
| `Only admins and trainers can upload files.` | The signed-in user's Firestore `users/{uid}.role` isn't `admin` or `trainer`, and they aren't the SuperAdmin. |
