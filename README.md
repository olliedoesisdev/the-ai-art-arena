# AI Art Arena

A weekly voting contest platform for AI-generated artwork. Users vote on 6 artworks per contest with a 24-hour voting cooldown. At week's end, contests are archived and a new contest begins.

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL)
- **Authentication:** NextAuth v5 (GitHub OAuth + Magic Links)
- **Styling:** Tailwind CSS
- **Rate Limiting:** Upstash Redis
- **Deployment:** Vercel

## Development Workflow

This project uses a Git Flow branching strategy:

- `main` - Production code. Always deployable. Protected branch.
- `develop` - Integration branch for features. Latest development code.
- `feature/*` - Feature branches. Created from develop, merged back to develop.

### Starting a New Feature

```bash
git checkout develop
git pull
git checkout -b feature/feature-name
# ... work on feature ...
git add .
git commit -m "feat: add feature description"
git push -u origin feature/feature-name
# Create PR to merge into develop
```

### Releasing to Production

```bash
git checkout main
git merge develop
git push
git tag -a v1.0.0 -m "Release description"
git push --tags
```

## Project Status

**Current Phase:** Initial Setup
**Completion:** 0%
**Next Steps:** Authentication setup, database schema, voting interface

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev

# Open http://localhost:3000
```

## Project Structure

```
ai-art-arena/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── contest/           # Contest pages
│   ├── archive/           # Archive pages
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── contest/          # Contest-specific components
│   └── layout/           # Layout components
├── lib/                   # Utility functions and configs
│   ├── supabase/         # Database clients
│   ├── auth/             # Authentication utilities
│   └── validators/       # Input validation schemas
└── public/               # Static assets
```

## License

MIT
