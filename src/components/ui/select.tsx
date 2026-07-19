import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-[var(--color-text-primary)]">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full appearance-none rounded-lg border px-3 py-2 pr-8 text-sm transition-colors duration-150',
              'bg-[var(--color-bg-card)] text-[var(--color-text-primary)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-1',
              error
                ? 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]'
                : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              className,
            )}
            aria-invalid={!!error}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
        </div>
        {error && (
          <p className="text-xs text-[var(--color-danger)]" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  },
)

Select.displayName = 'Select'
