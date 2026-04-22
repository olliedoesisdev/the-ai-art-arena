// app/about/page.tsx
// SERVER COMPONENT
// Static page explaining what AI Art Arena is.

import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About | AI Art Arena',
  description: 'Learn about AI Art Arena — a weekly voting contest for AI-generated artwork.',
}

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Artworks are generated',
    body: 'Each week a fresh set of AI-generated artworks is produced using the latest image models. Every piece starts from a unique prompt.',
  },
  {
    step: '02',
    title: 'The community votes',
    body: 'Anyone can cast one vote per contest — no account required. Votes are anonymous and rate-limited to keep things fair.',
  },
  {
    step: '03',
    title: 'A winner is crowned',
    body: 'When the contest closes the artwork with the most votes wins. Results are preserved in the archive forever.',
  },
]

const FAQS = [
  {
    q: 'Do I need an account to vote?',
    a: 'No. Voting is open to everyone. One vote per contest is tracked by IP address.',
  },
  {
    q: 'Can I vote more than once?',
    a: 'No — each visitor gets one vote per contest. The limit resets for the next contest.',
  },
  {
    q: 'Who creates the artworks?',
    a: 'The artworks are generated using AI image models. Each piece is created specifically for that week\'s contest.',
  },
  {
    q: 'How long does each contest run?',
    a: 'Contests typically run for one week. The timer on the contest page shows exactly how long is left.',
  },
  {
    q: 'Where can I see past results?',
    a: 'Every completed contest lives in the Archive, including the winner and full vote tallies.',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="max-w-3xl mx-auto px-4 py-16">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            About AI Art Arena
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            A weekly voting contest where the community decides which
            AI-generated artwork is the best of the week.
          </p>
        </div>

        {/* How it works */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">How it works</h2>
          <div className="flex flex-col gap-4">
            {HOW_IT_WORKS.map(({ step, title, body }) => (
              <Card key={step} className="flex gap-5 items-start p-6">
                <span className="text-3xl font-black text-blue-100 leading-none shrink-0 select-none">
                  {step}
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{body}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Frequently asked questions
          </h2>
          <div className="flex flex-col gap-3">
            {FAQS.map(({ q, a }) => (
              <Card key={q} padding="lg">
                <p className="font-semibold text-gray-900 mb-1">{q}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{a}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <p className="text-gray-600 mb-6">Ready to cast your vote?</p>
          <Link
            href="/"
            className="inline-block px-8 py-3 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            See this week&apos;s contest
          </Link>
        </div>

      </div>
    </div>
  )
}
