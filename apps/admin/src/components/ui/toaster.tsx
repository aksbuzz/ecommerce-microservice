import { X } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed top-4 right-4 z-100 flex max-h-screen flex-col gap-2 w-full max-w-sm">
      {toasts
        .filter((t) => t.open)
        .map((t) => (
          <div
            key={t.id}
            className={cn(
              'relative flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all',
              t.variant === 'destructive'
                ? 'border-destructive bg-destructive text-destructive-foreground'
                : 'border bg-background text-foreground',
            )}
          >
            <div className="flex-1 space-y-1">
              {t.title && <p className="text-sm font-semibold">{t.title}</p>}
              {t.description && <p className="text-sm opacity-90">{t.description}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded-sm opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
    </div>
  )
}
