// app/admin/page.tsx
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export const metadata = {
  title: 'Admin Dashboard | AI Art Arena',
}

export default async function AdminDashboard() {
  const supabase = await createClient()
  
  const [
    { count: totalContests },
    { count: totalArtworks },
    { count: totalVotes },
  ] = await Promise.all([
    supabase.from('contests').select('*', { count: 'exact', head: true }),
    supabase.from('artworks').select('*', { count: 'exact', head: true }),
    supabase.from('votes').select('*', { count: 'exact', head: true }),
  ])
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Manage your AI Art Arena contests
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Contests</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalContests || 0}
              </p>
            </div>
            <div className="text-4xl">🎨</div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Artworks</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalArtworks || 0}
              </p>
            </div>
            <div className="text-4xl">🖼️</div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Votes</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalVotes || 0}
              </p>
            </div>
            <div className="text-4xl">🗳️</div>
          </div>
        </Card>
      </div>
      
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <Link href="/admin/contests/new">
            <Button variant="primary">
              + Create New Contest
            </Button>
          </Link>
          <Link href="/admin/contests">
            <Button variant="secondary">
              View All Contests
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

export const revalidate = 60
