import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Translation Editor',
  description: 'Edit translations while maintaining JSON structure',
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