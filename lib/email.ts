import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'LeaveHQ <noreply@yourdomain.com>'

// ── Email to manager when employee submits request ──
export async function sendManagerNotification({
  managerEmail,
  managerName,
  employeeName,
  leaveType,
  startDate,
  endDate,
  workingDays,
  note,
  approvalUrl
}: {
  managerEmail: string
  managerName: string
  employeeName: string
  leaveType: string
  startDate: string
  endDate: string
  workingDays: number
  note: string | null
  approvalUrl: string
}) {
  await resend.emails.send({
    from: FROM,
    to: managerEmail,
    subject: `Leave request from ${employeeName}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
        <h2 style="font-size:20px;font-weight:600;color:#111;margin-bottom:4px;">Leave Request</h2>
        <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">From ${employeeName}</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;width:40%">Leave type</td><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111;font-weight:500">${leaveType}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280">Start date</td><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111;font-weight:500">${startDate}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280">End date</td><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111;font-weight:500">${endDate}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280">Working days</td><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111;font-weight:500">${workingDays} day${workingDays !== 1 ? 's' : ''}</td></tr>
          ${note ? `<tr><td style="padding:10px 0;font-size:13px;color:#6b7280;vertical-align:top">Note</td><td style="padding:10px 0;font-size:13px;color:#111">${note}</td></tr>` : ''}
        </table>
        <a href="${approvalUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;">Review request</a>
        <p style="font-size:12px;color:#9ca3af;margin-top:24px;">You are receiving this because you are listed as ${employeeName}'s manager in LeaveHQ.</p>
      </div>
    `
  })
}

// ── Email to employee when request is approved or rejected ──
export async function sendEmployeeDecision({
  employeeEmail,
  employeeName,
  status,
  leaveType,
  startDate,
  endDate,
  managerNote
}: {
  employeeEmail: string
  employeeName: string
  status: 'approved' | 'rejected'
  leaveType: string
  startDate: string
  endDate: string
  managerNote: string | null
}) {
  const approved = status === 'approved'
  await resend.emails.send({
    from: FROM,
    to: employeeEmail,
    subject: `Your leave request has been ${status}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
        <div style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;margin-bottom:16px;background:${approved ? '#f0fdf4' : '#fef2f2'};color:${approved ? '#15803d' : '#dc2626'}">
          ${approved ? '✓ Approved' : '✗ Rejected'}
        </div>
        <h2 style="font-size:20px;font-weight:600;color:#111;margin-bottom:4px;">Leave Request ${approved ? 'Approved' : 'Rejected'}</h2>
        <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">Hi ${employeeName}, your leave request has been reviewed.</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;width:40%">Leave type</td><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111;font-weight:500">${leaveType}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280">Dates</td><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111;font-weight:500">${startDate} → ${endDate}</td></tr>
          ${managerNote ? `<tr><td style="padding:10px 0;font-size:13px;color:#6b7280;vertical-align:top">Manager note</td><td style="padding:10px 0;font-size:13px;color:#111">${managerNote}</td></tr>` : ''}
        </table>
        <p style="font-size:12px;color:#9ca3af;">Manage your leave at LeaveHQ.</p>
      </div>
    `
  })
}

// ── Email to admin when manager submits request ──
export async function sendAdminNotification({
  adminEmail,
  managerName,
  leaveType,
  startDate,
  endDate,
  workingDays,
  approvalUrl
}: {
  adminEmail: string
  managerName: string
  leaveType: string
  startDate: string
  endDate: string
  workingDays: number
  approvalUrl: string
}) {
  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `Leave request from manager ${managerName}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;">
        <h2 style="font-size:20px;color:#111;margin-bottom:4px;">Manager Leave Request</h2>
        <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">${managerName} has submitted a leave request requiring admin approval.</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;width:40%">Leave type</td><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111;font-weight:500">${leaveType}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280">Dates</td><td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111;font-weight:500">${startDate} → ${endDate}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#6b7280">Working days</td><td style="padding:10px 0;font-size:13px;color:#111;font-weight:500">${workingDays}</td></tr>
        </table>
        <a href="${approvalUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;">Review request</a>
      </div>
    `
  })
}
