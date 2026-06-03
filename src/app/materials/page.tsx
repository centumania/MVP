'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { AppLayout } from '@/src/components/layout/AppLayout'
import { Card, CardLabel } from '@/src/components/ui/Card'
import { Badge } from '@/src/components/ui/Badge'
import { SkeletonCard } from '@/src/components/ui/Skeleton'

type Material = {
  id: string; dayNumber: number; title: string
  hasPDF: boolean; hasPPT: boolean; hasVideo: boolean
  videoUrl: string | null; publishedAt: string; expiresAt: string
}

function timeUntil(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return 'Expired'
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  if (h > 0) return `Expires in ${h}h ${m}m`
  return `Expires in ${m}m`
}

function YouTubeEmbed({ url }: { url: string }) {
  // Extract video ID from various YouTube URL formats
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([A-Za-z0-9_-]{11})/)
  if (!match) return <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">Watch video →</a>
  const videoId = match[1]
  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-navy" style={{ paddingTop: '56.25%' }}>
      <iframe
        className="absolute inset-0 w-full h-full"
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Study material"
      />
    </div>
  )
}

export default function MaterialsPage() {
  const router   = useRouter()
  const [userName, setUserName] = useState('')
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    getSupabaseBrowserClient().auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/auth/login'); return }
      setUserName(session.user.user_metadata?.name ?? session.user.email?.split('@')[0] ?? '')

      const res = await fetch('/api/materials', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (res.status === 401) { router.replace('/auth/login'); return }
      if (res.status === 402) { router.replace('/dashboard');  return }

      if (res.status === 404) {
        // No materials today — not an error
        setMaterials([])
        setLoading(false)
        return
      }

      if (!res.ok) { setError('Failed to load materials.'); setLoading(false); return }

      const data = await res.json()
      setMaterials(data.materials ?? [])
      setLoading(false)
    })
  }, [router])

  if (loading) {
    return (
      <AppLayout userName={userName}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4">
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} lines={3} />)}
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout userName={userName}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        <div>
          <h1 className="text-2xl font-semibold text-text">Study Materials</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Content is available for 24 hours from the time of publishing.
          </p>
        </div>

        {error && (
          <Card>
            <p className="text-sm text-error">{error}</p>
          </Card>
        )}

        {!error && materials.length === 0 && (
          <Card className="text-center py-14">
            <div className="text-4xl mb-3">📚</div>
            <p className="text-sm font-medium text-text mb-1">No materials available today</p>
            <p className="text-xs text-text-muted">
              Study materials are published daily before 6:00 AM IST. Check back tomorrow.
            </p>
          </Card>
        )}

        {materials.map(m => (
          <Card key={m.id}>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <CardLabel className="mb-1">Day {m.dayNumber}</CardLabel>
                <h2 className="text-base font-semibold text-text">{m.title}</h2>
              </div>
              <Badge variant="warning" dot>{timeUntil(m.expiresAt)}</Badge>
            </div>

            {/* Video embed */}
            {m.hasVideo && m.videoUrl && (
              <div className="mb-4">
                <YouTubeEmbed url={m.videoUrl} />
              </div>
            )}

            {/* Content type indicators */}
            <div className="flex items-center gap-2 flex-wrap">
              {m.hasVideo && !m.videoUrl && (
                <Badge variant="neutral">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  Video
                </Badge>
              )}
              {m.hasPDF && (
                <Badge variant="primary">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                  PDF
                </Badge>
              )}
              {m.hasPPT && (
                <Badge variant="info">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                  Slides
                </Badge>
              )}
              {m.hasPDF && (
                <span className="text-xs text-text-muted ml-1">
                  PDF download available via coordinator
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </AppLayout>
  )
}
