import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function isLate(checkIn: string | Date, cutoffHour = 8, cutoffMinute = 0): boolean {
  const time = new Date(checkIn)
  const cutoff = new Date(time)
  cutoff.setHours(cutoffHour, cutoffMinute, 0, 0)
  return time > cutoff
}
