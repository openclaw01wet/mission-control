export default function MetricCard({accent,label,value,trend}:{accent?:string;label:string;value:string|number;trend?:string}){
  return (
    <div className="card p-4">
      <div className="h-1 rounded" style={{background:accent||'var(--accent)'}} />
      <div className="mt-3 flex items-center justify-between">
        <div>
          <div className="text-sm text-white/70">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
        <div className="text-sm text-white/70">{trend}</div>
      </div>
    </div>
  )
}
