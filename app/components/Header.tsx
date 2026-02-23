'use client'
export default function Header(){
  return (
    <header className="sticky top-4 mx-6 p-3 rounded-lg backdrop-blur-md bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-[#021012]" style={{background:'#94B5A0'}}>MC</div>
          <div>
            <div className="text-lg font-semibold">Mission Control</div>
            <div className="text-sm text-white/70">Nils — Webentwicklung</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <input className="px-3 py-2 rounded-md bg-transparent border border-[rgba(255,255,255,0.06)]" placeholder="Search (Ctrl/Cmd+K)" />
          <div className="w-3 h-3 rounded-full bg-[rgba(148,181,160,0.45)] animate-pulse" />
        </div>
      </div>
    </header>
  )
}
