import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'CAD') {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency', currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(date: string | Date) {
  return format(new Date(date), 'MMM d, yyyy')
}

export function daysOverdue(dueDate: string) {
  const days = Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000)
  return days > 0 ? days : 0
}

export function statusColor(status: string) {
  const map: Record<string, string> = {
    paid: 'bg-green-100 text-green-800',
    sent: 'bg-blue-100 text-blue-800',
    overdue: 'bg-red-100 text-red-800',
    draft: 'bg-gray-100 text-gray-700',
    partial: 'bg-amber-100 text-amber-800',
    cancelled: 'bg-gray-100 text-gray-400',
  }
  return map[status] ?? 'bg-gray-100 text-gray-700'
}