// app/(auth)/signin/page.tsx
// This is the sign-in page where users choose their authentication method.
// It is a Server Component, which means it renders on the server and sends
// plain HTML to the browser. This is better for SEO and initial page load speed.

import { signIn } from '@/auth'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'

// Before showing the sign-in page, we check if the user is already signed in.
// If they are, we should redirect them to the home page rather than showing
// the sign-in form. This prevents confusion and improves user experience.
export default async function SignInPage() {
  // The auth() function returns the current session if one exists.
  const session = await auth()

  // If there is a session, the user is already signed in.
  if (session) {
    redirect('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        {/* Page heading */}
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">
          Welcome to AI Art Arena
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Sign in to vote on stunning AI-generated artwork
        </p>

        <div className="space-y-4">
          {/* GitHub OAuth sign-in button */}
          {/* This uses a Server Action, which is a Next.js 14 feature that lets
              us call server-side code directly from a form without creating
              a separate API route. The "use server" directive marks the function
              as server-only, so it never runs in the browser. */}
          <form
            action={async () => {
              'use server'
              // The signIn function from NextAuth initiates the OAuth flow.
              // For GitHub, this redirects the user to github.com to authorize,
              // then GitHub redirects back to our callback URL with an auth code,
              // then NextAuth exchanges that code for user info and creates a session.
              await signIn('github', { redirectTo: '/' })
            }}
          >
            <button
              type="submit"
              className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors duration-200 flex items-center justify-center gap-2 font-medium"
            >
              {/* GitHub icon SVG */}
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Continue with GitHub
            </button>
          </form>

          {/* Visual divider between authentication methods */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          {/* Email magic link sign-in form */}
          {/* This also uses a Server Action. When the user submits the form,
              NextAuth sends an email with a signed link. Clicking that link
              validates the signature and creates a session. */}
          <form
            action={async (formData: FormData) => {
              'use server'
              // Extract the email from the form data
              const email = formData.get('email') as string

              // Start the magic link flow with Resend
              await signIn('resend', {
                email,
                redirectTo: '/',
              })
            }}
          >
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium"
              >
                Send Magic Link
              </button>
            </div>
          </form>
        </div>

        {/* Help text explaining the authentication options */}
        <p className="text-center text-sm text-gray-600 mt-6">
          No account needed. We will create one for you on first sign-in.
        </p>

        {/* Link to home page in case user wants to browse without signing in */}
        <p className="text-center text-sm text-gray-500 mt-4">
          <a href="/" className="hover:text-gray-700 transition-colors">
            ← Back to home
          </a>
        </p>
      </div>
    </div>
  )
}
