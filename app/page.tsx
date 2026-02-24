'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'

type TabKey = 'dashboard' | 'projects' | 'timeline' | 'notes' | 'revenue' | 'command'

type Priority = { id: string; text: string; done: boolean; createdAt: number }

type ActivityItem = { id: string; ts: number; text: string }

type TaskPriority = 'high' | 'medium' | 'low'

type TaskColumn = 'backlog' | 'in_progress' | 'done'

type Task = {
  id: string
  title: string
  description: string
  priority: TaskPriority
  column: TaskColumn
  createdAt: number
}

type GoalSettings = {
  name: string
  goalPercent: number // 0..100
  goalDateISO: string // e.g. 2026-12-31
}

type CostItem = { id: string; label: string; amount: number; currency: string; period: 'mo' | 'yr'; createdAt: number }

type CalendarItem = { id: string; title: string; whenISO: string; location?: string; createdAt: number }

type ClientStatus = 'active' | 'pending' | 'churned'

type Client = { id: string; name: string; mrr: number; status: ClientStatus; startISO: string; createdAt: number }

type AgentStatus = 'online' | 'busy' | 'offline'

type Agent = {
  id: string
  name: string
  role: string
  status: AgentStatus
  model: string
  lastActive: number
  description: string
  capabilities: string[]
  activity: { id: string; ts: number; text: string }[]
  perfNotes?: string
}

type Decision = { id: string; dateISO: string; question: string; summary: string; consulted: string[] }

function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

function useLocalStorageState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(initialValue)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw != null) setState(JSON.parse(raw) as T)
    } catch {
      // ignore
    } finally {
      setHydrated(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {
      // ignore
    }
  }, [key, hydrated, state])

  return { state, setState, hydrated } as const
}

function formatDateTime(d: Date) {
  const date = d.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'short', day: '2-digit' })
  const time = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return { date, time }
}

function greetingFor(d: Date) {
  const h = d.getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}

const TIMELINE = [
  {
    id: 'phase-1',
    title: 'Foundation',
    range: 'Feb 2026 — Mar 2026',
    description: 'Core UX, local persistence, and the first end-to-end flows.',
    milestones: [
      { id: 'm1', text: 'Navigation + responsive layout', done: true },
      { id: 'm2', text: 'LocalStorage persistence for core data', done: true },
      { id: 'm3', text: 'Kanban CRUD + activity feed', done: false },
    ],
    current: true,
  },
  {
    id: 'phase-2',
    title: 'Automation',
    range: 'Apr 2026 — May 2026',
    description: 'Hooks into OpenClaw, costs, process telemetry and scheduled summaries.',
    milestones: [
      { id: 'm4', text: 'Process list + CPU/RAM snapshot', done: false },
      { id: 'm5', text: 'Model cost rollups', done: false },
      { id: 'm6', text: 'Calendar + tasks integration', done: false },
    ],
    current: false,
  },
  {
    id: 'phase-3',
    title: 'Team Mode',
    range: 'Jun 2026 —',
    description: 'Auth, multi-user sync, shared boards, and audit trail.',
    milestones: [
      { id: 'm7', text: 'Auth + access control', done: false },
      { id: 'm8', text: 'Realtime sync', done: false },
    ],
    current: false,
  },
] as const

const motionCard = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
}

function MetricCard(props: {
  label: string
  value: string
  trend?: string
  icon?: string
  accentBar?: string
}) {
  const { label, value, trend, icon, accentBar } = props
  return (
    <motion.div {...motionCard} className="mc-card p-4">
      <div className="h-[3px] rounded" style={{ background: accentBar ?? 'var(--accent)' }} />
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm text-[color:var(--muted)]">
            <span aria-hidden className="text-base">
              {icon ?? '•'}
            </span>
            <span className="truncate">{label}</span>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
        </div>
        {trend ? (
          <div className="text-xs text-[color:var(--muted2)] whitespace-nowrap">{trend}</div>
        ) : null}
      </div>
    </motion.div>
  )
}

function PriorityRow(props: {
  item: Priority
  onToggle: () => void
  onDelete: () => void
  onEdit: (_text: string) => void
}) {
  const { item, onToggle, onDelete, onEdit } = props
  return (
    <div className="group flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/5 transition">
      <button
        type="button"
        className={clsx(
          'h-5 w-5 rounded border border-[color:var(--border)] flex items-center justify-center transition',
          item.done ? 'bg-[color:var(--accent)] border-transparent' : 'bg-transparent'
        )}
        aria-label={item.done ? 'Mark as not done' : 'Mark as done'}
        onClick={onToggle}
      >
        {item.done ? <span className="text-[10px] text-black font-bold">✓</span> : null}
      </button>

      <input
        className={clsx(
          'flex-1 bg-transparent outline-none text-sm',
          item.done ? 'line-through text-white/50' : 'text-white/90'
        )}
        value={item.text}
        onChange={(e) => onEdit(e.target.value)}
      />

      <button
        type="button"
        className="opacity-0 group-hover:opacity-100 text-xs text-white/60 hover:text-white/90 transition"
        onClick={onDelete}
      >
        Delete
      </button>
    </div>
  )
}

function Badge({ priority }: { priority: TaskPriority }) {
  const styles: Record<TaskPriority, string> = {
    high: 'bg-red-500/15 text-red-200 border-red-400/20',
    medium: 'bg-amber-500/15 text-amber-200 border-amber-400/20',
    low: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/20',
  }
  return (
    <span className={clsx('text-[11px] px-2 py-1 rounded-full border', styles[priority])}>{priority}</span>
  )
}

