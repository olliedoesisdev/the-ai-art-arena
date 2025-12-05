// app/admin/contests/page.tsx
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export const metadata = {
  title: 'Manage Contests | Admin',
}

export default async function ContestsPage() {
  const supabase = await createClient()
  
  const { data: contests } = await supabase
    .from('contests')
    .select('*')
    .order('week_number', { ascending: false })
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Contests
          </h1>
          <p className="text-gray-600">
            Manage all your contests
          </p>
        </div>
        <Link href="/admin/contests/new">
          <Button variant="primary">
            + Create New Contest
          </Button>
        </Link>
      </div>
      
      {contests && contests.length > 0 ? (
        <div className="grid gap-4">
          {contests.map((contest) => (
            <Card key={contest.id} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      contest.status === 'active' 
                        ? 'text-green-700 bg-green-100'
                        : contest.status === 'upcoming'
                        ? 'text-blue-700 bg-blue-100'
                        : 'text-gray-700 bg-gray-100'
                    }`}>
                      {contest.status}
                    </span>
                    <span className="font-semibold text-gray-900">
                      Week {contest.week_number}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {contest.title}
                  </h3>
                  <div className="text-sm text-gray-600">
                    {new Date(contest.start_date).toLocaleDateString()} - {new Date(contest.end_date).toLocaleDateString()}
                  </div>
                </div>
                <Link href={`/contest/${contest.id}`}>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center text-gray-600">
          No contests yet. Create your first one!
        </Card>
      )}
    </div>
  )
}

export const revalidate = 30
