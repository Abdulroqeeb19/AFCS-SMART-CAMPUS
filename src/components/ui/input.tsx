import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[var(--color-text-primary)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-lg border px-3 py-2 text-sm transition-colors duration-150',
            'bg-[var(--color-bg-card)] text-[var(--color-text-primary)]',
            'placeholder:text-[var(--color-text-muted)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-1',
            error
              ? 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]'
              : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className,
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-[var(--color-danger)]" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-[var(--color-text-muted)]">
            {hint}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
