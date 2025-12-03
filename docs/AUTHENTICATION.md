# Authentication System Documentation

## Overview

AI Art Arena uses NextAuth v5 for authentication with two provider options:

1. GitHub OAuth (social login)
2. Email magic links (passwordless)

## Architecture

### Components

- **auth.ts** - NextAuth configuration defining providers and callbacks
- **app/api/auth/[...nextauth]/route.ts** - API endpoints for auth flows
- **app/(auth)/signin/page.tsx** - Sign-in UI
- **lib/auth/utils.ts** - Helper functions for checking auth state
- **middleware.ts** - Route protection and security headers

### Flow Diagrams

#### GitHub OAuth Flow

```
User clicks "Sign in with GitHub"
  ↓
Redirected to GitHub authorization page
  ↓
User authorizes AI Art Arena
  ↓
GitHub redirects back with authorization code
  ↓
NextAuth exchanges code for user information
  ↓
Session created with JWT token
  ↓
User redirected to home page
```

#### Magic Link Flow

```
User enters email and clicks "Send Magic Link"
  ↓
NextAuth generates signed token
  ↓
Resend sends email with link containing token
  ↓
User clicks link in email
  ↓
NextAuth validates token signature
  ↓
Session created with JWT token
  ↓
User redirected to home page
```

## Session Management

Sessions use JWT strategy rather than database storage. This means:

- **Stateless**: No database queries needed to check if user is signed in
- **Scalable**: Each request is independent
- **Trade-off**: Cannot revoke individual sessions until they expire

Sessions expire after 30 days. Users must sign in again after expiration.

## Protected Routes

Routes requiring authentication are configured in middleware.ts:

- `/profile` - User profile page
- `/admin` - Admin dashboard (future)

Attempting to access these routes without authentication redirects to `/signin`.

## Helper Functions

### getCurrentUser()

```typescript
const session = await getCurrentUser()
if (session) {
  // User is signed in
  const userId = session.user.id
}
```

### requireAuth()

```typescript
// Automatically redirects to sign-in if not authenticated
const session = await requireAuth()
// If we get here, user is definitely signed in
```

### isAuth()

```typescript
const authenticated = await isAuth()
if (!authenticated) {
  // Handle unauthenticated state
}
```

### getUserId()

```typescript
const userId = await getUserId()
// Returns user ID or null
```

## Environment Variables Required

```bash
# NextAuth
NEXTAUTH_SECRET=           # Generate with: openssl rand -base64 32
NEXTAUTH_URL=             # http://localhost:3000 in dev

# GitHub OAuth
GITHUB_CLIENT_ID=         # From GitHub OAuth app
GITHUB_CLIENT_SECRET=     # From GitHub OAuth app

# Email (Resend)
RESEND_API_KEY=          # From Resend dashboard
```

## Setting Up GitHub OAuth

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - Application name: AI Art Arena (Development)
   - Homepage URL: http://localhost:3000
   - Authorization callback URL: http://localhost:3000/api/auth/callback/github
4. Click "Register application"
5. Copy Client ID to GITHUB_CLIENT_ID in .env.local
6. Generate a new client secret and copy to GITHUB_CLIENT_SECRET

For production, create a separate OAuth app with production URLs.

## Setting Up Resend

1. Go to https://resend.com
2. Sign up for an account
3. Verify your domain (required for sending emails)
4. Create an API key
5. Copy to RESEND_API_KEY in .env.local

## Security Considerations

- **Secrets**: Never commit .env.local files
- **HTTPS**: Production must use HTTPS (Vercel handles this)
- **CSRF**: NextAuth includes CSRF protection automatically
- **Rate limiting**: Not implemented at auth level (users can attempt many sign-ins)
- **Email verification**: Not required (trust GitHub/email provider verification)

## Testing

### Manual Testing Checklist

- [ ] Sign-in page loads at /signin
- [ ] GitHub button redirects to GitHub
- [ ] Magic link sends email
- [ ] Clicking magic link creates session
- [ ] Protected routes redirect when not signed in
- [ ] Profile page accessible when signed in
- [ ] Sign-out works correctly
- [ ] Session persists across page reloads
- [ ] Session expires after 30 days

### Common Issues

**"Missing NEXTAUTH_SECRET"**

- Generate secret with `openssl rand -base64 32`
- Add to .env.local

**"GitHub OAuth fails"**

- Check callback URL matches exactly
- Verify client ID and secret are correct
- Make sure OAuth app is active on GitHub

**"Magic link not received"**

- Check spam folder
- Verify domain is verified in Resend
- Check Resend API key is correct
- Review Resend dashboard for delivery logs

## Future Enhancements

Potential improvements to authentication system:

- Add Google OAuth provider
- Add Apple OAuth provider
- Implement role-based access control (admin vs user)
- Add account linking (connect multiple providers)
- Add two-factor authentication
- Add session management page (see active sessions)
