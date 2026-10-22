# Google Drive MCP Setup for Claude (Start to Finish)

Connects your Google Drive to Claude, so Claude (in claude.ai and in Claude Code in VS Code) can search and read your Drive files.

This is separate from the website's **Admin → 📤 Upload** feature (see `GOOGLE_DRIVE_SETUP.md`). The MCP connector signs in as **you** with Google, not as the `gdrive-uploader` service account, and needs no keys or `.env` entries.

## 1. Check your accounts

1. Decide which Google account Claude should read, e.g. support@aifoundation.net.au.
2. Make sure you know which claude.ai account you use in VS Code. Claude Code shows it under `/status`.
3. Use the same claude.ai account for every step below.

## 2. Connect Google Drive in claude.ai

4. Open https://claude.ai in your browser and sign in with your Claude account.
5. Click your name or initials (bottom left), then **Settings**.
6. Open the **Connectors** section.
7. Find **Google Drive** in the list.
8. Click **Connect**.
9. In the Google window that opens, choose the Google account from step 1.
10. Review the permissions Google shows and click **Allow**.
11. Check that Google Drive now shows as **Connected** in Settings → Connectors.

## 3. If your Workspace blocks the connection

12. If Google says "Access blocked" or "This app is blocked", sign in to https://admin.google.com as a Workspace admin.
13. Go to **Security → Access and data control → API controls → Manage Third-Party App Access**.
14. Find the Claude app and set it to **Trusted** (or **Limited** with Drive access).
15. Go back to step 8 and connect again.

## 4. Make it available in Claude Code (VS Code)

16. Save your work in VS Code.
17. Press **Ctrl+Shift+P**, run **Developer: Reload Window**, and start a new Claude Code conversation.
18. In the Claude Code chat, type `/mcp` and press Enter.
19. Confirm a **Google Drive** entry appears with a connected status.
20. If it doesn't appear, run `/status` and check that Claude Code is signed in to the same claude.ai account as step 4.
21. If it still doesn't appear, run `/logout`, then `/login` with the same claude.ai account, and repeat step 17.

## 5. Test the connection

22. Ask Claude: "List my 5 most recently modified Google Drive files."
23. Approve the tool call if Claude Code asks for permission.
24. Check that the file names match what you see at https://drive.google.com.
25. Ask Claude: "Search my Google Drive for files in the GDrive Uploader shared drive." This confirms Shared Drive access too.

## 6. Keep it working

26. If Claude later says it can't reach Drive, open claude.ai → Settings → Connectors and click **Disconnect**, then **Connect** again.
27. If you change your Google password or revoke access at https://myaccount.google.com/permissions, reconnect with step 8.
28. To remove Claude's access at any time, click **Disconnect** in claude.ai → Settings → Connectors, and remove Claude at https://myaccount.google.com/permissions.

## 7. Good to know

29. Claude can only see files your Google account can see.
30. Claude Code's tool permissions still apply. You approve or deny Drive tool calls like any other tool.
31. The `gdrive-uploader` service account key is **not** used for this. Never paste that key into claude.ai or an MCP configuration.
