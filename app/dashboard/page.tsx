import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/leave'
import Topbar from '@/components/layout/Topbar'
import { LeaveRequest } from '@/types'

const chipTone: Record<string, string> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
}
const chipLabel: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
}

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', session.user.id).single()

  const year = new Date().getFullYear()
  const { data: requests } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('user_id', session.user.id)
    .gte('start_date', `${year}-01-01`)
    .order('created_at', { ascending: false })

  const approved = (requests || []).filter(r => r.status === 'approved')
  const pending = (requests || []).filter(r => r.status === 'pending')
  const usedDays = [...approved, ...pending].reduce((s, r) => s + r.working_days, 0)
  const allowed = profile?.annual_allowance || 20
  const remaining = Math.max(0, allowed - usedDays)

  function getTimeOfDay() {
    const h = new Date().getHours()
    if (h < 12) return 'morning'
    if (h < 17) return 'afternoon'
    return 'evening'
  }

  return (
    <>
      <Topbar profile={profile} />
      <div style={{ maxWidth: '900px', margin: '32px auto', padding: '0 24px 48px' }}>

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '600' }}>
            Good {getTimeOfDay()}, {profile?.full_name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Here&apos;s your leave summary for {year}.
          </p>
        </div>

        {/* Balance cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total allowance', value: allowed, sub: 'days this year', color: 'var(--color-text)' },
            { label: 'Days used', value: usedDays, sub: 'approved + pending', color: usedDays > 15 ? '#f59e0b' : 'var(--color-text)' },
            { label: 'Remaining', value: remaining, sub: 'days left', color: remaining <= 3 ? '#ef4444' : '#10b981' },
          ].map(card => (
            <rel-card key={card.label}>
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  {card.label}
                </div>
                <div style={{ fontSize: '32px', fontWeight: '700', color: card.color, lineHeight: 1 }}>
                  {card.value}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                  {card.sub}
                </div>
              </div>
            </rel-card>
          ))}
        </div>

        {/* Leave history */}
        <rel-card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>Leave history</span>
            <rel-button variant="primary" size="small" onClick="location.href='/request'">
              + New request
            </rel-button>
          </div>

          {(!requests || requests.length === 0) ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🗓️</div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-text-secondary)' }}>No leave requests yet</div>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>Your requests will appear here once submitted.</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Type', 'Start', 'End', 'Days', 'Status', 'Submitted'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--color-border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((r: LeaveRequest) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                    <td style={{ padding: '12px', fontSize: '13px', textTransform: 'capitalize' }}>{r.leave_type} Leave</td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{formatDate(r.start_date)}</td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>{formatDate(r.end_date)}</td>
                    <td style={{ padding: '12px', fontSize: '13px', fontWeight: '500' }}>{r.working_days}</td>
                    <td style={{ padding: '12px' }}>
                      <rel-chip
                        label={chipLabel[r.status] || r.status}
                        tone={chipTone[r.status] || 'neutral'}
                        variant="subtle"
                        size="sm"
                      />
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                      {formatDate(r.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </rel-card>

      </div>
    </>
  )
}
