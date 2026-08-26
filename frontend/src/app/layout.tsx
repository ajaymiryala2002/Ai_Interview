import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PyProctor AI',
  description: 'AI-conducted technical interview platform focused on Python.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
