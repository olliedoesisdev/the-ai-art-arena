// auth.ts
// This file configures NextAuth v5 for the AI Art Arena project.
// It defines authentication providers, session strategy, and callbacks
// that control how authentication works throughout the application.

import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'

// NextAuth v5 uses a different export pattern than v4.
// Instead of a default export with config, we export named functions
// that NextAuth generates for us based on our configuration.
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Providers define the authentication methods we support.
  // Each provider handles the OAuth flow or email verification for us.
  providers: [
    // GitHub OAuth provider allows users to sign in with their GitHub account.
    // The OAuth flow is: user clicks "Sign in with GitHub" -> redirected to GitHub
    // -> user authorizes our app -> GitHub redirects back with auth code ->
    // NextAuth exchanges code for user info -> session created.
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      // We request email scope so we can identify users uniquely.
      // GitHub might not give us the email if the user has it set to private,
      // but NextAuth handles that gracefully.
    }),

    // Resend provider sends magic link emails for passwordless authentication.
    // The flow is: user enters email -> we send email with signed link ->
    // user clicks link -> NextAuth verifies signature -> session created.
    // NOTE: Resend provider is commented out until we add database adapter
    // Resend({
    //   apiKey: process.env.RESEND_API_KEY,
    //   from: 'noreply@olliedoesis.dev',
    // }),
  ],

  // Session configuration controls how user sessions are stored and managed.
  session: {
    // JWT strategy means session data is stored in a signed token rather than
    // in a database. This is stateless and scales better because we do not
    // need to query a sessions table on every request. The tradeoff is that
    // we cannot revoke individual sessions until they expire.
    strategy: 'jwt',

    // Sessions last for 30 days. After that, users must sign in again.
    // This balances security (shorter is more secure) with user convenience
    // (longer means fewer sign-ins). 30 days is standard for web applications.
    maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
  },

  // Pages configuration customizes the URLs for authentication pages.
  // By default, NextAuth would use /api/auth/signin, but we want nicer URLs.
  pages: {
    signIn: '/signin',
    error: '/error',
    // We do not specify verifyRequest because we are fine with NextAuth's default
    // page that says "Check your email for the magic link."
  },

  // Callbacks allow us to customize what happens at various points in the
  // authentication flow. We can modify the session, the JWT token, or control
  // who can sign in.
  callbacks: {
    // The jwt callback is called whenever a JWT is created or updated.
    // We use it to add custom data to the token.
    async jwt({ token, user, account }) {
      // On initial sign-in, the user and account objects are populated.
      // We want to store the user's ID and email in the token so we can
      // access them in our application code.
      if (user) {
        token.id = user.id
        token.email = user.email
      }
      return token
    },

    // The session callback is called whenever we access session data
    // in our application. It receives the session and token objects.
    async session({ session, token }) {
      // Copy data from the token into the session object.
      // This is what our application code will actually see when it
      // calls await auth() to get the current user.
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
      }
      return session
    },
  },
})
