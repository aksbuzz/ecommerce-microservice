import { LogOut, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useCurrentUser, useLogout } from '@/hooks/use-auth'

export function Header() {
  const navigate = useNavigate()
  const { data: user } = useCurrentUser()
  const logoutMutation = useLogout()

  function handleLogout() {
    logoutMutation.mutate(undefined, {
      onSuccess: () => navigate('/login'),
    })
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-[hsl(var(--border))] px-6">
      <div />
      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">
              {user.name} {user.lastName}
            </span>
          </div>
        )}
        <div className="h-5 w-px bg-border" />
        <Button variant="ghost" size="sm" onClick={handleLogout} disabled={logoutMutation.isPending} className="text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  )
}
