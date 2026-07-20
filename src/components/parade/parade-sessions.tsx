'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CollapsibleSection } from '@/components/collapsible-section'
import type { ParadeSession } from '@/lib/database.types'
import { Shield, Clock, Users, CheckCircle2, XCircle, PlayCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

interface Props {
  sessions: ParadeSession[]
  loading: boolean
  onStart?: (id: string) => void
  onComplete?: (id: string) => void
  onCancel?: (id: string) => void
  onCreate?: () => void
}

const statusConfig = {
  scheduled: { label: 'Scheduled', variant: 'info' as const, icon: Clock },
  ongoing: { label: 'Ongoing', variant: 'warning' as const, icon: PlayCircle },
  completed: { label: 'Completed', variant: 'success' as const, icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', variant: 'danger' as const, icon: XCircle },
}

const typeConfig = {
  morning: 'Morning Parade',
  evening: 'Evening Parade',
  special: 'Special Parade',
}

export function ParadeSessions({ sessions, loading, onStart, onComplete, onCancel, onCreate }: Props) {
  const { isAdminOrCommandant } = useAuth()

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-[var(--color-bg-muted)]" />
        ))}
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Shield className="h-14 w-14 text-[var(--color-text-muted)] mx-auto mb-3 stroke-1" />
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">No parade sessions</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Create a new parade session to get started</p>
          {isAdminOrCommandant && onCreate && (
            <Button onClick={onCreate} className="mt-4 gap-2">
              <Shield className="h-4 w-4" /> New Parade
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      <CollapsibleSection
        items={sessions}
        keyExtractor={(session: ParadeSession) => session.id}
        defaultVisible={5}
        showMoreText="Show more sessions"
        renderItem={(session: ParadeSession) => {
          const statusKey = session.status as keyof typeof statusConfig
          const StatusIcon = statusConfig[statusKey].icon
          const briefingCount = session.briefings?.length || 0
          const taskCount = session.tasks?.length || 0
          const ackCount = session.acknowledgements?.length || 0

          return (
            <Card className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full p-2.5 bg-[var(--color-info)]/20 mt-0.5">
                      <Shield className="h-5 w-5 text-[var(--color-info)]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-[var(--color-text-primary)] text-sm">
                          {typeConfig[session.type as keyof typeof typeConfig]}
                        </h3>
                        <Badge variant={statusConfig[session.status as keyof typeof statusConfig].variant}>
                          <StatusIcon className="h-3 w-3 mr-1 inline" />
                          {statusConfig[session.status as keyof typeof statusConfig].label}
                        </Badge>
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                        {session.date} &middot; {session.conductor ? `Conducted by ${session.conductor.full_name}` : 'No conductor assigned'}
                      </p>
                      {session.notes && (
                        <p className="text-xs text-[var(--color-text-muted)] mt-2 line-clamp-2">{session.notes}</p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-xs text-[var(--color-text-muted)]">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {ackCount} acknowledged
                        </span>
                        <span className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {briefingCount} briefings
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> {taskCount} tasks
                        </span>
                      </div>
                    </div>
                  </div>
                  {isAdminOrCommandant && session.status === 'scheduled' && (
                    <div className="flex items-center gap-2 shrink-0">
                      {onStart && (
                        <Button onClick={() => onStart(session.id)} size="sm" variant="primary" className="gap-1.5">
                          <PlayCircle className="h-3.5 w-3.5" /> Start
                        </Button>
                      )}
                      {onCancel && (
                        <Button onClick={() => onCancel(session.id)} size="sm" variant="outline" className="gap-1.5 text-[var(--color-danger)]">
                          <XCircle className="h-3.5 w-3.5" /> Cancel
                        </Button>
                      )}
                    </div>
                  )}
                  {isAdminOrCommandant && session.status === 'ongoing' && onComplete && (
                    <Button onClick={() => onComplete(session.id)} size="sm" variant="primary" className="gap-1.5 shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                    </Button>
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
