import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase'
import { sendManagerNotification, sendAdminNotification } from '@/lib/email'
import { getWorkingDays, formatDate } from '@/lib/leave'

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { leave_type, start_date, end_date, note } = body

    // Validate
    if (!leave_type || !start_date || !end_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const workingDays = getWorkingDays(start_date, end_date)
    if (workingDays === 0) {
      return NextResponse.json({ error: 'No working days in selected range' }, { status: 400 })
    }
    if (workingDays > 30) {
      return NextResponse.json({ error: 'Request cannot exceed 30 working days' }, { status: 400 })
    }

    // Get employee profile
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles').select('*').eq('id', session.user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // Check for date conflicts
    const { data: conflicts } = await admin
      .from('leave_requests')
      .select('id')
      .eq('user_id', session.user.id)
      .in('status', ['pending', 'approved'])
      .lte('start_date', end_date)
      .gte('end_date', start_date)

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json({ error: 'These dates overlap with an existing request' }, { status: 400 })
    }

    // Insert request
    const { data: request, error: insertError } = await admin
      .from('leave_requests')
      .insert({
        user_id: session.user.id,
        leave_type,
        start_date,
        end_date,
        working_days: workingDays,
        note: note || null,
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Send email notification
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const approvalUrl = `${appUrl}/approvals`

    if (profile.role === 'manager' || profile.role === 'supervisor') {
      // Manager/supervisor request goes to admin
      const { data: admins } = await admin
        .from('profiles').select('email, full_name').eq('role', 'admin')
      for (const a of admins || []) {
        await sendAdminNotification({
          adminEmail: a.email,
          managerName: profile.full_name,
          leaveType: leave_type,
          startDate: formatDate(start_date),
          endDate: formatDate(end_date),
          workingDays,
          approvalUrl
        })
      }
    } else {
      // Employee request goes to their manager
      if (profile.manager_id) {
        const { data: manager } = await admin
          .from('profiles').select('email, full_name').eq('id', profile.manager_id).single()
        if (manager) {
          await sendManagerNotification({
            managerEmail: manager.email,
            managerName: manager.full_name,
            employeeName: profile.full_name,
            leaveType: leave_type,
            startDate: formatDate(start_date),
            endDate: formatDate(end_date),
            workingDays,
            note: note || null,
            approvalUrl
          })
        }
      }
    }

    return NextResponse.json({ success: true, request })

  } catch (err: any) {
    console.error('Leave request error:', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}

// GET — fetch leave requests for current user
export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const year = new URL(req.url).searchParams.get('year') || new Date().getFullYear().toString()

  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('user_id', session.user.id)
    .gte('start_date', `${year}-01-01`)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ requests: data })
}
