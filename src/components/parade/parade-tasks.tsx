'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CollapsibleSection } from '@/components/collapsible-section'
import type { ParadeTask } from '@/lib/database.types'
import { CheckCircle2, Clock, AlertTriangle, User, Calendar, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { format } from 'date-fns'

interface Props {
  tasks: ParadeTask[]
  onStatusUpdate?: (id: string, status: string) => void
  onDelete?: (id: string) => void
}

const statusConfig = {
  pending: { label: 'Pending', variant: 'default' as const, icon: Clock },
  in_progress: { label: 'In Progress', variant: 'warning' as const, icon: AlertTriangle },
  completed: { label: 'Completed', variant: 'success' as const, icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', variant: 'danger' as const, icon: CheckCircle2 },
}

const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 }

export function ParadeTasks({ tasks, onStatusUpdate, onDelete }: Props) {
  const { isAdminOrCommandant } = useAuth()

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="h-10 w-10 text-[var(--color-text-muted)] mx-auto mb-2 stroke-1" />
        <p className="text-xs text-[var(--color-text-muted)]">No tasks assigned</p>
      </div>
    )
  }

  const sorted = [...tasks].sort((a, b) => (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 99) - (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 99))

  return (
    <div className="space-y-2">
      <CollapsibleSection
        items={sorted}
        keyExtractor={(task: ParadeTask) => task.id}
        defaultVisible={5}
        showMoreText="Show more tasks"
        renderItem={(task: ParadeTask) => {
          const taskStatusKey = task.status as keyof typeof statusConfig
          const StatusIcon = statusConfig[taskStatusKey].icon
          const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed' && task.status !== 'cancelled'

          return (
            <Card className={`${isOverdue ? 'border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10' : ''}`}>
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => onStatusUpdate?.(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                    className={`mt-0.5 rounded-full p-1 transition-colors ${task.status === 'completed' ? 'text-[var(--color-success)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-success)]'}`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-[var(--color-text-muted)]' : 'text-[var(--color-text-primary)]'}`}>
                        {task.description}
                      </span>
                      <Badge variant={statusConfig[task.status as keyof typeof statusConfig].variant}>
                        <StatusIcon className="h-3 w-3 mr-1 inline" />
                        {statusConfig[task.status as keyof typeof statusConfig].label}
                      </Badge>
                      {(task.priority === 'high' || task.priority === 'urgent') && (
                        <Badge variant={task.priority === 'urgent' ? 'danger' : 'warning'}>
                          {task.priority === 'urgent' ? 'URGENT' : 'High'}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-[10px] text-[var(--color-text-muted)]">
                      {task.assignee && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" /> {task.assignee.full_name}
                        </span>
                      )}
                      {task.deadline && (
                        <span className={`flex items-center gap-1 ${isOverdue ? 'text-[var(--color-danger)] font-medium' : ''}`}>
                          <Calendar className="h-3 w-3" /> {format(new Date(task.deadline), 'MMM d')}
                          {isOverdue && ' (Overdue)'}
                        </span>
                      )}
                    </div>
                  </div>
                  {isAdminOrCommandant && onStatusUpdate && (
                    <div className="flex items-center gap-1 shrink-0">
                      {task.status === 'pending' && (
                        <Button onClick={() => onStatusUpdate(task.id, 'in_progress')} size="sm" variant="ghost" className="text-xs h-7">
                          Start
                        </Button>
                      )}
                      {task.status === 'in_progress' && (
                        <Button onClick={() => onStatusUpdate(task.id, 'completed')} size="sm" variant="ghost" className="text-xs h-7 text-[var(--color-success)]">
                          Done
                        </Button>
                      )}
                      {(task.status === 'completed' || task.status === 'cancelled') && onDelete && (
                        <Button onClick={() => onDelete(task.id)} size="sm" variant="ghost" className="text-xs h-7 text-[var(--color-danger)] hover:text-[var(--color-danger)]">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        }}
      />
    </div>
  )
}
