'use client'

import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CollapsibleCardProps {
  title: string
  icon?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  defaultOpen?: boolean
}

export function CollapsibleCard({
  title,
  icon,
  actions,
  children,
  className,
  defaultOpen = true,
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Card className={className}>
      <CardHeader
        className="flex-row items-center justify-between cursor-pointer select-none"
        onClick={() => setOpen((o) => !o)}
      >
        <CardTitle className="flex items-center gap-2 text-sm">
          {open ? (
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          ) : (
            <ChevronUp className="h-4 w-4 text-zinc-400" />
          )}
          {icon}
          {title}
        </CardTitle>
        {actions && (
          <div onClick={(e) => e.stopPropagation()}>{actions}</div>
        )}
      </CardHeader>
      {open && <CardContent>{children}</CardContent>}
    </Card>
  )
}
