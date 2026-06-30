'use client'
import { useRouter } from 'next/navigation'

export default function NewRequestButton() {
  const router = useRouter()
  return (
    <rel-button variant="primary" size="small" onClick={() => router.push('/request')}>
      New request
    </rel-button>
  )
}
