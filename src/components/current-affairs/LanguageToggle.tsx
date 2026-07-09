'use client'

type Lang = 'en' | 'hi' | 'ta'

const LANGS: { value: Lang; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'hi', label: 'हिं' },
  { value: 'ta', label: 'தமி' },
]

interface LanguageToggleProps {
  value: Lang
  onChange: (lang: Lang) => void
}

export function LanguageToggle({ value, onChange }: LanguageToggleProps) {
  return (
    <div
      className="inline-flex rounded-xl overflow-hidden"
      style={{ border: '1px solid #E5E7EB' }}
    >
      {LANGS.map(({ value: v, label }) => {
        const active = value === v
        return (
          <button
            key={v}
            onClick={() => onChange(v)}
            className="px-3 py-1.5 text-xs font-semibold transition-all"
            style={{
              background: active ? '#0284c7' : '#FFFFFF',
              color:      active ? '#fff'     : '#6B7280',
              borderRight: v !== 'ta' ? '1px solid #E5E7EB' : undefined,
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

export type { Lang }
