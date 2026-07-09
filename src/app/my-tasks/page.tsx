'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TableSkeleton } from '@/components/skeleton'
import {
  ListChecks, Shield, Calendar, RefreshCw, AlertCircle, CheckCircle2,
  Clock, Plus, Trash2, Send,
} from 'lucide-react'
import { format } from 'date-fns'

interface TaskItem {
  id: string
  type: 'parade_task' | 'duty_roster'
  description: string
  priority: string
  status: string
  deadline: string | null
  date: string
  source: string
  parade_id?: string
}

type StatusFilter = 'all' | 'pending' | 'in_progress' | 'completed'

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
]

export default function DailyTodoPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [newTodo, setNewTodo] = useState('')
  const [adding, setAdding] = useState(false)

  const loadTasks = async () => {
    try {
      setError(null)
      setLoading(true)
      const res = await fetch('/api/tasks/mine')
      if (!res.ok) { setError('Failed to load tasks'); return }
      const data = await res.json()
      const paradeTasks: any[] = data.paradeTasks || []
      const dutyRosters: any[] = data.dutyRosters || []
      const combined: TaskItem[] = [
        ...paradeTasks.map((t) => ({
          id: t.id,
          type: 'parade_task' as const,
          description: t.description,
          priority: t.priority,
          status: t.status,
          deadline: t.deadline,
          date: t.parade?.date || t.created_at?.split('T')[0] || '',
          source: `${t.parade?.type || ''} Parade`.replace(/^\w/, (c: string) => c.toUpperCase()),
          parade_id: t.parade_id,
        })),
        ...dutyRosters.map((r) => ({
          id: r.id,
          type: 'duty_roster' as const,
          description: r.duty_type?.name || 'Duty',
          priority: 'normal',
          status: r.status,
          deadline: null,
          date: r.date,
          source: 'Duty Roster',
        })),
      ]
      setTasks(combined)
    } catch {
      setError('Failed to load your tasks')
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (user) loadTasks() }, [user])

  const updateTaskStatus = async (task: TaskItem, newStatus: string) => {
    if (task.type === 'parade_task') {
      if (!task.parade_id) { setError('Missing parade reference'); return }
      await fetch(`/api/parades/${task.parade_id}/tasks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, status: newStatus }),
      })
    } else {
      await fetch('/api/rosters', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, status: newStatus }),
      })
    }
    loadTasks()
  }

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return
    setAdding(true)
    try {
      await fetch('/api/tasks/mine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: newTodo.trim() }),
      })
      setNewTodo('')
      loadTasks()
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteTodo = async (task: TaskItem) => {
    if (task.type === 'parade_task') {
      await fetch(`/api/tasks/mine?id=${task.id}`, { method: 'DELETE' })
    }
    loadTasks()
  }

  const filtered = useMemo(() => {
    let result = [...tasks]
    if (statusFilter !== 'all') result = result.filter((t) => t.status === statusFilter)
    return result
  }, [tasks, statusFilter])

  const grouped = useMemo(() => {
    const overdue = filtered.filter(
      (t) => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed' && t.status !== 'cancelled'
    )
    const pending = filtered.filter((t) => t.status === 'pending' && !overdue.includes(t))
    const inProgress = filtered.filter((t) => t.status === 'in_progress')
    const completed = filtered.filter((t) => t.status === 'completed')
    const cancelled = filtered.filter((t) => t.status === 'cancelled')

    const sortByPriorityThenDeadline = (a: TaskItem, b: TaskItem) => {
      const p = { urgent: 0, high: 1, normal: 2, low: 3 }
      const pa = p[a.priority as keyof typeof p] ?? 99
      const pb = p[b.priority as keyof typeof p] ?? 99
      if (pa !== pb) return pa - pb
      if (a.deadline && b.deadline) return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      if (a.deadline) return -1
      if (b.deadline) return 1
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    }

    const sortByDateDesc = (a: TaskItem, b: TaskItem) => new Date(b.date).getTime() - new Date(a.date).getTime()

    return [
      ...(overdue.length ? [{ label: 'Overdue', color: 'text-red-600 border-red-300', items: overdue.sort(sortByPriorityThenDeadline) }] : []),
      ...(pending.length ? [{ label: 'Pending', color: 'text-amber-600 border-amber-300', items: pending.sort(sortByPriorityThenDeadline) }] : []),
      ...(inProgress.length ? [{ label: 'In Progress', color: 'text-blue-600 border-blue-300', items: inProgress.sort(sortByPriorityThenDeadline) }] : []),
      ...(completed.length ? [{ label: 'Completed', color: 'text-emerald-600 border-emerald-300', items: completed.sort(sortByDateDesc) }] : []),
      ...(cancelled.length ? [{ label: 'Cancelled', color: 'text-zinc-400 border-zinc-300', items: cancelled.sort(sortByDateDesc) }] : []),
    ]
  }, [filtered])

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <TableSkeleton rows={1} />
        <TableSkeleton rows={5} />
      </div>
    )
  }

  const countBy = (s: string) => tasks.filter((t) => t.status === s).length
  const pendingCount = countBy('pending') + countBy('in_progress')
  const completedCount = countBy('completed')

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#001A4D]">Daily To-Do</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Your personal daily checklist</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="h-1 w-8 rounded-full bg-[#001A4D]" />
          <span className="h-1 w-8 rounded-full bg-[#C9A84C]" />
          <span className="h-1 w-8 rounded-full bg-[#E03C31]" />
          <span className="h-1 w-8 rounded-full bg-[#008751]" />
        </div>
      </div>

      <div className="grid gap-4 grid-cols-3">
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs font-medium text-zinc-500 uppercase">Total</p>
          <p className="text-2xl font-bold text-blue-600">{tasks.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs font-medium text-zinc-500 uppercase">Active</p>
          <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs font-medium text-zinc-500 uppercase">Completed</p>
          <p className="text-2xl font-bold text-emerald-600">{completedCount}</p>
        </CardContent></Card>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <Button onClick={loadTasks} variant="ghost" size="sm" className="ml-auto gap-1">
            <RefreshCw className="h-3 w-3" /> Retry
          </Button>
        </div>
      )}

      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardContent className="p-4">
          <form onSubmit={(e) => { e.preventDefault(); handleAddTodo() }} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add a new to-do item..."
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              className="flex-1 h-10 rounded-lg border border-emerald-300 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Button type="submit" size="sm" className="gap-1.5 h-10" disabled={adding || !newTodo.trim()}>
              {adding ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-1 rounded-xl bg-zinc-100 p-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === tab.id
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {tab.label}
              {tab.id !== 'all' && (
                <span className="ml-1.5 text-[10px] opacity-60">
                  ({tab.id === 'pending' ? pendingCount : countBy(tab.id)})
                </span>
              )}
            </button>
          ))}
        </div>
        <Button onClick={loadTasks} variant="ghost" size="sm" className="gap-1">
          <RefreshCw className="h-3 w-3" /> Refresh
        </Button>
      </div>

      {filtered.length === 0 && !error && (
        <Card>
          <CardContent className="p-12 text-center">
            <ListChecks className="h-14 w-14 text-zinc-300 mx-auto mb-3 stroke-1" />
            <p className="text-sm font-medium text-zinc-500">
              {statusFilter !== 'all'
                ? 'No tasks match the current filter'
                : 'Nothing on your to-do list yet'}
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              {statusFilter !== 'all'
                ? 'Try adjusting the filter above'
                : 'Add an item using the input above'}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {grouped.map((section) => (
          <div key={section.label}>
            <div className={`flex items-center gap-2 mb-3 border-l-4 ${section.color} pl-3`}>
              <h3 className="text-sm font-semibold text-zinc-700">{section.label}</h3>
              <span className="text-xs text-zinc-400">({section.items.length})</span>
            </div>

            <div className="space-y-2">
              {section.items.map((task) => {
                const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed' && task.status !== 'cancelled'

                return (
                  <Card key={`${task.type}-${task.id}`} className={`${isOverdue ? 'border-red-300 bg-red-50/40' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => updateTaskStatus(task, task.status === 'completed' ? 'pending' : 'completed')}
                          className={`mt-0.5 rounded-full p-1 transition-colors ${
                            task.status === 'completed'
                              ? 'text-emerald-500'
                              : task.status === 'cancelled'
                                ? 'text-zinc-300 cursor-not-allowed'
                                : 'text-zinc-300 hover:text-emerald-400'
                          }`}
                          disabled={task.status === 'cancelled'}
                        >
                          <CheckCircle2 className="h-5 w-5" />
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-medium ${
                              task.status === 'completed' || task.status === 'cancelled'
                                ? 'line-through text-zinc-400'
                                : 'text-zinc-900'
                            }`}>
                              {task.description}
                            </span>
                            <Badge variant={
                              task.status === 'completed' ? 'success' :
                              task.status === 'in_progress' ? 'warning' :
                              task.status === 'pending' ? 'default' :
                              'danger'
                            } className="text-[10px]">
                              {task.status === 'in_progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-400">
                            <span className="flex items-center gap-1">
                              {task.type === 'parade_task'
                                ? <Shield className="h-3 w-3 text-blue-400" />
                                : <Calendar className="h-3 w-3 text-amber-400" />}
                              {task.source}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> {task.date || '—'}
                            </span>
                            {task.deadline && (
                              <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : ''}`}>
                                <Clock className="h-3 w-3" /> Due: {format(new Date(task.deadline), 'MMM d')}
                                {isOverdue && ' (Overdue)'}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {task.status === 'pending' && (
                            <Button
                              onClick={() => updateTaskStatus(task, 'in_progress')}
                              size="sm" variant="ghost" className="text-xs h-7"
                            >
                              Start
                            </Button>
                          )}
                          {task.status === 'in_progress' && (
                            <Button
                              onClick={() => updateTaskStatus(task, 'completed')}
                              size="sm" variant="ghost" className="text-xs h-7 text-emerald-600"
                            >
                              Done
                            </Button>
                          )}
                          {task.type === 'parade_task' && (
                            <Button
                              onClick={() => handleDeleteTodo(task)}
                              size="sm" variant="ghost" className="text-xs h-7 text-red-400 hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
