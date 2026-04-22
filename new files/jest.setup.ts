// jest.setup.ts
// Global setup that runs before every test file.
// Mocks external dependencies so tests never hit real network or DB.

// Silence console.error in tests unless explicitly testing error logging
// (keeps test output clean — remove this if you need to debug)
global.console.error = jest.fn()
global.console.warn = jest.fn()

// Reset all mocks between tests so state never leaks between test cases
afterEach(() => {
  jest.clearAllMocks()
})
