import './globals.css'
import './countdown.css'
import type { ReactNode } from 'react'

export const metadata = { title: 'Mission Control' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-[color:var(--bg)]">
        {children}
      </body>
    </html>
  )
}
