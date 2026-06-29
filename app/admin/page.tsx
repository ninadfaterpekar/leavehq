'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Topbar from '@/components/layout/Topbar'

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
      if (!session) { router.push('/auth'); return }
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

  const roleColors: Record<string, { bg: string, color: string }> = {
    employee: { bg: '#f0f9ff', color: '#0369a1' },
    supervisor: { bg: '#f0fdf4', color: '#15803d' },
    manager: { bg: '#faf5ff', color: '#7e22ce' },
    admin: { bg: '#fef2f2', color: '#dc2626' },
  }

  const field: React.CSSProperties = { padding: '7px 10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontSize: '13px', outline: 'none', fontFamily: 'inherit', width: '100%' }

  return (
    <>
      <Topbar profile={profile} />
      <div style={{ maxWidth: '1000px', margin: '32px auto', padding: '0 24px 48px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '4px' }}>Admin Panel</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>Manage users, roles, allowances and daily rates.</p>

        {loading ? (
          <div style={{ color: 'var(--color-text-secondary)' }}>Loading…</div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid var(--color-border)' }}>
                  {['Name', 'Role', 'Manager', 'Allowance (days)', 'Daily rate (£)', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  const edit = edits[user.id] || {}
                  const rc = roleColors[user.role] || roleColors.employee
                  const managers = users.filter(u => ['manager', 'admin'].includes(u.role) && u.id !== user.id)
                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '500' }}>{user.full_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>{user.email}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <select style={{ ...field, width: 'auto' }}
                          value={edit.role ?? user.role}
                          onChange={e => setEdits(ed => ({ ...ed, [user.id]: { ...ed[user.id], role: e.target.value } }))}>
                          {['employee', 'supervisor', 'manager', 'admin'].map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <select style={{ ...field, width: 'auto' }}
                          value={edit.manager_id ?? user.manager_id ?? ''}
                          onChange={e => setEdits(ed => ({ ...ed, [user.id]: { ...ed[user.id], manager_id: e.target.value || null } }))}>
                          <option value="">No manager</option>
                          {managers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <input type="number" style={{ ...field, width: '80px' }}
                          value={edit.annual_allowance ?? user.annual_allowance}
                          onChange={e => setEdits(ed => ({ ...ed, [user.id]: { ...ed[user.id], annual_allowance: parseInt(e.target.value) } }))} />
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <input type="number" style={{ ...field, width: '80px' }}
                          value={edit.daily_rate ?? user.daily_rate}
                          onChange={e => setEdits(ed => ({ ...ed, [user.id]: { ...ed[user.id], daily_rate: parseFloat(e.target.value) } }))} />
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {edits[user.id] && (
                          <button onClick={() => saveUser(user.id)} disabled={saving === user.id}
                            style={{ padding: '6px 14px', background: saving === user.id ? '#a5b4fc' : 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: '500', cursor: saving === user.id ? 'not-allowed' : 'pointer' }}>
                            {saving === user.id ? 'Saving…' : 'Save'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
