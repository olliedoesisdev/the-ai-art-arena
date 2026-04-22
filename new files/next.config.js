// next.config.js
// next/image will throw a runtime error if it tries to serve an image
// from a domain not listed here. Supabase Storage URLs follow the
// pattern: [project-ref].supabase.co
// The wildcard hostname covers all Supabase projects so you never
// need to change this if you swap Supabase projects.

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage (where all artwork images live)
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Supabase CDN (Supabase routes some storage requests here)
      {
        protocol: 'https',
        hostname: '**.supabase.in',
        pathname: '/storage/v1/object/public/**',
      },
    ],

    // Image format preference: AVIF is smaller than WebP but slower to encode.
    // WebP is the safe default for broad browser support.
    formats: ['image/webp', 'image/avif'],

    // Cache optimised images for 7 days on Vercel CDN.
    // Raise this to 2592000 (30 days) once images are confirmed stable.
    minimumCacheTTL: 604800,
  },
}

module.exports = nextConfig
