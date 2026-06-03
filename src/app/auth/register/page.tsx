'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/src/lib/supabase/client'
import { Button } from '@/src/components/ui/Button'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' })
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (form.name.trim().length < 2) { setError('Please enter your full name.'); return }
    if (!/^[6-9][0-9]{9}$/.test(form.phone)) { setError('Enter a valid 10-digit Indian mobile number.'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }

    setLoading(true)
    try {
      const { error: authError } = await getSupabaseBrowserClient().auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: { name: form.name.trim(), phone: form.phone },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        setError(authError.message.includes('already registered')
          ? 'This email is already registered. Please sign in.'
          : authError.message)
        return
      }
      setSuccess(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-success-subtle rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.5 10.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.41 0h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 7.91" />
              <polyline points="9 11 12 14 22 4" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">Check your inbox</h2>
          <p className="text-sm text-text-secondary leading-relaxed mb-1">
            We sent a confirmation link to{' '}
            <span className="font-medium text-text">{form.email}</span>.
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">
            Click the link to activate your account, then contact your coordinator to complete enrolment.
          </p>
          <Link href="/auth/login" className="mt-6 inline-block text-sm text-primary font-medium hover:text-primary-hover">
            Back to sign in →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">

        <div className="flex items-center gap-2 mb-8">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-text">Centumania</span>
        </div>

        <h1 className="text-2xl font-semibold text-text mb-1.5">Create your account</h1>
        <p className="text-sm text-text-secondary mb-8">
          Join the LDC 2026 batch. Start your 25-day journey.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { id: 'name',     label: 'Full name',     type: 'text',     placeholder: 'Your full name',   autoComplete: 'name',     value: form.name,     onChange: update('name') },
            { id: 'phone',    label: 'Mobile number', type: 'tel',      placeholder: '9876543210',        autoComplete: 'tel',      value: form.phone,    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })) },
            { id: 'email',    label: 'Email address', type: 'email',    placeholder: 'you@example.com',  autoComplete: 'email',    value: form.email,    onChange: update('email') },
            { id: 'password', label: 'Password',      type: 'password', placeholder: 'Min 8 characters', autoComplete: 'new-password', value: form.password, onChange: update('password') },
          ].map(field => (
            <div key={field.id}>
              <label htmlFor={field.id} className="block text-sm font-medium text-text mb-1.5">
                {field.label}
              </label>
              <input
                id={field.id}
                type={field.type}
                required
                autoComplete={field.autoComplete}
                placeholder={field.placeholder}
                value={field.value}
                onChange={field.onChange}
                className="w-full h-10 px-3 text-sm bg-surface border border-border rounded-lg text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
              />
            </div>
          ))}

          {error && (
            <div className="flex items-start gap-2.5 p-3 bg-error-subtle border border-error/20 rounded-lg">
              <svg className="w-4 h-4 text-error shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-xs text-error-text">{error}</p>
            </div>
          )}

          <Button type="submit" loading={loading} fullWidth size="lg">
            Create account
          </Button>

          <p className="text-xs text-text-muted text-center leading-relaxed">
            By creating an account you agree to our terms of service and confirm you are enrolling in the LDC 2026 cohort.
          </p>
        </form>

        <p className="text-center text-sm text-text-secondary mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary font-medium hover:text-primary-hover transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
