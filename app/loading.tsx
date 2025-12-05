// app/loading.tsx
// Global loading state shown while pages are being fetched.
// This is a Server Component.

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        {/* Spinner */}
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>

        {/* Loading text */}
        <p className="text-xl font-medium text-gray-700">Loading...</p>
      </div>
    </div>
  )
}
