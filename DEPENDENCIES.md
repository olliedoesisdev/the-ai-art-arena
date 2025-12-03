# Project Dependencies

This document explains each dependency in this project, why it's needed, and how it's used.

## Production Dependencies

### Authentication

**next-auth@beta** (v5.x)

- Purpose: Complete authentication solution for Next.js
- Usage: Handles GitHub OAuth and magic link email authentication
- Why: Building auth from scratch is error-prone and time-consuming
- Docs: https://authjs.dev/

**@auth/core**

- Purpose: Core authentication primitives
- Usage: Peer dependency for NextAuth v5
- Why: Required by NextAuth

### Database

**@supabase/supabase-js**

- Purpose: PostgreSQL database client for JavaScript
- Usage: All database queries (contests, artworks, votes)
- Why: Type-safe database queries with great DX
- Docs: https://supabase.com/docs/reference/javascript

**@supabase/ssr**

- Purpose: Server-side rendering helpers for Supabase
- Usage: Creates properly configured Supabase clients for Next.js
- Why: Handles cookies and auth state correctly in SSR contexts
- Docs: https://supabase.com/docs/guides/auth/server-side

### Rate Limiting

**@upstash/ratelimit**

- Purpose: Serverless rate limiting using Redis
- Usage: Prevents vote spam (1 vote per IP per 24 hours)
- Why: Critical for contest integrity
- Docs: https://upstash.com/docs/redis/features/ratelimiting

**@upstash/redis**

- Purpose: Serverless Redis client
- Usage: Storage backend for rate limiting
- Why: Fast key-value store perfect for rate limit counters
- Docs: https://upstash.com/docs/redis

### Validation

**zod**

- Purpose: TypeScript-first schema validation
- Usage: Validates all API inputs (votes, contest data)
- Why: Prevents malformed data and injection attacks
- Docs: https://zod.dev/

### UI Utilities

**sonner**

- Purpose: Toast notification system
- Usage: Success/error messages when users vote
- Why: Provides immediate feedback for user actions
- Docs: https://sonner.emilkowal.ski/

**clsx**

- Purpose: Conditional className utility
- Usage: Applies Tailwind classes based on component state
- Why: Makes conditional styling clean and readable
- Docs: https://github.com/lukeed/clsx

## Development Dependencies

**@types/node**

- Purpose: TypeScript definitions for Node.js
- Usage: Type safety for Node.js built-in modules
- Why: Enables TypeScript autocomplete and type checking for crypto, fs, etc.

## Framework Dependencies (Installed by create-next-app)

- **next**: React framework with SSR, routing, and optimization
- **react**: UI library
- **react-dom**: React renderer for web
- **typescript**: Type safety
- **tailwindcss**: Utility-first CSS framework
- **eslint**: Code linting
- **eslint-config-next**: ESLint rules specific to Next.js

## Dependency Update Strategy

- **Major updates**: Review changelog, test thoroughly
- **Minor updates**: Generally safe to update
- **Patch updates**: Update frequently for security fixes
- **Security audits**: Run `npm audit` weekly
