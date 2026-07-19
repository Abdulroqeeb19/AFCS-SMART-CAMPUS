'use client'

import { Button } from './button'
import { Modal } from './modal'
import { AlertTriangle, Info, CheckCircle } from 'lucide-react'

type ConfirmVariant = 'danger' | 'warning' | 'info'

interface ConfirmDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmVariant
  loading?: boolean
}

const icons = {
  danger: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
}

const iconColors = {
  danger: 'text-[var(--color-danger)]',
  warning: 'text-[var(--color-warning)]',
  info: 'text-[var(--color-info)]',
}

const buttonVariants = {
  danger: 'danger' as const,
  warning: 'primary' as const,
  info: 'primary' as const,
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const Icon = icons[variant]

  return (
    <Modal open={open} onClose={onCancel} size="sm">
      <div className="text-center">
        <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-bg-muted)] ${iconColors[variant]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">{title}</h3>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6">{message}</p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={buttonVariants[variant]}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
