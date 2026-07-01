'use client'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Profile } from '@/types'

const roleLabel: Record<string, string> = {
  employee: 'Employee',
  supervisor: 'Supervisor',
  manager: 'Manager',
  admin: 'Admin',
}

function buildNavLinks(role?: string) {
  return [
    { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { href: '/request', label: 'Request Leave', icon: 'calendar-today' },
    ...(role && ['manager', 'admin', 'supervisor'].includes(role)
      ? [{ href: '/approvals', label: 'Approvals', icon: 'check-circle' }]
      : []),
    ...(role === 'admin'
      ? [{ href: '/admin', label: 'Admin', icon: 'settings' }]
      : []),
  ]
}

export default function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    import('@reliability-design/icons')
  }, [])

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const links = buildNavLinks(profile?.role)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '240px',
        height: '100vh',
        background: 'var(--rel-colors-white)',
        borderRight: '1px solid var(--rel-colors-gray-border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {/* Logo + app name */}
      <div style={{ padding: '24px 20px 16px' }}>
        <Link
          href="/dashboard"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '18px', lineHeight: 1, userSelect: 'none' }}>🌴</span>
          <span
            style={{
              fontSize: '15px',
              fontWeight: '600',
              color: 'var(--rel-colors-black)',
              letterSpacing: '-0.01em',
            }}
          >
            LeaveHQ
          </span>
        </Link>
      </div>

      {/* Navigation links */}
      <nav style={{ padding: '0 8px', flex: 1 }} aria-label="Main navigation">
        {links.map(link => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? 'page' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                borderRadius: '6px',
                textDecoration: 'none',
                marginBottom: '2px',
                background: isActive ? 'var(--rel-colors-gray-surface)' : 'transparent',
                color: isActive ? 'var(--rel-colors-black)' : 'var(--rel-colors-gray-primary)',
                fontSize: '13px',
                fontWeight: isActive ? '500' : '400',
                lineHeight: 1.5,
              }}
            >
              <rel-icon
                name={link.icon}
                size="lg"
                color={isActive ? 'var(--rel-colors-black)' : 'var(--rel-colors-gray-primary)'}
              />
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--rel-colors-gray-border)',
        }}
      >
        {/* Avatar + name + role */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '12px',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--rel-colors-gray-surface)',
              border: '1px solid var(--rel-colors-gray-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--rel-colors-gray-primary)',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: '500',
                color: 'var(--rel-colors-black)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {profile?.full_name || ''}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--rel-colors-gray-placeholder)' }}>
              {profile?.role ? roleLabel[profile.role] : ''}
            </div>
          </div>
        </div>

        {/* Sign out */}
        <rel-button variant="text" size="small" onClick={handleSignOut}>
          Sign out
        </rel-button>
      </div>
    </aside>
  )
}
