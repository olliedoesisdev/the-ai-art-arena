// app/admin/layout.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/signin')
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <h1 className="text-xl font-bold text-gray-900">
                AI Art Arena
              </h1>
            </Link>
            <span className="px-3 py-1 text-xs font-semibold text-purple-700 bg-purple-100 rounded-full">
              Admin
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {session.user.email}
            </span>
            <Link href="/">
              <Button variant="ghost" size="sm">
                View Site
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 border-b border-gray-200">
          <nav className="flex gap-8">
            <Link
              href="/admin"
              className="pb-4 border-b-2 border-transparent hover:border-gray-300 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/contests"
              className="pb-4 border-b-2 border-transparent hover:border-gray-300 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Contests
            </Link>
          </nav>
        </div>
        
        {children}
      </div>
    </div>
  )
}
