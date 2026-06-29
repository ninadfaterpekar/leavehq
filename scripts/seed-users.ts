import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

const supabase = createClient(
  'https://ocszewslprxacrtvhfeg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jc3pld3NscHJ4YWNydHZoZmVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjc0MDM5MiwiZXhwIjoyMDk4MzE2MzkyfQ.E3ILL8m8YepYWFoTIH_R0dxvZKyF4LVskD_L4UVRmGs',
  {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: ws },
  }
)

const users = [
  { email: 'ninad@leavehq.com',   password: 'Password123!', full_name: 'Ninad',   role: 'admin' },
  { email: 'sandeep@leavehq.com', password: 'Password123!', full_name: 'Sandeep', role: 'manager' },
  { email: 'sarah@leavehq.com',   password: 'Password123!', full_name: 'Sarah',   role: 'employee' },
  { email: 'jason@leavehq.com',   password: 'Password123!', full_name: 'Jason',   role: 'employee' },
  { email: 'jocelyn@leavehq.com', password: 'Password123!', full_name: 'Jocelyn', role: 'employee' },
  { email: 'clay@leavehq.com',    password: 'Password123!', full_name: 'Clay',    role: 'employee' },
  { email: 'kari@leavehq.com',    password: 'Password123!', full_name: 'Kari',    role: 'employee' },
]

async function main() {
  for (const user of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { full_name: user.full_name },
    })

    if (error) {
      console.error(`❌ ${user.email}: ${error.message}`)
      continue
    }

    // Update profile role (trigger creates the row, we just update role)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: user.role, full_name: user.full_name })
      .eq('id', data.user.id)

    if (profileError) {
      console.error(`⚠️  ${user.email} created but profile update failed: ${profileError.message}`)
    } else {
      console.log(`✅ ${user.email} (${user.role})`)
    }
  }
}

main()
