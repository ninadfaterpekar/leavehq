'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { formatDate } from '@/lib/leave'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/layout/Topbar'

export default function ApprovalsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth'); return }
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

  const card: React.CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px 24px', marginBottom: '12px' }
  const input: React.CSSProperties = { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }

  return (
    <>
      <Topbar profile={profile} />
      <div style={{ maxWidth: '800px', margin: '32px auto', padding: '0 24px 48px' }}>

        <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '4px' }}>Pending Approvals</h1>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>Review and action leave requests from your team.</p>

        {loading && <div style={{ color: '#6b7280', fontSize: '14px' }}>Loading requests…</div>}

        {!loading && requests.length === 0 && (
          <div style={{ ...card, textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#6b7280' }}>All caught up</div>
            <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>No pending leave requests from your team.</div>
          </div>
        )}

        {requests.map((r: any) => (
          <div key={r.id} style={card}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '600' }}>{r.profile?.full_name}</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', textTransform: 'capitalize' }}>
                  {r.profile?.role} · {r.leave_type} Leave
                </div>
              </div>
              <span style={{ background: '#fef9c3', color: '#854d0e', padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '500' }}>
                Pending
              </span>
            </div>

            {/* Date details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '14px' }}>
              {[
                { label: 'Start', value: formatDate(r.start_date) },
                { label: 'End', value: formatDate(r.end_date) },
                { label: 'Working days', value: `${r.working_days} day${r.working_days !== 1 ? 's' : ''}` },
              ].map(item => (
                <div key={item.label} style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>{item.label}</div>
                  <div style={{ fontSize: '13px', fontWeight: '500' }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Employee note */}
            {r.note && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px', fontSize: '13px', color: '#1e40af' }}>
                <strong>Employee note:</strong> {r.note}
              </div>
            )}

            {/* Manager note */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#6b7280', marginBottom: '6px' }}>
                Add a note <span style={{ fontWeight: 400 }}>(optional)</span>
              </label>
              <input type="text" style={input}
                placeholder="Reason for approval or rejection…"
                value={notes[r.id] || ''}
                onChange={e => setNotes(n => ({ ...n, [r.id]: e.target.value }))} />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => handleAction(r.id, 'rejected')}
                disabled={!!actionLoading}
                style={{ padding: '9px 18px', border: '1px solid #fecaca', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', fontSize: '13px', fontWeight: '500', cursor: actionLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {actionLoading === r.id + 'rejected' ? 'Rejecting…' : 'Reject'}
              </button>
              <button
                onClick={() => handleAction(r.id, 'approved')}
                disabled={!!actionLoading}
                style={{ padding: '9px 18px', border: 'none', borderRadius: '8px', background: actionLoading ? '#a5b4fc' : '#4f46e5', color: '#fff', fontSize: '13px', fontWeight: '500', cursor: actionLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {actionLoading === r.id + 'approved' ? 'Approving…' : 'Approve'}
              </button>
            </div>

          </div>
        ))}
      </div>
    </>
  )
}