function Modal(props: {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
}) {
  const { open, title, children, onClose } = props

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            aria-label="Close modal"
            className="absolute inset-0 bg-black/70"
            type="button"
            onClick={onClose}
          />

          <motion.div
            className="relative w-full max-w-[720px] mc-card p-5"
            initial={{ opacity: 0, y: 8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold">{title}</div>
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-white/60 hover:text-white/90 transition"
              >
                Close
              </button>
            </div>
            <div className="mt-4">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

function ColumnHeader(props: { title: string; count: number; onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="text-sm font-semibold">{props.title}</div>
        <div className="text-xs text-white/60">({props.count})</div>
      </div>
      <button
        type="button"
        onClick={props.onAdd}
        className="text-xs px-3 py-1.5 rounded-lg border border-[color:var(--border)] hover:bg-white/5 transition"
      >
        Add
      </button>
    </div>
  )
}

function TabButton(props: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={clsx(
        'px-3 py-2 rounded-xl text-sm transition border',
        props.active
          ? 'bg-white/5 border-[rgba(148,181,160,0.25)] mc-accent-glow'
          : 'bg-transparent border-transparent hover:bg-white/5 hover:border-[color:var(--border)]'
      )}
    >
      {props.label}
    </button>
  )
}

export default function MissionControlPage() {
  const searchRef = useRef<HTMLInputElement | null>(null)

  const { state: goal, setState: setGoal } = useLocalStorageState<GoalSettings>('mc.goal', {
    name: 'Nils',
    goalPercent: 42,
    goalDateISO: new Date(new Date().getFullYear(), 11, 31).toISOString().slice(0, 10),
  })

  const { state: priorities, setState: setPriorities } = useLocalStorageState<Priority[]>('mc.priorities', [])
  const { state: activity, setState: setActivity } = useLocalStorageState<ActivityItem[]>('mc.activity', [])
  const { state: tasks, setState: setTasks } = useLocalStorageState<Task[]>('mc.tasks', [])
  const { state: notes, setState: setNotes } = useLocalStorageState<string>('mc.notes', '')
  const { state: tab, setState: setTab } = useLocalStorageState<TabKey>('mc.tab', 'dashboard')
  const { state: costs, setState: setCosts } = useLocalStorageState<CostItem[]>('mc.costs', [])
  const { state: calendar, setState: setCalendar } = useLocalStorageState<CalendarItem[]>('mc.calendar', [])
  const { state: revenueGoal, setState: setRevenueGoal } = useLocalStorageState<number>('mc.revenue.goal', 10000)
  const { state: clients, setState: setClients } = useLocalStorageState<Client[]>('mc.revenue.clients', [])

  const sampleAgents: Agent[] = [
    {
      id: uid('ag'),
      name: 'Lando',
      role: 'Strategic Tech Assistant',
      status: 'online',
      model: 'openai/gpt-5.2',
      lastActive: Date.now(),
      description: 'Calm, precise, forward-looking assistant orchestrating work and code.',
      capabilities: ['Code patches', 'CLI orchestration', 'Docs synthesis'],
      activity: [],
      perfNotes: 'Strong on multi-step ops and quick patching.',
    },
    {
      id: uid('ag'),
      name: 'Jiggy',
      role: 'Coding Agent',
      status: 'busy',
      model: 'openai/gpt-5.2-codex',
      lastActive: Date.now() - 1000 * 60 * 8,
      description: 'Implements small, safe, incremental code changes.',
      capabilities: ['Refactors', 'Build/CI fixes', 'Lint/type fixes'],
      activity: [],
    },
    {
      id: uid('ag'),
      name: 'Teddy',
      role: 'Research & Messaging',
      status: 'offline',
      model: 'google/gemini-flash',
      lastActive: Date.now() - 1000 * 60 * 60,
      description: 'Concise web research, messaging workflows.',
      capabilities: ['Web search', 'Summaries', 'Comms drafts'],
      activity: [],
    },
  ]
  const { state: agents, setState: setAgents } = useLocalStorageState<Agent[]>('mc.agents', sampleAgents)
  const { state: decisions, setState: setDecisions } = useLocalStorageState<Decision[]>('mc.decisions', [])

  const [now, setNow] = useState(() => new Date())
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [taskDraft, setTaskDraft] = useState<Pick<Task, 'title' | 'description' | 'priority' | 'column'>>({
    title: '',
    description: '',
    priority: 'medium',
    column: 'backlog',
  })

  const [feedDraft, setFeedDraft] = useState('')
  const [costDraft, setCostDraft] = useState<{ label: string; amount: string; currency: string; period: 'mo' | 'yr' }>({
    label: '',
    amount: '',
    currency: '€',
    period: 'mo',
  })
  const [eventDraft, setEventDraft] = useState<{ title: string; whenISO: string; location: string }>({
    title: '',
    whenISO: new Date().toISOString().slice(0, 16),
    location: '',
  })

  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [sendTaskOpen, setSendTaskOpen] = useState(false)
  const [taskText, setTaskText] = useState('')
  const [decisionDraft, setDecisionDraft] = useState<{ question: string; summary: string; consulted: string[] }>({ question: '', summary: '', consulted: [] })

  const [clientDraft, setClientDraft] = useState<{ name: string; mrr: string; status: ClientStatus; startISO: string }>(
    {
      name: '',
      mrr: '',
      status: 'active',
      startISO: new Date().toISOString().slice(0, 10),
    }
  )

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isK = e.key.toLowerCase() === 'k'
      const cmdOrCtrl = e.metaKey || e.ctrlKey
      if (cmdOrCtrl && isK) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const { date, time } = useMemo(() => formatDateTime(now), [now])

  const daysToGoal = useMemo(() => {
    const target = new Date(goal.goalDateISO + 'T00:00:00')
    const diff = target.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }, [goal.goalDateISO, now])

  const tasksTodayCount = useMemo(() => {
    const today = now.toISOString().slice(0, 10)
    return tasks.filter((t) => new Date(t.createdAt).toISOString().slice(0, 10) === today).length
  }, [now, tasks])

  const activeProjectsCount = useMemo(() => {
    // Here “projects” is approximated by tasks that are not done yet.
    return tasks.filter((t) => t.column !== 'done').length
  }, [tasks])

  const monthlyCostTotal = useMemo(() => {
    // Normalize yearly costs to monthly for the total
    const toMonthly = (c: CostItem) => (c.period === 'yr' ? c.amount / 12 : c.amount)
    return costs.reduce((sum, c) => sum + toMonthly(c), 0)
  }, [costs])

  function logActivity(text: string) {
    const item: ActivityItem = { id: uid('act'), ts: Date.now(), text }
    setActivity((prev) => [item, ...prev].slice(0, 60))
  }

  function openCreateTask(column: TaskColumn) {
    setEditingTask(null)
    setTaskDraft({ title: '', description: '', priority: 'medium', column })
    setTaskModalOpen(true)
  }

  function openEditTask(task: Task) {
    setEditingTask(task)
    setTaskDraft({
      title: task.title,
      description: task.description,
      priority: task.priority,
      column: task.column,
    })
    setTaskModalOpen(true)
  }

  function saveTask() {
    const title = taskDraft.title.trim()
    if (!title) return

    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? { ...t, title, description: taskDraft.description, priority: taskDraft.priority, column: taskDraft.column }
            : t
        )
      )
      logActivity(`Updated task: ${title}`)
    } else {
      const task: Task = {
        id: uid('task'),
        title,
        description: taskDraft.description,
        priority: taskDraft.priority,
        column: taskDraft.column,
        createdAt: Date.now(),
      }
      setTasks((prev) => [task, ...prev])
      logActivity(`Created task: ${title}`)
    }

    setTaskModalOpen(false)
  }

  function deleteTask(id: string) {
    const t = tasks.find((x) => x.id === id)
    setTasks((prev) => prev.filter((x) => x.id !== id))
    if (t) logActivity(`Deleted task: ${t.title}`)
  }

  function moveTask(id: string, column: TaskColumn) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, column } : t)))
    const t = tasks.find((x) => x.id === id)
    if (t) logActivity(`Moved task: ${t.title} → ${column.replace('_', ' ')}`)
  }

  function addPriority() {
    const item: Priority = { id: uid('pri'), text: 'New priority', done: false, createdAt: Date.now() }
    setPriorities((prev) => [item, ...prev])
    logActivity('Added a priority')
  }

  function addFeedItem() {
    const text = feedDraft.trim()
    if (!text) return
    logActivity(text)
    setFeedDraft('')
  }

  const taskColumns = useMemo(() => {
    const by: Record<TaskColumn, Task[]> = { backlog: [], in_progress: [], done: [] }
    for (const t of tasks) by[t.column].push(t)
    // Keep stable sorting: newest first
    for (const k of Object.keys(by) as TaskColumn[]) by[k].sort((a, b) => b.createdAt - a.createdAt)
    return by
  }, [tasks])

  const greeting = greetingFor(now)

  const mrr = useMemo(() => clients.filter(c => c.status === 'active').reduce((s, c) => s + c.mrr, 0), [clients])

  function lastSixMonths(nowDate: Date) {
    const arr: { key: string; label: string; total: number }[] = []
    const d = new Date(nowDate)
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(d.getFullYear(), d.getMonth() - i, 1)
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
      const label = dt.toLocaleDateString('en-US', { month: 'short' })
      arr.push({ key, label, total: 0 })
    }
    return arr
  }

  const revenueSeries = useMemo(() => {
    const base = lastSixMonths(now)
    const byKey = Object.fromEntries(base.map(b => [b.key, b])) as Record<string, { key: string; label: string; total: number }>
    for (const c of clients) {
      if (c.status !== 'active') continue
      for (const b of Object.values(byKey)) {
        // include months >= client start month
        const start = new Date(c.startISO + 'T00:00:00')
        const [y, m] = b.key.split('-').map(Number)
        const monthStart = new Date(y, (m || 1) - 1, 1)
        if (monthStart >= new Date(start.getFullYear(), start.getMonth(), 1)) {
          b.total += c.mrr
        }
      }
    }
    return Object.values(byKey)
  }, [clients, now])

  return (
    <div className="min-h-screen">
      {/* Sticky frosted-glass header */}
      <header className="sticky top-4 z-40 mx-4 sm:mx-6">
        <div className="mc-card px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: logo/title */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center font-extrabold text-[#021012]"
                style={{ background: 'rgba(148, 181, 160, 0.85)' }}
              >
                MC
              </div>
              <div className="min-w-0">
                <div className="font-semibold leading-tight truncate">Mission Control</div>
                <div className="text-xs text-[color:var(--muted)] truncate">Premium local-first board</div>
              </div>
            </div>

            {/* Center: tabs */}
            <nav className="hidden md:flex items-center gap-2">
              <TabButton active={tab === 'dashboard'} label="📊 Dashboard" onClick={() => setTab('dashboard')} />
              <TabButton active={tab === 'projects'} label="📋 Projects" onClick={() => setTab('projects')} />
              <TabButton active={tab === 'timeline'} label="📅 Timeline" onClick={() => setTab('timeline')} />
              <TabButton active={tab === 'notes'} label="📝 Notes" onClick={() => setTab('notes')} />
            </nav>
            <nav className="hidden md:flex items-center gap-2 ml-2">
              <TabButton active={tab === 'revenue'} label="💰 Revenue" onClick={() => setTab('revenue')} />
              <TabButton active={tab === 'command'} label="🏢 Command Center" onClick={() => setTab('command')} />
            </nav>

            {/* Right: search + status */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block">
                <input
                  ref={searchRef}
                  className="mc-input px-3 py-2 text-sm w-[240px] lg:w-[320px]"
                  placeholder="Search (Ctrl/Cmd+K)"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="mc-status-dot h-2.5 w-2.5 rounded-full bg-[color:var(--accentSolid)]" />
                <div className="hidden lg:block text-xs text-[color:var(--muted)]">Live</div>
              </div>
            </div>
          </div>

          {/* Mobile tabs */}
          <div className="mt-3 flex md:hidden gap-2 overflow-x-auto pb-1">
            <TabButton active={tab === 'dashboard'} label="📊" onClick={() => setTab('dashboard')} />
            <TabButton active={tab === 'projects'} label="📋" onClick={() => setTab('projects')} />
            <TabButton active={tab === 'timeline'} label="📅" onClick={() => setTab('timeline')} />
            <TabButton active={tab === 'notes'} label="📝" onClick={() => setTab('notes')} />
            <TabButton active={tab === 'revenue'} label="💰" onClick={() => setTab('revenue')} />
            <TabButton active={tab === 'command'} label="🏢" onClick={() => setTab('command')} />
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => searchRef.current?.focus()}
              className="px-3 py-2 rounded-xl text-sm border border-[color:var(--border)] hover:bg-white/5 transition"
            >
              Search
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6" style={{ paddingTop: 'var(--pad)', paddingBottom: 'var(--pad)' }}>
        <AnimatePresence mode="wait">
          {tab === 'dashboard' ? (
            <motion.section
              key="dashboard"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Welcome bar */}
              <div className="mc-card p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="text-sm text-[color:var(--muted)]">Good {greeting},</div>
                    <div className="text-2xl font-bold tracking-tight">{goal.name}</div>
                    <div className="mt-1 text-sm text-white/60">
                      {date} • {time}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="mc-card p-3 shadow-none">
                      <div className="text-xs text-[color:var(--muted)]">Name</div>
                      <input
                        className="mc-input mt-1 px-3 py-2 text-sm w-[220px]"
                        value={goal.name}
                        onChange={(e) => setGoal({ ...goal, name: e.target.value })}
                        placeholder="Your name"
                      />
                    </div>
                    <div className="mc-card p-3 shadow-none">
                      <div className="text-xs text-[color:var(--muted)]">Goal date</div>
                      <input
                        className="mc-input mt-1 px-3 py-2 text-sm w-[220px]"
                        type="date"
                        value={goal.goalDateISO}
                        onChange={(e) => setGoal({ ...goal, goalDateISO: e.target.value })}
                      />
                    </div>
                    <div className="mc-card p-3 shadow-none">
                      <div className="text-xs text-[color:var(--muted)]">Goal progress</div>
                      <input
                        className="mc-input mt-1 px-3 py-2 text-sm w-[220px]"
                        type="number"
                        min={0}
                        max={100}
                        value={goal.goalPercent}
                        onChange={(e) => setGoal({ ...goal, goalPercent: Number(e.target.value || 0) })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Metric cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <MetricCard
                  label="Goal progress"
                  value={`${Math.min(100, Math.max(0, goal.goalPercent))}%`}
                  trend="vs. last week"
                  icon="🎯"
                  accentBar="rgba(148, 181, 160, 0.55)"
                />
                <MetricCard
                  label="Active projects"
                  value={String(activeProjectsCount)}
                  trend="open tasks"
                  icon="📌"
                  accentBar="rgba(99, 102, 241, 0.55)"
                />
                <MetricCard
                  label="Tasks today"
                  value={String(tasksTodayCount)}
                  trend="created today"
                  icon="✅"
                  accentBar="rgba(16, 185, 129, 0.55)"
                />
                <MetricCard
                  label="Days to goal"
                  value={String(daysToGoal)}
                  trend="countdown"
                  icon="⏳"
                  accentBar="rgba(236, 72, 153, 0.55)"
                />
              </div>

              <div className="grid grid-cols-1 2xl:grid-cols-4 gap-4">
                {/* Activity feed */}
                <div className="mc-card p-5 2xl:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">Activity</div>
                      <div className="text-xs text-[color:var(--muted)]">Stored locally — newest first</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        className="mc-input px-3 py-2 text-sm w-[240px] hidden sm:block"
                        value={feedDraft}
                        onChange={(e) => setFeedDraft(e.target.value)}
                        placeholder="Add an activity…"
                      />
                      <button
                        type="button"
                        onClick={addFeedItem}
                        className="px-3 py-2 rounded-xl text-sm border border-[rgba(148,181,160,0.25)] mc-accent-glow hover:bg-white/5 transition"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 max-h-[360px] overflow-auto pr-2">
                    {activity.length === 0 ? (
                      <div className="text-sm text-white/60">No activity yet — create a task or add a note.</div>
                    ) : (
                      <div className="space-y-2">
                        {activity.map((a) => (
                          <div key={a.id} className="flex items-start justify-between gap-3 rounded-xl px-3 py-2 hover:bg-white/5 transition">
                            <div className="text-sm text-white/90">{a.text}</div>
                            <div className="text-xs text-white/50 whitespace-nowrap">
                              {new Date(a.ts).toLocaleString('de-DE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Costs (monthly rollup) */}
                <div className="mc-card p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">Costs</div>
                      <div className="text-xs text-[color:var(--muted)]">Monthly total normalized</div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <input
                      className="mc-input px-3 py-2 text-sm w-full"
                      placeholder="Service (e.g. Vercel Pro)"
                      value={costDraft.label}
                      onChange={(e) => setCostDraft((d) => ({ ...d, label: e.target.value }))}
                    />
                    <input
                      className="mc-input px-3 py-2 text-sm w-28"
                      placeholder="Amount"
                      type="number"
                      value={costDraft.amount}
                      onChange={(e) => setCostDraft((d) => ({ ...d, amount: e.target.value }))}
                    />
                    <select
                      className="mc-input px-3 py-2 text-sm w-24"
                      value={costDraft.currency}
                      onChange={(e) => setCostDraft((d) => ({ ...d, currency: e.target.value }))}
                    >
                      <option>€</option>
                      <option>$</option>
                    </select>
                    <select
                      className="mc-input px-3 py-2 text-sm w-24"
                      value={costDraft.period}
                      onChange={(e) => setCostDraft((d) => ({ ...d, period: e.target.value as 'mo' | 'yr' }))}
                    >
                      <option value="mo">/mo</option>
                      <option value="yr">/yr</option>
                    </select>
                    <button
                      type="button"
                      className="px-3 py-2 rounded-xl text-sm border border-[rgba(148,181,160,0.25)] mc-accent-glow hover:bg-white/5 transition"
                      onClick={() => {
                        const amt = parseFloat(costDraft.amount)
                        if (!costDraft.label.trim() || isNaN(amt)) return
                        const item: CostItem = {
                          id: uid('cost'),
                          label: costDraft.label.trim(),
                          amount: amt,
                          currency: costDraft.currency,
                          period: costDraft.period,
                          createdAt: Date.now(),
                        }
                        setCosts((prev) => [item, ...prev])
                        logActivity(`Added cost: ${item.label} ${item.amount}${item.currency}/${item.period}`)
                        setCostDraft({ label: '', amount: '', currency: costDraft.currency, period: costDraft.period })
                      }}
                    >
                      Add
                    </button>
                  </div>

                  <div className="mt-3">
                    <div className="text-sm text-[color:var(--muted)]">Monthly total</div>
                    <div className="text-2xl font-bold mt-1">{monthlyCostTotal.toFixed(2)} {costs[0]?.currency || '€'}/mo</div>
                  </div>

                  <div className="mt-3 space-y-2 max-h-[220px] overflow-auto pr-1">
                    {costs.map((c) => (
                      <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 border border-[color:var(--border)] bg-white/2">
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{c.label}</div>
                          <div className="text-xs text-white/60">{c.amount.toFixed(2)} {c.currency}/{c.period}</div>
                        </div>
                        <button
                          type="button"
                          className="text-xs text-white/60 hover:text-red-300 transition"
                          onClick={() => setCosts((prev) => prev.filter((x) => x.id !== c.id))}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {costs.length === 0 && <div className="text-sm text-white/60">Add your first cost item.</div>}
                  </div>
                </div>

                {/* Top priorities */}
                <div className="mc-card p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">Top priorities</div>
                      <div className="text-xs text-[color:var(--muted)]">Editable checklist</div>
                    </div>
                    <button
                      type="button"
                      onClick={addPriority}
                      className="text-xs px-3 py-2 rounded-xl border border-[rgba(148,181,160,0.25)] mc-accent-glow hover:bg-white/5 transition"
                    >
                      Add
                    </button>
                  </div>

                  <div className="mt-3">
                    {priorities.length === 0 ? (
                      <div className="text-sm text-white/60">Add your first priority.</div>
                    ) : (
                      <div className="space-y-1">
                        {priorities.map((p) => (
                          <PriorityRow
                            key={p.id}
                            item={p}
                            onToggle={() => {
                              setPriorities((prev) => prev.map((x) => (x.id === p.id ? { ...x, done: !x.done } : x)))
                              logActivity(`Priority ${p.done ? 'reopened' : 'completed'}: ${p.text}`)
                            }}
                            onEdit={(text) => setPriorities((prev) => prev.map((x) => (x.id === p.id ? { ...x, text } : x)))}
                            onDelete={() => {
                              setPriorities((prev) => prev.filter((x) => x.id !== p.id))
                              logActivity(`Deleted priority: ${p.text}`)
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.section>
          ) : null}

          {tab === 'projects' ? (
            <motion.section
              key="projects"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="mc-card p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="text-2xl font-bold tracking-tight">Projects</div>
                    <div className="text-sm text-[color:var(--muted)]">Kanban board — everything persisted in localStorage</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openCreateTask('backlog')}
                      className="px-4 py-2 rounded-xl text-sm border border-[rgba(148,181,160,0.25)] mc-accent-glow hover:bg-white/5 transition"
                    >
                      New task
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Backlog */}
                <div className="mc-card p-4">
                  <ColumnHeader title="Backlog" count={taskColumns.backlog.length} onAdd={() => openCreateTask('backlog')} />
                  <div className="mt-4 space-y-3">
                    {taskColumns.backlog.map((t) => (
                      <motion.div key={t.id} {...motionCard} className="mc-card p-4 shadow-none hover:bg-white/5 transition">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{t.title}</div>
                            <div className="mt-1 text-sm text-white/60 line-clamp-2">{t.description || '—'}</div>
                          </div>
                          <Badge priority={t.priority} />
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div className="text-xs text-white/50">{new Date(t.createdAt).toLocaleDateString('de-DE')}</div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditTask(t)}
                              className="text-xs text-white/60 hover:text-white/90 transition"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => moveTask(t.id, 'in_progress')}
                              className="text-xs text-[color:var(--accentSolid)] hover:opacity-90 transition"
                            >
                              Start
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* In progress */}
                <div className="mc-card p-4">
                  <ColumnHeader
                    title="In Progress"
                    count={taskColumns.in_progress.length}
                    onAdd={() => openCreateTask('in_progress')}
                  />
                  <div className="mt-4 space-y-3">
                    {taskColumns.in_progress.map((t) => (
                      <motion.div key={t.id} {...motionCard} className="mc-card p-4 shadow-none hover:bg-white/5 transition">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{t.title}</div>
                            <div className="mt-1 text-sm text-white/60 line-clamp-2">{t.description || '—'}</div>
                          </div>
                          <Badge priority={t.priority} />
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div className="text-xs text-white/50">{new Date(t.createdAt).toLocaleDateString('de-DE')}</div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditTask(t)}
                              className="text-xs text-white/60 hover:text-white/90 transition"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => moveTask(t.id, 'done')}
                              className="text-xs text-[color:var(--accentSolid)] hover:opacity-90 transition"
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Done */}
                <div className="mc-card p-4">
                  <ColumnHeader title="Done" count={taskColumns.done.length} onAdd={() => openCreateTask('done')} />
                  <div className="mt-4 space-y-3">
                    {taskColumns.done.map((t) => (
                      <motion.div key={t.id} {...motionCard} className="mc-card p-4 shadow-none opacity-80 hover:opacity-100 hover:bg-white/5 transition">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{t.title}</div>
                            <div className="mt-1 text-sm text-white/60 line-clamp-2">{t.description || '—'}</div>
                          </div>
                          <Badge priority={t.priority} />
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div className="text-xs text-white/50">{new Date(t.createdAt).toLocaleDateString('de-DE')}</div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditTask(t)}
                              className="text-xs text-white/60 hover:text-white/90 transition"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteTask(t.id)}
                              className="text-xs text-red-300 hover:text-red-200 transition"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              <Modal
                open={taskModalOpen}
                title={editingTask ? 'Edit task' : 'Create task'}
                onClose={() => setTaskModalOpen(false)}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <div className="text-xs text-[color:var(--muted)]">Title</div>
                    <input
                      className="mc-input mt-1 px-3 py-2 text-sm w-full"
                      value={taskDraft.title}
                      onChange={(e) => setTaskDraft((d) => ({ ...d, title: e.target.value }))}
                      placeholder="e.g. Implement Mission Control board"
                      autoFocus
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <div className="text-xs text-[color:var(--muted)]">Description</div>
                    <textarea
                      className="mc-input mt-1 px-3 py-2 text-sm w-full min-h-[120px]"
                      value={taskDraft.description}
                      onChange={(e) => setTaskDraft((d) => ({ ...d, description: e.target.value }))}
                      placeholder="Short context, links, acceptance criteria…"
                    />
                  </div>

                  <div>
                    <div className="text-xs text-[color:var(--muted)]">Priority</div>
                    <select
                      className="mc-input mt-1 px-3 py-2 text-sm w-full"
                      value={taskDraft.priority}
                      onChange={(e) => setTaskDraft((d) => ({ ...d, priority: e.target.value as TaskPriority }))}
                    >
                      <option value="high">high</option>
                      <option value="medium">medium</option>
                      <option value="low">low</option>
                    </select>
                  </div>

                  <div>
                    <div className="text-xs text-[color:var(--muted)]">Column</div>
                    <select
                      className="mc-input mt-1 px-3 py-2 text-sm w-full"
                      value={taskDraft.column}
                      onChange={(e) => setTaskDraft((d) => ({ ...d, column: e.target.value as TaskColumn }))}
                    >
                      <option value="backlog">Backlog</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 flex items-center justify-between gap-3 mt-2">
                    {editingTask ? (
                      <button
                        type="button"
                        onClick={() => {
                          deleteTask(editingTask.id)
                          setTaskModalOpen(false)
                        }}
                        className="px-4 py-2 rounded-xl text-sm border border-red-400/20 text-red-200 hover:bg-red-500/10 transition"
                      >
                        Delete
                      </button>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTaskModalOpen(false)}
                        className="px-4 py-2 rounded-xl text-sm border border-[color:var(--border)] hover:bg-white/5 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveTask}
                        className="px-4 py-2 rounded-xl text-sm border border-[rgba(148,181,160,0.25)] mc-accent-glow hover:bg-white/5 transition"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </Modal>
            </motion.section>
          ) : null}

          {tab === 'timeline' ? (
            <motion.section
              key="timeline"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="mc-card p-5">
                <div className="text-2xl font-bold tracking-tight">Timeline</div>
                <div className="text-sm text-[color:var(--muted)]">Roadmap phases (edit the JS config in app/page.tsx)</div>
              </div>

              <div className="space-y-4">
                {TIMELINE.map((p, idx) => (
                  <motion.div
                    key={p.id}
                    {...motionCard}
                    className={clsx('mc-card p-5', p.current ? 'mc-accent-glow' : '')}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-white/50">Phase {idx + 1}</div>
                          {p.current ? (
                            <div className="text-[11px] px-2 py-1 rounded-full border border-[rgba(148,181,160,0.25)] bg-white/5">
                              Current
                            </div>
                          ) : null}
                        </div>
                        <div className="mt-1 text-xl font-semibold">{p.title}</div>
                        <div className="mt-1 text-sm text-[color:var(--muted)]">{p.range}</div>
                        <div className="mt-3 text-sm text-white/80 max-w-[90ch]">{p.description}</div>
                      </div>

                      <div className="w-full lg:w-[420px]">
                        <div className="text-xs text-[color:var(--muted)]">Milestones</div>
                        <div className="mt-2 space-y-2">
                          {p.milestones.map((m) => (
                            <div key={m.id} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 border border-[color:var(--border)] bg-white/2">
                              <div className={clsx('text-sm', m.done ? 'text-white/60 line-through' : 'text-white/90')}>{m.text}</div>
                              <div className={clsx('text-xs', m.done ? 'text-[color:var(--accentSolid)]' : 'text-white/40')}>
                                {m.done ? '✓' : '—'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          ) : null}

          {tab === 'command' ? (
            <motion.section
              key="command"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="mc-card p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-2xl font-bold tracking-tight">Command Center</div>
                    <div className="text-sm text-[color:var(--muted)]">Manage your AI agents and key decisions</div>
                  </div>
                  <div className="text-sm text-[color:var(--muted)]">Agents: {agents.length}</div>
                </div>
              </div>

              {/* Agent drawer + send task modal */}
              <AnimatePresence>
                {activeAgentId ? (
                  <>
                    <motion.div className="fixed inset-0 z-50 bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveAgentId(null)} />
                    <motion.div className="mc-drawer mc-card p-5 overflow-y-auto" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.25 }}>
                      {(() => {
                        const a = agents.find(x => x.id === activeAgentId)
                        if (!a) return null
                        return (
                          <div>
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="text-xl font-semibold">{a.name}</div>
                                <div className="text-sm text-white/70">{a.role}</div>
                              </div>
                              <button type="button" className="text-sm text-white/60 hover:text-white/90" onClick={() => setActiveAgentId(null)}>Close</button>
                            </div>
                            <div className="mt-3 text-sm text-white/80">{a.description}</div>
                            <div className="mt-3">
                              <div className="text-xs text-[color:var(--muted)]">Capabilities</div>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {a.capabilities.map((c, i) => (
                                  <span key={i} className="text-[11px] px-2 py-1 rounded-full border border-[color:var(--border)] bg-white/2">{c}</span>
                                ))}
                              </div>
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-2">
                              <div className="mc-card p-3">
                                <div className="text-xs text-[color:var(--muted)]">Status</div>
                                <div className="text-sm capitalize">{a.status}</div>
                              </div>
                              <div className="mc-card p-3">
                                <div className="text-xs text-[color:var(--muted)]">Model</div>
                                <div className="text-sm">{a.model}</div>
                              </div>
                              <div className="mc-card p-3">
                                <div className="text-xs text-[color:var(--muted)]">Last active</div>
                                <div className="text-sm">{new Date(a.lastActive).toLocaleString('de-DE')}</div>
                              </div>
                            </div>
                            {a.perfNotes ? (
                              <div className="mt-3 mc-card p-3">
                                <div className="text-xs text-[color:var(--muted)]">Performance notes</div>
                                <div className="text-sm">{a.perfNotes}</div>
                              </div>
                            ) : null}

                            <div className="mt-3 flex items-center justify-between gap-3">
                              <div className="font-semibold">Recent activity</div>
                              <button
                                type="button"
                                className="px-3 py-2 rounded-xl text-sm border border-[rgba(148,181,160,0.25)] mc-accent-glow hover:bg-white/5 transition"
                                onClick={() => setSendTaskOpen(true)}
                              >
                                Send Task
                              </button>
                            </div>
                            <div className="mt-2 space-y-2">
                              {a.activity.length === 0 ? (
                                <div className="text-sm text-white/60">No activity yet.</div>
                              ) : (
                                a.activity.map(entry => (
                                  <div key={entry.id} className="mc-card p-3 shadow-none">
                                    <div className="text-sm text-white/90">{entry.text}</div>
                                    <div className="text-xs text-white/50">{new Date(entry.ts).toLocaleString('de-DE')}</div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )
                      })()}
                    </motion.div>
                  </>
                ) : null}
              </AnimatePresence>

              <Modal open={sendTaskOpen} title="Send Task" onClose={() => setSendTaskOpen(false)}>
                <div>
                  <textarea className="mc-input w-full min-h-[140px] px-3 py-2 text-sm" placeholder="Describe the task…" value={taskText} onChange={(e) => setTaskText(e.target.value)} />
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button type="button" className="px-4 py-2 rounded-xl text-sm border border-[color:var(--border)] hover:bg-white/5 transition" onClick={() => setSendTaskOpen(false)}>Cancel</button>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl text-sm border border-[rgba(148,181,160,0.25)] mc-accent-glow hover:bg-white/5 transition"
                      onClick={() => {
                        const txt = taskText.trim(); if (!txt || !activeAgentId) return
                        setAgents(prev => prev.map(a => a.id === activeAgentId ? { ...a, activity: [{ id: uid('aa'), ts: Date.now(), text: `Task: ${txt}` }, ...a.activity].slice(0,50), lastActive: Date.now(), status: 'busy' } : a))
                        setTimeout(() => setAgents(p => p.map(a => a.id === activeAgentId ? { ...a, status: 'online' } : a)), 1200)
                        logActivity(`Sent task to ${agents.find(a=>a.id===activeAgentId)?.name || 'agent'}`)
                        setTaskText(''); setSendTaskOpen(false)
                      }}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </Modal>

              {/* Agents grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {agents.map((a) => (
                  <div key={a.id} className="mc-card p-5 hover:bg-white/5 transition cursor-pointer" onClick={() => setActiveAgentId(a.id)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{a.name}</div>
                        <div className="text-sm text-white/70 truncate">{a.role}</div>
                        <div className="mt-2 text-xs text-white/60 truncate">Model: {a.model}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={clsx('h-2.5 w-2.5 rounded-full', a.status === 'online' && 'bg-emerald-400', a.status === 'busy' && 'bg-amber-400', a.status === 'offline' && 'bg-red-400')} />
                        <span className="text-xs text-white/60 capitalize">{a.status}</span>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-white/50">Last active: {new Date(a.lastActive).toLocaleString('de-DE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</div>
                  </div>
                ))}
              </div>

              {/* Executive Decisions */}
              <div className="mc-card p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">Executive Decisions</div>
                    <div className="text-xs text-[color:var(--muted)]">Record key calls and consulted agents</div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-2">
                  <input className="mc-input px-3 py-2 text-sm w-full" placeholder="Question asked" value={decisionDraft.question} onChange={(e) => setDecisionDraft((d) => ({ ...d, question: e.target.value }))} />
                  <input className="mc-input px-3 py-2 text-sm w-full" placeholder="Decision summary" value={decisionDraft.summary} onChange={(e) => setDecisionDraft((d) => ({ ...d, summary: e.target.value }))} />
                  <div className="flex items-center gap-2 flex-wrap">
                    {agents.map((a) => (
                      <label key={a.id} className="text-xs text-white/70 flex items-center gap-1">
                        <input type="checkbox" className="accent-[color:var(--accentSolid)]" checked={decisionDraft.consulted.includes(a.name)} onChange={(e) => setDecisionDraft((d) => ({ ...d, consulted: e.target.checked ? [...new Set([...d.consulted, a.name])] : d.consulted.filter((x) => x !== a.name) }))} />
                        {a.name}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="mt-2">
                  <button
                    type="button"
                    className="px-3 py-2 rounded-xl text-sm border border-[rgba(148,181,160,0.25)] mc-accent-glow hover:bg-white/5 transition"
                    onClick={() => {
                      const q = decisionDraft.question.trim(); const s = decisionDraft.summary.trim();
                      if (!q || !s) return
                      const dec: Decision = { id: uid('dec'), dateISO: new Date().toISOString(), question: q, summary: s, consulted: [...decisionDraft.consulted] }
                      setDecisions((prev) => [dec, ...prev])
                      setDecisionDraft({ question: '', summary: '', consulted: [] })
                      logActivity(`Decision recorded: ${q}`)
                    }}
                  >
                    Add decision
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  {decisions.length === 0 ? (
                    <div className="text-sm text-white/60">No decisions yet.</div>
                  ) : (
                    decisions.map((d) => (
                      <div key={d.id} className="mc-card p-4 shadow-none">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{d.question}</div>
                            <div className="text-xs text-white/60">{new Date(d.dateISO).toLocaleDateString('de-DE')} • consulted: {d.consulted.join(', ') || '—'}</div>
                          </div>
                          <div className="text-sm text-white/80 max-w-[60ch] truncate">{d.summary}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.section>
          ) : null}

          {tab === 'revenue' ? (
            <motion.section
              key="revenue"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="mc-card p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="text-2xl font-bold tracking-tight">Revenue</div>
                    <div className="text-sm text-[color:var(--muted)]">Local-first, glassmorphism, animated</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="mc-card p-3 shadow-none">
                      <div className="text-xs text-[color:var(--muted)]">Monthly revenue goal (€)</div>
                      <input
                        className="mc-input mt-1 px-3 py-2 text-sm w-[220px]"
                        type="number"
                        min={0}
                        value={revenueGoal}
                        onChange={(e) => setRevenueGoal(Math.max(0, Number(e.target.value || 0)))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* Gauge */}
                <div className="mc-card p-5 flex items-center gap-5">
                  <div
                    className="mc-gauge"
                    style={{
                      background: `conic-gradient(var(--accentSolid) ${(Math.min(100, (mrr / Math.max(1, revenueGoal)) * 100)).toFixed(1)}%, rgba(255,255,255,0.06) 0)`,
                    }}
                  >
                    <div className="text-center">
                      <div className="text-xs text-[color:var(--muted)]">Progress</div>
                      <div className="text-xl font-bold">{mrr.toFixed(0)}€</div>
                      <div className="text-xs text-white/60">of {revenueGoal.toFixed(0)}€</div>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm text-[color:var(--muted)]">MRR</div>
                    <div className="text-2xl font-bold tracking-tight">{mrr.toFixed(2)}€ / mo</div>
                    <div className="text-xs text-white/60 mt-1">Projected annual: {(mrr * 12).toFixed(0)}€</div>
                    <div className="text-xs text-white/60">Needed to goal: {Math.max(0, revenueGoal - mrr).toFixed(0)}€ / mo</div>
                  </div>
                </div>

                {/* Chart */}
                <div className="mc-card p-5 xl:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">Last 6 months</div>
                      <div className="text-xs text-[color:var(--muted)]">CSS-only bar chart</div>
                    </div>
                  </div>
                  <div className="mt-4 h-[180px] flex items-end gap-3">
                    {revenueSeries.map((p) => {
                      const max = Math.max(1, ...revenueSeries.map((x) => x.total))
                      const h = (p.total / max) * 100
                      return (
                        <div key={p.key} className="flex-1 flex flex-col items-center gap-2">
                          <div className="w-full bg-white/5 rounded-t" style={{ height: `${h}%` }} />
                          <div className="text-xs text-white/60">{p.label}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Clients */}
              <div className="mc-card p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">Clients</div>
                    <div className="text-xs text-[color:var(--muted)]">Add/edit/remove — auto MRR</div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 lg:grid-cols-5 gap-2">
                  <input
                    className="mc-input px-3 py-2 text-sm w-full"
                    placeholder="Name"
                    value={clientDraft.name}
                    onChange={(e) => setClientDraft((d) => ({ ...d, name: e.target.value }))}
                  />
                  <input
                    className="mc-input px-3 py-2 text-sm w-full"
                    placeholder="MRR (€)"
                    type="number"
                    value={clientDraft.mrr}
                    onChange={(e) => setClientDraft((d) => ({ ...d, mrr: e.target.value }))}
                  />
                  <select
                    className="mc-input px-3 py-2 text-sm w-full"
                    value={clientDraft.status}
                    onChange={(e) => setClientDraft((d) => ({ ...d, status: e.target.value as ClientStatus }))}
                  >
                    <option value="active">active</option>
                    <option value="pending">pending</option>
                    <option value="churned">churned</option>
                  </select>
                  <input
                    className="mc-input px-3 py-2 text-sm w-full"
                    type="date"
                    value={clientDraft.startISO}
                    onChange={(e) => setClientDraft((d) => ({ ...d, startISO: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="px-3 py-2 rounded-xl text-sm border border-[rgba(148,181,160,0.25)] mc-accent-glow hover:bg-white/5 transition"
                    onClick={() => {
                      const name = clientDraft.name.trim()
                      const mrrVal = parseFloat(clientDraft.mrr)
                      if (!name || isNaN(mrrVal)) return
                      const c: Client = {
                        id: uid('cli'),
                        name,
                        mrr: mrrVal,
                        status: clientDraft.status,
                        startISO: clientDraft.startISO,
                        createdAt: Date.now(),
                      }
                      setClients((prev) => [c, ...prev])
                      logActivity(`Added client: ${c.name} (${c.mrr}€/mo)`) 
                      setClientDraft({ name: '', mrr: '', status: 'active', startISO: new Date().toISOString().slice(0, 10) })
                    }}
                  >
                    Add
                  </button>
                </div>

                <div className="mt-3 space-y-2">
                  {clients.length === 0 ? (
                    <div className="text-sm text-white/60">No clients yet.</div>
                  ) : (
                    clients.map((c) => (
                      <div key={c.id} className="mc-card p-4 shadow-none">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{c.name}</div>
                            <div className="text-xs text-white/60">{c.mrr}€ / mo • {c.status} • since {new Date(c.startISO).toLocaleDateString('de-DE')}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="text-xs text-white/60 hover:text-white/90 transition"
                              onClick={() => {
                                // inline edit: reuse draft + open modal would be nicer; keep simple
                                setClientDraft({ name: c.name, mrr: String(c.mrr), status: c.status, startISO: c.startISO })
                                setClients((prev) => prev.filter((x) => x.id !== c.id))
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="text-xs text-red-300 hover:text-red-200 transition"
                              onClick={() => setClients((prev) => prev.filter((x) => x.id !== c.id))}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Projections */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="mc-card p-4">
                    <div className="text-xs text-[color:var(--muted)]">MRR</div>
                    <div className="text-xl font-bold">{mrr.toFixed(0)}€</div>
                    <div className="text-xs text-white/60">Annualized: {(mrr * 12).toFixed(0)}€</div>
                  </div>
                  <div className="mc-card p-4">
                    <div className="text-xs text-[color:var(--muted)]">Goal</div>
                    <div className="text-xl font-bold">{revenueGoal.toFixed(0)}€</div>
                    <div className="text-xs text-white/60">Gap: {Math.max(0, revenueGoal - mrr).toFixed(0)}€ / mo</div>
                  </div>
                  <div className="mc-card p-4">
                    <div className="text-xs text-[color:var(--muted)]">Needed growth</div>
                    <div className="text-xl font-bold">{mrr === 0 ? '—' : `${Math.max(0, ((revenueGoal - mrr) / Math.max(1, mrr)) * 100).toFixed(1)}%`}</div>
                    <div className="text-xs text-white/60">to hit monthly goal</div>
                  </div>
                </div>
              </div>
            </motion.section>
          ) : null}

          {tab === 'notes' ? (
            <motion.section
              key="notes"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="mc-card p-5">
                <div className="text-2xl font-bold tracking-tight">Notes</div>
                <div className="text-sm text-[color:var(--muted)]">Autosaves every keystroke • Markdown-style text</div>
              </div>

              <div className="mc-card p-5">
                <textarea
                  className="mc-input w-full min-h-[520px] px-4 py-3 text-sm leading-relaxed"
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value)
                    // activity is intentionally light here, avoid spamming the feed
                  }}
                  placeholder={`# Notes\n\n- Write plans, snippets, meeting notes...\n- Use **bold**, _italics_, and lists.`}
                />

                <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-white/60">
                  <div>Characters: {notes.length.toLocaleString('de-DE')}</div>
                  <div>Last saved: {new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            </motion.section>
          ) : null}
        </AnimatePresence>
      </main>
    </div>
  )
}
