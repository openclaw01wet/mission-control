import './globals.css'
import type { ReactNode } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'

export const metadata = { title: 'Mission Control' }

export default function RootLayout({ children }: { children: ReactNode }){
  return (
    <html lang="de">
      <body className="min-h-screen bg-[color:var(--bg)]">
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1">
            <Header />
            <main className="max-w-[1600px] mx-auto p-10">{children}</main>
          </div>
        </div>
      </body>
    </html>
  )
}
