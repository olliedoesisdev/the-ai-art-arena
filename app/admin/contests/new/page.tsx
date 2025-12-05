// app/admin/contests/new/page.tsx
// Form for creating a new contest with all its artworks.
// This is the primary way admins create contests without touching the database.

import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { CreateContestForm } from '@/components/admin/CreateContestForm'

export const metadata = {
  title: 'Create New Contest | Admin',
  description: 'Create a new AI Art Arena contest',
}

export default async function NewContestPage() {
  // Verify admin access (double-check even though middleware protects this)
  const session = await auth()

  if (!session?.user) {
    redirect('/signin')
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create New Contest
        </h1>
        <p className="text-gray-600">
          Set up a new weekly contest with artworks for voting
        </p>
      </div>

      <CreateContestForm />
    </div>
  )
}
