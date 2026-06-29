import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import DesignSystemLoader from '@/components/DesignSystemLoader'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'LeaveHQ',
  description: 'Holiday management for your team',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>
        <DesignSystemLoader />
        {children}
      </body>
    </html>
  )
}
