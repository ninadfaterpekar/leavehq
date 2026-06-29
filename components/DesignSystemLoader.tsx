'use client'
import { useEffect } from 'react'

export default function DesignSystemLoader() {
  useEffect(() => {
    import('@reliability-design/web')
  }, [])
  return null
}
