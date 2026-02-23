'use client'
export default function Sidebar(){
  return (
    <aside className="w-64 p-6 border-r border-[rgba(255,255,255,0.04)] hidden md:block">
      <nav className="space-y-3">
        <a className="block py-2 px-3 rounded-md hover:bg-white/2">📊 Dashboard</a>
        <a className="block py-2 px-3 rounded-md hover:bg-white/2">📋 Projects</a>
        <a className="block py-2 px-3 rounded-md hover:bg-white/2">📅 Timeline</a>
        <a className="block py-2 px-3 rounded-md hover:bg-white/2">📝 Notes</a>
      </nav>
    </aside>
  )
}
