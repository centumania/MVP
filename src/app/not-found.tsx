import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center">
      <p className="text-xs font-mono text-text-muted mb-3">404</p>
      <h1 className="text-2xl font-semibold text-text mb-2">Page not found</h1>
      <p className="text-sm text-text-secondary max-w-xs mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors"
      >
        Back to dashboard
      </Link>
    </div>
  )
}
