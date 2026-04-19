import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ConsultFlow — Practice Management',
  description: 'Professional consulting practice management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}