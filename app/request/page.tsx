'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { getWorkingDays, calcDeduction, todayISO } from '@/lib/leave'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/layout/Topbar'
import { Profile } from '@/types'

export default function RequestPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [balance, setBalance] = useState({ allowed: 20, used: 0, remaining: 20 })
  const [mode, setMode] = useState<'single' | 'range'>('single')
  const [leaveType, setLeaveType] = useState<'annual' | 'sick' | 'unpaid'>('annual')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [note, setNote] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const today = todayISO()
  const effectiveEnd = mode === 'single' ? startDate : endDate
  const workingDays = getWorkingDays(startDate, effectiveEnd)
  const deduction = calcDeduction(leaveType, workingDays, balance.remaining, profile?.daily_rate || 120)
  const canSubmit = workingDays > 0 && (!deduction.applies || acknowledged)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (p) setProfile(p)
      const year = new Date().getFullYear()
      const { data: requests } = await supabase
        .from('leave_requests').select('working_days, status, leave_type')
        .eq('user_id', session.user.id)
        .gte('start_date', `${year}-01-01`)
        .in('status', ['approved', 'pending'])
      const used = (requests || [])
        .filter((r: any) => r.leave_type !== 'sick')
        .reduce((s: number, r: any) => s + r.working_days, 0)
      const allowed = p?.annual_allowance || 20
      setBalance({ allowed, used, remaining: Math.max(0, allowed - used) })
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setStatus('idle')
    setErrorMsg('')
    const res = await fetch('/api/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leave_type: leaveType, start_date: startDate, end_date: effectiveEnd, note })
    })
    const data = await res.json()
    if (res.ok) {
      setStatus('success')
      setBalance(b => ({ ...b, used: b.used + workingDays, remaining: Math.max(0, b.remaining - workingDays) }))
      setStartDate(''); setEndDate(''); setNote(''); setAcknowledged(false)
    } else {
      setStatus('error')
      setErrorMsg(data.error || 'Something went wrong')
    }
    setLoading(false)
  }

  const s: Record<string, React.CSSProperties> = {
    card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px 24px', marginBottom: '16px' },
    label: { display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '6px' },
    input: { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', color: '#374151', outline: 'none', fontFamily: 'inherit', background: '#fff' },
    select: { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', color: '#374151', outline: 'none', fontFamily: 'inherit', background: '#fff', appearance: 'none' as any, cursor: 'pointer' },
    btnPrimary: { padding: '10px 22px', background: canSubmit && !loading ? '#4f46e5' : '#a5b4fc', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: canSubmit && !loading ? 'pointer' : 'not-allowed', fontFamily: 'inherit' },
    btnText: { padding: '10px 16px', background: 'none', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', color: '#6b7280', cursor: 'pointer', fontFamily: 'inherit' },
  }

  return (
    <>
      <Topbar profile={profile} />
      <div style={{ maxWidth: '680px', margin: '32px auto', padding: '0 24px 48px' }}>

        <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '4px' }}>Request Leave</h1>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>Submit a request. Your manager will be notified by email.</p>

        {/* Balance summary */}
        <div style={s.card}>
          <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>Your leave balance — {new Date().getFullYear()}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', textAlign: 'center' }}>
            {[
              { label: 'Allowed',   value: balance.allowed,   color: '#111827' },
              { label: 'Used',      value: balance.used,      color: balance.used > 15 ? '#f59e0b' : '#111827' },
              { label: 'Remaining', value: balance.remaining, color: balance.remaining <= 3 ? '#ef4444' : '#10b981' },
            ].map(b => (
              <div key={b.label}>
                <div style={{ fontSize: '11px', fontWeight: '500', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{b.label}</div>
                <div style={{ fontSize: '28px', fontWeight: '700', color: b.color, lineHeight: 1 }}>{b.value}</div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>days</div>
              </div>
            ))}
          </div>
        </div>

        {/* No days remaining */}
        {balance.remaining === 0 && (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: '#1e40af' }}>
            ℹ️ <strong>No annual leave remaining.</strong> You can still request unpaid leave.
          </div>
        )}

        {/* Form */}
        <div style={s.card}>
          <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>Leave details</div>

          {status === 'success' && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: '#14532d' }}>
              ✅ <strong>Request submitted.</strong> Your manager has been notified by email.
            </div>
          )}
          {status === 'error' && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: '#991b1b' }}>
              ❌ <strong>Something went wrong.</strong> {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Leave type */}
            <div style={{ marginBottom: '16px' }}>
              <label style={s.label}>Leave type</label>
              <select style={s.select} value={leaveType}
                onChange={e => { setLeaveType(e.target.value as any); setAcknowledged(false) }}>
                <option value="annual">Annual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="unpaid">Unpaid Leave</option>
              </select>
            </div>

            {/* Single / Range toggle */}
            <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: '8px', padding: '3px', width: 'fit-content', marginBottom: '16px' }}>
              {(['single', 'range'] as const).map(m => (
                <button key={m} type="button"
                  onClick={() => { setMode(m); setEndDate(''); setAcknowledged(false) }}
                  style={{ padding: '6px 18px', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit', background: mode === m ? '#fff' : 'transparent', color: mode === m ? '#111827' : '#6b7280', boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
                  {m === 'single' ? 'Single day' : 'Date range'}
                </button>
              ))}
            </div>

            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: mode === 'range' ? '1fr 1fr' : '1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={s.label}>{mode === 'range' ? 'Start date' : 'Date'}</label>
                <input type="date" style={s.input} min={today} value={startDate}
                  onChange={e => { setStartDate(e.target.value); setAcknowledged(false) }} required />
              </div>
              {mode === 'range' && (
                <div>
                  <label style={s.label}>End date</label>
                  <input type="date" style={s.input} min={startDate || today} value={endDate}
                    onChange={e => { setEndDate(e.target.value); setAcknowledged(false) }} required />
                </div>
              )}
            </div>

            {/* Days calculated */}
            {workingDays > 0 && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#1e40af' }}>
                <span>Working days requested</span>
                <strong>{workingDays} day{workingDays !== 1 ? 's' : ''}</strong>
              </div>
            )}

            {/* Pay deduction warning */}
            {deduction.applies && workingDays > 0 && (
              <>
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 14px', marginBottom: '12px', fontSize: '13px', color: '#92400e' }}>
                  ⚠️ <strong>Pay deduction applies.</strong> You are requesting {deduction.excess_days} day{deduction.excess_days !== 1 ? 's' : ''} beyond your allowance. This will reduce your pay by <strong>{deduction.formatted}</strong>.
                </div>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', marginBottom: '16px', cursor: 'pointer', fontSize: '13px', color: '#92400e', fontWeight: '500' }}>
                  <input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)}
                    style={{ marginTop: '2px', accentColor: '#f59e0b', width: '15px', height: '15px', flexShrink: 0 }} />
                  I understand this leave will reduce my pay by {deduction.formatted} this period.
                </label>
              </>
            )}

            <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', margin: '16px 0' }} />

            {/* Note */}
            <div style={{ marginBottom: '20px' }}>
              <label style={s.label}>
                Note for your manager <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea
                style={{ ...s.input, minHeight: '80px', resize: 'vertical' }}
                placeholder="Add any context that might help your manager..."
                maxLength={200}
                value={note}
                onChange={e => setNote(e.target.value)}
              />
              <div style={{ fontSize: '11px', color: note.length > 180 ? '#f59e0b' : '#9ca3af', textAlign: 'right', marginTop: '4px' }}>
                {note.length} / 200
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" style={s.btnText} onClick={() => router.push('/dashboard')}>Cancel</button>
              <button type="submit" style={s.btnPrimary} disabled={!canSubmit || loading}>
                {loading ? 'Submitting…' : 'Submit request'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  )
}
