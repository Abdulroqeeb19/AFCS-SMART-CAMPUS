'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { ParadeTasks } from '@/components/parade/parade-tasks'
import { TableSkeleton } from '@/components/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import type { ParadeSession, ParadeTask, ParadeAcknowledgement, ParadeBriefing, Staff } from '@/lib/database.types'
import { Shield, RefreshCw, Plus, CheckCircle2, Users, ListChecks, AlertCircle, Send } from 'lucide-react'

interface ParadeWithRelations extends ParadeSession {
  briefings?: ParadeBriefing[]
  tasks?: ParadeTask[]
  acknowledgements?: ParadeAcknowledgement[]
  conductor?: Staff
}

export function MusterContent() {
  const { user, isAdminOrCommandant } = useAuth()
  const [sessions, setSessions] = useState<ParadeWithRelations[]>([])
  const [activeParade, setActiveParade] = useState<ParadeWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddTask, setShowAddTask] = useState(false)
  const [allStaff, setAllStaff] = useState<Staff[]>([])

  const [taskForm, setTaskForm] = useState({
    description: '',
    assigned_to: '',
    priority: 'normal',
    deadline: '',
  })

  const loadSessions = useCallback(async () => {
    try {
      setError(null)
      const [paradeRes, staffRes] = await Promise.all([
        fetch('/api/parades?limit=20'),
        fetch('/api/staff'),
      ])
      if (paradeRes.ok) {
        const data = await paradeRes.json()
        setSessions(data)
        const today = new Date().toISOString().split('T')[0]
        const active = data.find((s: ParadeWithRelations) => s.date === today && s.status !== 'cancelled') || data[0] || null
        setActiveParade(active)
      }
      if (staffRes.ok) setAllStaff(await staffRes.json())
    } catch {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadSessions() }, [loadSessions])

  const handleTaskStatus = async (id: string, status: string) => {
    await fetch(`/api/parades/${activeParade?.id}/tasks`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    loadSessions()
  }

  const handleAddTask = async () => {
    if (!activeParade || !taskForm.description.trim()) return
    await fetch(`/api/parades/${activeParade.id}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: taskForm.description.trim(),
        assigned_to: taskForm.assigned_to || null,
        priority: taskForm.priority,
        deadline: taskForm.deadline || null,
      }),
    })
    setTaskForm({ description: '', assigned_to: '', priority: 'normal', deadline: '' })
    setShowAddTask(false)
    loadSessions()
  }

  const handleAcknowledge = async () => {
    if (!activeParade || !user) return
    await fetch(`/api/parades/${activeParade.id}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staff_id: user.id }),
    })
    loadSessions()
  }

  const allTasks = sessions.flatMap((s) => s.tasks || [])
  const activeTasks = activeParade?.tasks || []
  const activeAcks = activeParade?.acknowledgements || []
  const alreadyAcknowledged = activeAcks.some((a) => a.staff_id === user?.id)

  const stats = {
    total: allTasks.length,
    open: allTasks.filter((t) => t.status !== 'completed').length,
    completed: allTasks.filter((t) => t.status === 'completed').length,
    highUrgent: allTasks.filter((t) => t.priority === 'high' || t.priority === 'urgent').filter((t) => t.status !== 'completed').length,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-4"><TableSkeleton rows={1} /></div>
        <TableSkeleton rows={5} />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-10 w-10 text-amber-400 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm mb-4">{error}</p>
          <Button onClick={loadSessions} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs font-medium text-zinc-500 uppercase">Total Tasks</p>
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs font-medium text-zinc-500 uppercase">Open</p>
          <p className="text-2xl font-bold text-amber-600">{stats.open}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs font-medium text-zinc-500 uppercase">Completed</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-xs font-medium text-zinc-500 uppercase">High / Urgent</p>
          <p className="text-2xl font-bold text-red-600">{stats.highUrgent}</p>
        </CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <ListChecks className="h-4 w-4 text-emerald-500" />
                Tasks
                <Badge variant="default">{allTasks.filter((t) => t.status !== 'completed').length} open</Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button onClick={loadSessions} variant="ghost" size="sm" className="gap-1">
                  <RefreshCw className="h-3 w-3" /> Refresh
                </Button>
                {isAdminOrCommandant && activeParade && (
                  <Button onClick={() => setShowAddTask(!showAddTask)} size="sm" className="gap-1.5">
                    <Plus className="h-3.5 w-3.5" /> Add Task
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {showAddTask && (
                <div className="mb-4 space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
                  <textarea
                    placeholder="Task description"
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    className="w-full min-h-[60px] rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select value={taskForm.assigned_to} onChange={(e) => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                      className="h-9 rounded-lg border border-emerald-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      <option value="">Assign to...</option>
                      {allStaff.map((s) => (
                        <option key={s.id} value={s.id}>{s.full_name}</option>
                      ))}
                    </select>
                    <select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                      className="h-9 rounded-lg border border-emerald-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      <option value="low">Low Priority</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    <input type="date" value={taskForm.deadline} onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                      className="h-9 rounded-lg border border-emerald-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <Button onClick={handleAddTask} size="sm" className="gap-1.5">
                    <Send className="h-3.5 w-3.5" /> Create Task
                  </Button>
                </div>
              )}
              {activeParade ? (
                <ParadeTasks
                  tasks={activeTasks}
                  onStatusUpdate={isAdminOrCommandant ? handleTaskStatus : undefined}
                />
              ) : (
                <p className="text-xs text-zinc-400 text-center py-8">No active session. Create one to assign tasks.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-blue-500" />
                Current Parade
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeParade ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Shield className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        {activeParade.type === 'morning' ? 'Morning' : activeParade.type === 'evening' ? 'Evening' : 'Special'} Parade
                      </p>
                      <p className="text-xs text-zinc-400">{activeParade.date}</p>
                    </div>
                  </div>
                  <Badge variant={activeParade.status === 'ongoing' ? 'warning' : activeParade.status === 'completed' ? 'success' : 'info'}>
                    {activeParade.status.charAt(0).toUpperCase() + activeParade.status.slice(1)}
                  </Badge>

                  {!alreadyAcknowledged && activeParade.status !== 'cancelled' && (
                    <Button onClick={handleAcknowledge} size="sm" variant="outline" className="gap-1.5 w-full">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Acknowledge Parade
                    </Button>
                  )}
                  {alreadyAcknowledged && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Acknowledged
                    </p>
                  )}

                  <div className="pt-2 border-t border-zinc-100">
                    <p className="text-xs font-medium text-zinc-500 mb-2">
                      <Users className="h-3 w-3 inline mr-1" />
                      {activeAcks.length} staff acknowledged
                    </p>
                    {activeAcks.length > 0 && (
                      <div className="space-y-1">
                        {activeAcks.slice(0, 5).map((a) => (
                          <p key={a.id} className="text-xs text-zinc-400">
                            {a.staff?.full_name || 'Unknown'}
                          </p>
                        ))}
                        {activeAcks.length > 5 && (
                          <p className="text-[10px] text-zinc-400">+{activeAcks.length - 5} more</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-zinc-400 text-center py-6">No active parade session.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
