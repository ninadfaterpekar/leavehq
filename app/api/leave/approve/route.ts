import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase'
import { sendEmployeeDecision } from '@/lib/email'
import { formatDate } from '@/lib/leave'

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { request_id, action, manager_note } = await req.json()
    if (!request_id || !action) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    if (!['approved', 'rejected'].includes(action)) return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

    const admin = createAdminClient()

    // Get reviewer profile
    const { data: reviewer } = await admin
      .from('profiles').select('role').eq('id', session.user.id).single()
    if (!reviewer || !['manager', 'supervisor', 'admin'].includes(reviewer.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get the request + employee
    const { data: request } = await admin
      .from('leave_requests')
      .select('*, profile:profiles(*)')
      .eq('id', request_id)
      .single()
    if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

    // Update status
    const { error: updateError } = await admin
      .from('leave_requests')
      .update({ status: action, manager_note: manager_note || null, updated_at: new Date().toISOString() })
      .eq('id', request_id)
    if (updateError) throw updateError

    // Email the employee
    const { data: employee } = await admin
      .from('profiles').select('email, full_name').eq('id', request.user_id).single()
    if (employee) {
      await sendEmployeeDecision({
        employeeEmail: employee.email,
        employeeName: employee.full_name,
        status: action,
        leaveType: request.leave_type,
        startDate: formatDate(request.start_date),
        endDate: formatDate(request.end_date),
        managerNote: manager_note || null
      })
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('Approval error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
