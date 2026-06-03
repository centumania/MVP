import { redirect } from 'next/navigation'

/**
 * Root route — redirect to dashboard.
 * Dashboard handles its own auth check client-side;
 * unauthenticated users are sent to /auth/login from there.
 */
export default function RootPage() {
  redirect('/dashboard')
}
