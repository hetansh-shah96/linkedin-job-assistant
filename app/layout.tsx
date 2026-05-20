import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LinkedIn Job Assistant',
  description: 'AI-powered job application helper',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
