# GitHub OAuth Setup Instructions

This guide will help you set up GitHub OAuth so the scanner can access private repositories.

## Step 1: Create a GitHub OAuth App

1. Go to [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the form:
   - **Application name**: `GitGuard Scanner` (or any name you prefer)
   - **Homepage URL**: `http://localhost:3000` (or your production URL)
   - **Authorization callback URL**: `http://localhost:3000/api/auth/github/callback` (or your production callback URL)
4. Click **"Register application"**
5. You'll see your **Client ID** and need to generate a **Client Secret**:
   - Click **"Generate a new client secret"**
   - Copy the secret immediately (you won't see it again!)

## Step 2: Configure Environment Variables

**⚠️ IMPORTANT: The `.env` file is required for OAuth to work!**

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and add your GitHub OAuth credentials:
   ```env
   GITHUB_CLIENT_ID=your_client_id_here
   GITHUB_CLIENT_SECRET=your_client_secret_here
   GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   GITLEAKS_SERVICE_URL=http://localhost:3001
   ```

## Step 3: Restart the Frontend

After adding the environment variables, restart your Next.js frontend:

```bash
cd frontend
npm run dev
```

## Step 4: Test the Integration

1. Open `http://localhost:3000`
2. Click **"Login with GitHub"** in the header
3. Authorize the application on GitHub
4. You should be redirected back and see your GitHub username in the header
5. Try scanning a private repository you have access to

## How It Works

1. **User clicks "Login with GitHub"** → Redirects to GitHub OAuth
2. **User authorizes** → GitHub redirects back with a code
3. **Frontend exchanges code for token** → Stores token in httpOnly cookie
4. **When scanning** → Token is passed to the scanner service
5. **Scanner uses token** → Clones private repos using authenticated git clone

## Security Notes

- The GitHub token is stored in an **httpOnly cookie** (not accessible to JavaScript)
- The token is only sent to the scanner service (not exposed to the frontend)
- The scanner uses the token only for git clone operations
- Tokens expire after 7 days (configurable in the callback route)

## Troubleshooting

### "GitHub OAuth not configured"
- Make sure `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set in your `.env` file
- Restart the Next.js dev server after adding env vars

### "Invalid state" error
- This usually means the OAuth flow was interrupted
- Try logging in again

### Can't clone private repos
- Make sure you're logged in (check the header for your username)
- Verify the token is being passed (check browser dev tools → Network → scan request)
- Make sure the GitHub account has access to the private repository

### Production Setup

For production, update:
1. GitHub OAuth App callback URL to your production domain
2. `NEXT_PUBLIC_APP_URL` to your production URL
3. `GITHUB_CALLBACK_URL` to match
4. Use `secure: true` for cookies (already set when `NODE_ENV=production`)

