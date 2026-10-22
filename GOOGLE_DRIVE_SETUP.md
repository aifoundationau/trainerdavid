# Google Drive Upload Setup (Start to Finish)

Sets up the **Admin → 📤 Upload** tab, which saves files to Google Drive as `ROOT_FOLDER_ID/<email>/<YYYY-MM-DD>/<file>`.

## 1. Google Cloud: create the service account

1. Go to https://console.cloud.google.com and sign in with your Google Workspace admin account.
2. In the project picker at the top, select the project **ai-foundation-firebase**.
3. Open **APIs & Services → Library**.
4. Search for **Google Drive API** and click **Enable**.
5. Open **IAM & Admin → Service Accounts**.
6. Click **+ Create service account**.
7. Enter the name `gdrive-uploader` and click **Create and continue**.
8. Skip the optional role and user-access steps and click **Done**. The account needs no project roles.
9. Copy the service account email: `gdrive-uploader@ai-foundation-firebase.iam.gserviceaccount.com`.

## 2. Google Cloud: create and save the key

10. Click the `gdrive-uploader` service account.
11. Open the **Keys** tab.
12. Click **Add key → Create new key**.
13. Choose **JSON** and click **Create**. A `.json` file downloads.
14. Move the downloaded file to `E:\Antigravity Projects\Trainer David\secrets\gdrive-uploader.json`.
15. Never put the key file anywhere else in the project. Only `secrets/` and `.env*` are ignored by git.
16. Delete the original copy from your Downloads folder.

## 3. Google Drive: create the Shared Drive

17. Go to https://drive.google.com and sign in with your Workspace account (e.g. support@aifoundation.net.au).
18. In the left sidebar, click **Shared drives**. If it's missing, ask your Workspace admin to enable Shared Drives.
19. Click **+ New**, name it `GDrive Uploader`, and click **Create**.
20. Do not use a normal My Drive folder. Service accounts have no storage quota, so uploads there fail with a 403 error.

## 4. Google Drive: give the service account access

21. Open the `GDrive Uploader` Shared Drive.
22. Click the drive name at the top, then **Manage members**.
23. Paste `gdrive-uploader@ai-foundation-firebase.iam.gserviceaccount.com`.
24. Set its role to **Content manager**.
25. Untick **Notify people**, because the service account can't receive email.
26. Click **Share**.

## 5. Google Drive: copy the root folder ID

27. Open the Shared Drive (or a folder inside it, if you want uploads to go into that folder).
28. Copy the ID from the browser address bar, which is the part after `/folders/`: `https://drive.google.com/drive/folders/`**`0AB6rUwSYF0xlUk9PVA`**.

## 6. Local setup: environment variables

29. Open `E:\Antigravity Projects\Trainer David\.env` in VS Code.
30. Add `ROOT_FOLDER_ID="<the ID from step 28>"`.
31. Open `secrets\gdrive-uploader.json` and copy the `client_email` value.
32. Add `GOOGLE_CLIENT_EMAIL="<client_email>"` to `.env`.
33. Copy the `private_key` value from the same file, exactly as written, including every `\n`.
34. Add `GOOGLE_PRIVATE_KEY="<private_key>"` to `.env`. It should be about 1,700 characters long.
35. Add `GOOGLE_APPLICATION_CREDENTIALS="./secrets/gdrive-uploader.json"` to `.env`.
36. Make sure `FIREBASE_SERVICE_ACCOUNT` is already set in `.env`, because the upload route uses it to check who's signed in.
37. Never prefix any of these with `VITE_`, because that would publish the private key in the website.
38. Save `.env`.

## 7. Local setup: install and run

39. Open a terminal in VS Code (**Terminal → New Terminal**).
40. Run `npm install` to install dependencies (including `googleapis`).
41. Run `npm run dev -- --port 3001`. Port 3000 is used by another project on this PC.
42. Keep that terminal open while you use the site.
43. If you get `EPERM ... node_modules\.vite\deps`, stop all dev servers, delete `node_modules\.vite`, and run step 41 again.

## 8. Test the upload locally

44. Open http://localhost:3001 in your browser.
45. Sign in with **Google**, not Password Backup, because uploads need a Google sign-in.
46. Use the SuperAdmin account, or an account whose Firestore role is `admin` or `trainer`.
47. Open the **Admin panel**.
48. Click the **📤 Upload** tab.
49. Check that the **Email Address** field shows your signed-in email, or change it to a member's email.
50. Drag a JPG, PNG, WEBP, PDF or DOCX file (up to 100 MB) onto the dropzone, or click it to choose a file.
51. Click **Upload** and wait for the progress bar to finish. The first upload can take about 30 seconds to start.
52. Check that a green "Uploaded" entry appears with a link to the file.
53. In Google Drive, open `GDrive Uploader → <email> → <today's date>` and confirm the file is there.

## 9. Production: Vercel environment variables

54. Go to https://vercel.com and open this project.
55. Open **Settings → Environment Variables**.
56. Add `ROOT_FOLDER_ID` with the same value as in `.env`.
57. Add `GOOGLE_CLIENT_EMAIL` with the same value as in `.env`.
58. Add `GOOGLE_PRIVATE_KEY` with the same value as in `.env`, including every `\n`.
59. Check that `FIREBASE_SERVICE_ACCOUNT` is already set in Vercel.
60. Don't add `GOOGLE_APPLICATION_CREDENTIALS` to Vercel, because the key file isn't deployed.
61. Apply each variable to **Production** and **Preview**.

## 10. Production: deploy and test

62. Commit your code changes. Never commit `.env` or anything in `secrets/`.
63. Run `git status` and confirm no key file or `.env` file is listed before you commit.
64. Push to `master`, or click **Redeploy** in Vercel, so the new environment variables take effect.
65. Open the live site, sign in with Google, and repeat steps 47–53.

## 11. If something goes wrong

66. `Could not start the upload.` means the `/api/drive/start-upload` route isn't running. Start the site with step 41, not a plain `vite` on another project's port.
67. `Service Accounts do not have storage quota` means `ROOT_FOLDER_ID` points to a My Drive folder. Use the Shared Drive ID (steps 17–28).
68. `File not found` or a 404 on the root folder means the service account isn't a member of the Shared Drive, or the ID is wrong (steps 21–28).
69. `invalid_grant` or a private key error means `GOOGLE_PRIVATE_KEY` is cut short or lost its `\n`s. Copy it again (step 33).
70. `Only admins and trainers can upload files.` means the signed-in user's Firestore `users/{uid}.role` isn't `admin` or `trainer`, and they aren't the SuperAdmin.
71. `Sign in with Google first.` means you signed in with Password Backup. Sign out and sign in with Google.
72. A blank page under `vercel dev` means the rewrite in `vercel.json` must exclude `/@` and file paths (already fixed in this project).
73. If the Vercel CLI asks for an email code that never arrives, log in with the same method you signed up with (Google or GitHub), or skip it and use step 41.
74. A test file the service account uploaded can't be permanently deleted by it, because Content managers can only move files to the trash. Delete leftovers yourself in Drive.
