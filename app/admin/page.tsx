'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/layout/Topbar'

function DesignSelect({ options, value, onChange }: {
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  const ref = useRef<any>(null)
  const latestOnChange = useRef(onChange)
  latestOnChange.current = onChange

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.options = options
  }, [options])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const handler = (e: any) => latestOnChange.current(e.detail.value)
    el.addEventListener('rel-change', handler)
    return () => el.removeEventListener('rel-change', handler)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (el) el.selected = value
  }, [value])

  return <rel-select ref={ref} no-search size="small" />
}

function DesignNumberField({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const ref = useRef<any>(null)
  const latestOnChange = useRef(onChange)
  latestOnChange.current = onChange

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const handler = (e: any) => latestOnChange.current(parseFloat(e.detail.value) || 0)
    el.addEventListener('rel-change', handler)
    return () => el.removeEventListener('rel-change', handler)
  }, [])

  return <rel-textfield ref={ref} value={String(value)} type="number" size="small" />
}

const ROLE_OPTIONS = [
  { value: 'employee',   label: 'Employee' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'manager',    label: 'Manager' },
  { value: 'admin',      label: 'Admin' },
]

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [edits, setEdits] = useState<Record<string, any>>({})

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      if (!p || p.role !== 'admin') { router.push('/dashboard'); return }
      setProfile(p)
      const { data: allUsers } = await supabase.from('profiles').select('*').order('full_name')
      setUsers(allUsers || [])
      setLoading(false)
    }
    load()
  }, [])

  async function saveUser(userId: string) {
    setSaving(userId)
    const changes = edits[userId]
    await supabase.from('profiles').update(changes).eq('id', userId)
    setUsers(u => u.map(user => user.id === userId ? { ...user, ...changes } : user))
    setEdits(e => { const n = { ...e }; delete n[userId]; return n })
    setSaving(null)
  }

  const managers = users.filter(u => ['manager', 'admin'].includes(u.role))
  const managerOptions = [
    { value: '', label: 'No manager' },
    ...managers.map(m => ({ value: m.id, label: m.full_name })),
  ]

  const th: React.CSSProperties = {
    padding: '11px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600',
    color: 'var(--rel-colors-gray-placeholder)', textTransform: 'uppercase', letterSpacing: '0.04em',
  }

  return (
    <>
      <Topbar profile={profile} />
      <div style={{ maxWidth: '1000px', margin: '32px auto', padding: '0 24px 48px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '4px', color: 'var(--rel-colors-black)', lineHeight: 1.2 }}>
          Admin Panel
        </h1>
        <p style={{ color: 'var(--rel-colors-gray-primary)', marginBottom: '24px', fontSize: '13px', lineHeight: 1.5 }}>
          Manage users, roles, allowances and daily rates.
        </p>

        {loading ? (
          <div style={{ color: 'var(--rel-colors-gray-primary)', fontSize: '13px' }} aria-busy="true">Loading…</div>
        ) : (
          <rel-card>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--rel-colors-gray-surface)', borderBottom: `1px solid var(--rel-colors-gray-border)` }}>
                  {['Name', 'Role', 'Manager', 'Allowance (days)', 'Daily rate (£)', 'Actions'].map(h => (
                    <th key={h} style={th as any}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  const edit = edits[user.id] || {}
                  return (
                    <tr key={user.id} style={{ borderBottom: `1px solid var(--rel-colors-gray-surface)` }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--rel-colors-black)' }}>{user.full_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--rel-colors-gray-placeholder)' }}>{user.email}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <DesignSelect
                          options={ROLE_OPTIONS}
                          value={edit.role ?? user.role}
                          onChange={v => setEdits(ed => ({ ...ed, [user.id]: { ...ed[user.id], role: v } }))}
                        />
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <DesignSelect
                          options={managerOptions}
                          value={edit.manager_id ?? user.manager_id ?? ''}
                          onChange={v => setEdits(ed => ({ ...ed, [user.id]: { ...ed[user.id], manager_id: v || null } }))}
                        />
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <DesignNumberField
                          value={edit.annual_allowance ?? user.annual_allowance}
                          onChange={v => setEdits(ed => ({ ...ed, [user.id]: { ...ed[user.id], annual_allowance: v } }))}
                        />
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <DesignNumberField
                          value={edit.daily_rate ?? user.daily_rate}
                          onChange={v => setEdits(ed => ({ ...ed, [user.id]: { ...ed[user.id], daily_rate: v } }))}
                        />
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {edits[user.id] && (
                          <rel-button
                            variant="primary"
                            size="small"
                            disabled={saving === user.id}
                            onClick={() => saveUser(user.id)}
                          >
                            {saving === user.id ? 'Saving…' : 'Save'}
                          </rel-button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </rel-card>
        )}
      </div>
    </>
  )
}
