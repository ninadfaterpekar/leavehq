'use client'
import { usePathname } from 'next/navigation'
import { Profile } from '@/types'

export default function Topbar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()

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
    <rel-topbar sticky variant="customer">
      <rel-topbar-brand label="LeaveHQ" href="/dashboard" />

      {navLinks.map(link => (
        <rel-topbar-item
          key={link.href}
          label={link.label}
          href={link.href}
          {...(pathname === link.href ? { active: '' } : {})}
        />
      ))}

      <rel-topbar-profile
        type="avatar"
        initials={initials}
        name={profile?.full_name || ''}
        subtitle={profile?.role ? roleLabel[profile.role] : ''}
      />
    </rel-topbar>
  )
}
