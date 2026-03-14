# Multi-User Architecture

## How It Works

**Each user logs into their own GitHub account** - the OAuth flow is per-user, not per-application.

### User Flow

1. **User A visits your site** → Clicks "Login with GitHub"
2. **GitHub OAuth** → User A authorizes with their own GitHub account
3. **Token stored** → User A's token is stored in their browser's httpOnly cookie
4. **User A scans** → Uses User A's token to access their private repos

5. **User B visits your site** → Same flow, but gets their own token
6. **User B scans** → Uses User B's token to access their private repos

### Key Points

- ✅ **Each user has their own session** - tokens are stored per-browser (httpOnly cookies)
- ✅ **Users can only access repos they have permission for** - based on their GitHub account
- ✅ **No shared credentials** - each user authenticates independently
- ✅ **Secure** - tokens never leave the server (httpOnly cookies)

### Example Scenarios

**Scenario 1: User A scans their private repo**
- User A logs in → Gets User A's token
- User A scans `github.com/UserA/private-repo`
- Scanner uses User A's token → Success ✅

**Scenario 2: User B scans their private repo**
- User B logs in → Gets User B's token  
- User B scans `github.com/UserB/private-repo`
- Scanner uses User B's token → Success ✅

**Scenario 3: User A tries to scan User B's private repo**
- User A logs in → Has User A's token
- User A scans `github.com/UserB/private-repo`
- Scanner uses User A's token → Fails (User A doesn't have access) ❌

**Scenario 4: Public repo (no login needed)**
- Anyone scans `github.com/public/repo`
- No token needed → Works for everyone ✅

## Technical Details

### Token Storage
- Tokens are stored in **httpOnly cookies** (not accessible to JavaScript)
- Each browser session has its own token
- Tokens expire after 7 days (configurable)

### Security
- Tokens are only sent to the scanner service (not exposed to frontend)
- Each user's token is isolated to their browser session
- No cross-user token sharing

### OAuth App Configuration
- Your GitHub OAuth App is shared by all users
- Each user authorizes the app with their own account
- The app gets a different token for each user

## Deployment Considerations

### For Production
1. **OAuth App**: Use the same OAuth App for all users (it's designed for this)
2. **Callback URL**: Set to your production domain
3. **Cookie Security**: Already configured for production (`secure: true` when `NODE_ENV=production`)
4. **HTTPS Required**: OAuth requires HTTPS in production

### Scaling
- Each user's session is independent
- No shared state between users
- Can scale horizontally (each instance handles its own sessions)

## Troubleshooting

**"User can't access their private repo"**
- Check if they're logged in (should see username in header)
- Verify the token is being passed (check browser dev tools → Network)
- Make sure the GitHub account has access to the repo

**"Token not working"**
- Token might have expired (7 days default)
- User might have revoked access on GitHub
- Solution: User needs to log out and log back in

