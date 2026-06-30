'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { formatDate } from '@/lib/leave'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/layout/Topbar'

function NoteField({ requestId, onChange }: { requestId: string; onChange: (id: string, v: string) => void }) {
  const ref = useRef<any>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const handler = (e: any) => onChange(requestId, e.detail.value || '')
    el.addEventListener('rel-change', handler)
    return () => el.removeEventListener('rel-change', handler)
  }, [requestId, onChange])
  return (
    <rel-textfield
      ref={ref}
      label="Add a note (optional)"
      placeholder="Reason for approval or rejection…"
    />
  )
}

export default function ApprovalsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  const handleNoteChange = (id: string, value: string) => {
    setNotes(n => ({ ...n, [id]: value }))
  }

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (!p || !['manager', 'supervisor', 'admin'].includes(p.role)) { router.push('/dashboard'); return }
      setProfile(p)

      let query = supabase
        .from('leave_requests')
        .select('*, profile:profiles(full_name, email, role)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (p.role !== 'admin') {
        const { data: reports } = await supabase.from('profiles').select('id').eq('manager_id', session.user.id)
        const ids = (reports || []).map((r: any) => r.id)
        if (ids.length === 0) { setLoading(false); return }
        query = query.in('user_id', ids)
      }

      const { data } = await query
      setRequests(data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleAction(requestId: string, action: 'approved' | 'rejected') {
    setActionLoading(requestId + action)
    const res = await fetch('/api/leave/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_id: requestId, action, manager_note: notes[requestId] || '' })
    })
    if (res.ok) setRequests(r => r.filter(req => req.id !== requestId))
    setActionLoading(null)
  }

  return (
    <>
      <Topbar profile={profile} />
      <div style={{ maxWidth: '800px', margin: '32px auto', padding: '0 24px 48px' }}>

        <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '4px', color: 'var(--rel-colors-black)', lineHeight: 1.2 }}>
          Pending Approvals
        </h1>
        <p style={{ color: 'var(--rel-colors-gray-primary)', marginBottom: '24px', fontSize: '13px', lineHeight: 1.5 }}>
          Review and action leave requests from your team.
        </p>

        {loading && (
          <div style={{ color: 'var(--rel-colors-gray-primary)', fontSize: '13px' }} aria-busy="true">
            Loading requests…
          </div>
        )}

        {!loading && requests.length === 0 && (
          <rel-card>
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--rel-colors-gray-primary)' }}>All caught up</div>
              <div style={{ fontSize: '13px', color: 'var(--rel-colors-gray-placeholder)', marginTop: '4px', lineHeight: 1.5 }}>
                No pending leave requests from your team.
              </div>
            </div>
          </rel-card>
        )}

        {requests.map((r: any) => (
          <div key={r.id} style={{ marginBottom: '12px' }}>
            <rel-card>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--rel-colors-black)' }}>{r.profile?.full_name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--rel-colors-gray-placeholder)', marginTop: '2px', textTransform: 'capitalize' }}>
                    {r.profile?.role} · {r.leave_type} Leave
                  </div>
                </div>
                <rel-chip label="Pending" tone="warning" variant="subtle" size="sm" />
              </div>

              {/* Date details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '16px' }}>
                {[
                  { label: 'Start', value: formatDate(r.start_date) },
                  { label: 'End',   value: formatDate(r.end_date) },
                  { label: 'Working days', value: `${r.working_days} day${r.working_days !== 1 ? 's' : ''}` },
                ].map(item => (
                  <div key={item.label} style={{ background: 'var(--rel-colors-gray-surface)', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--rel-colors-gray-placeholder)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '600' }}>{item.label}</div>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--rel-colors-black)' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Employee note */}
              {r.note && (
                <div style={{ marginBottom: '16px' }}>
                  <rel-alert type="info" message1={`Employee note: ${r.note}`} />
                </div>
              )}

              {/* Manager note */}
              <div style={{ marginBottom: '16px' }}>
                <NoteField requestId={r.id} onChange={handleNoteChange} />
              </div>

              <rel-divider />

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <rel-button
                  variant="secondary"
                  tone="critical"
                  size="medium"
                  disabled={!!actionLoading}
                  onClick={() => handleAction(r.id, 'rejected')}
                >
                  {actionLoading === r.id + 'rejected' ? 'Rejecting…' : 'Reject'}
                </rel-button>
                <rel-button
                  variant="primary"
                  size="medium"
                  disabled={!!actionLoading}
                  onClick={() => handleAction(r.id, 'approved')}
                >
                  {actionLoading === r.id + 'approved' ? 'Approving…' : 'Approve'}
                </rel-button>
              </div>
            </rel-card>
          </div>
        ))}
      </div>
    </>
  )
}
