import { HTMLAttributes } from 'react'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  lines?: number
  avatar?: boolean
}

export function Skeleton({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`skeleton rounded-xl ${className}`}
      {...props}
    />
  )
}

export function SkeletonCard({ lines = 3, avatar = false }: SkeletonProps) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
      {avatar && (
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-28 rounded-lg" />
            <Skeleton className="h-3 w-16 rounded-lg" />
          </div>
        </div>
      )}
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-3 rounded-lg" style={{ width: `${100 - i * 12}%` }} />
      ))}
    </div>
  )
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-5">
      {/* Hero skeleton */}
      <Skeleton className="h-44 w-full rounded-2xl" />
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
      {/* Exam card */}
      <Skeleton className="h-32 rounded-2xl" />
      {/* Two columns */}
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
    </div>
  )
}
