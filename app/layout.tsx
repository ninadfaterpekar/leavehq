import type { Metadata } from 'next'
import './globals.css'
import DesignSystemLoader from '@/components/DesignSystemLoader'

export const metadata: Metadata = {
  title: 'LeaveHQ',
  description: 'Holiday management for your team',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <DesignSystemLoader />
        {children}
      </body>
    </html>
  )
}
