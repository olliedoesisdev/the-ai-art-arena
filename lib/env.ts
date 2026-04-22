// lib/env.ts
// Environment variable validation
// This file validates that all required environment variables are present
// and throws a clear error if any are missing

/**
 * List of required environment variables for the application to function
 */
const requiredEnvVars = [
  // NextAuth
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',

  // GitHub OAuth
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',

  // Supabase
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',

  // Upstash Redis (Rate Limiting)
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',

  // Security
  'IP_HASH_SALT',
] as const

/**
 * Optional environment variables (warnings only)
 */
const optionalEnvVars = [
  'ADMIN_EMAILS',
  'RESEND_API_KEY',
  'NEXT_PUBLIC_SITE_URL',
] as const

/**
 * Validates that all required environment variables are set
 * Throws an error with helpful message if any are missing
 */
export function validateEnv(): void {
  const missingVars: string[] = []

  // Check required variables
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missingVars.push(varName)
    }
  }

  // If any required variables are missing, throw error
  if (missingVars.length > 0) {
    const errorMessage = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Missing Required Environment Variables
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The following environment variables are required but not set:

${missingVars.map(v => `  ❌ ${v}`).join('\n')}

To fix this:

1. Copy .env.example to .env.local:
   cp .env.example .env.local

2. Fill in the missing variables in .env.local

3. Restart the development server

For more information, see .env.example for descriptions
of each variable and where to obtain the values.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
    throw new Error(errorMessage)
  }

  // Check optional variables and warn if missing
  const missingOptional: string[] = []
  for (const varName of optionalEnvVars) {
    if (!process.env[varName]) {
      missingOptional.push(varName)
    }
  }

  if (missingOptional.length > 0) {
    console.warn('⚠️  Optional environment variables not set:')
    missingOptional.forEach(v => {
      console.warn(`   - ${v}`)
    })
  }

  // Success message
  console.log('✅ Environment variables validated successfully')
}

/**
 * Helper to get an environment variable with a fallback
 */
export function getEnv(key: string, fallback?: string): string {
  const value = process.env[key]
  if (!value) {
    if (fallback !== undefined) {
      return fallback
    }
    throw new Error(`Environment variable ${key} is not set`)
  }
  return value
}

/**
 * Helper to check if we're in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Helper to check if we're in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

// Run validation on import (server-side only, once per process)
let hasValidated = false
if (typeof window === 'undefined' && !hasValidated) {
  validateEnv()
  hasValidated = true
}
