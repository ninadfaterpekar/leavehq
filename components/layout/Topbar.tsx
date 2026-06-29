'use client'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Profile } from '@/types'

export default function Topbar({ profile }: { profile: Profile | null }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth')
    router.refresh()
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const roleLabel: Record<string, string> = {
    employee: 'Employee', supervisor: 'Supervisor',
    manager: 'Manager', admin: 'Admin',
  }

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/request', label: 'Request Leave' },
    ...(profile?.role && ['manager', 'admin', 'supervisor'].includes(profile.role)
      ? [{ href: '/approvals', label: 'Approvals' }] : []),
    ...(profile?.role === 'admin'
      ? [{ href: '/admin', label: 'Admin' }] : []),
  ]

  return (
    // @ts-ignore
    <rel-topbar sticky variant="customer">
      {/* @ts-ignore */}
      <rel-topbar-brand label="LeaveHQ" href="/dashboard" />

      {navLinks.map(link => (
        // @ts-ignore
        <rel-topbar-item
          key={link.href}
          label={link.label}
          href={link.href}
          {...(pathname === link.href ? { active: '' } : {})}
        />
      ))}

      {/* @ts-ignore */}
      <rel-topbar-profile
        type="avatar"
        initials={initials}
        name={profile?.full_name || ''}
        subtitle={profile?.role ? roleLabel[profile.role] : ''}
      />

      {/* @ts-ignore */}
      <rel-topbar-actions>
        {/* @ts-ignore */}
        <rel-button variant="default" size="small" onClick={handleSignOut}>Sign out</rel-button>
      </rel-topbar-actions>
    </rel-topbar>
  )
}
