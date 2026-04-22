// jest.config.ts
// Configures Jest for testing Next.js API routes.
// Uses next/jest which handles the App Router, TypeScript paths,
// and Next.js-specific globals automatically.
//
// SETUP:
//   npm install --save-dev jest jest-environment-node @types/jest ts-jest
//   (next/jest is included with next — no extra install needed)

import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({
  // Points to your Next.js root so next/jest can read next.config.js
  dir: './',
})

const config: Config = {
  // Use node environment for API route tests (not jsdom)
  testEnvironment: 'node',

  // Path aliases matching tsconfig.json
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  // Run the setup file before each test file
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],

  // Only run files in __tests__ or files named *.test.ts
  testMatch: [
    '<rootDir>/__tests__/**/*.test.ts',
    '<rootDir>/__tests__/**/*.test.tsx',
  ],

  // Coverage config — run with: jest --coverage
  collectCoverageFrom: [
    'app/api/**/*.ts',
    'lib/**/*.ts',
    '!lib/supabase/**',       // Supabase client wrappers — tested via integration
    '!**/*.d.ts',
  ],

  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

export default createJestConfig(config)
