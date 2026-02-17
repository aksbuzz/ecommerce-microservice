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
    <header className="flex h-14 items-center justify-between border-b px-6">
      <div />
      <div className="flex items-center gap-3">
        {user && (
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            {user.name} {user.lastName}
          </span>
        )}
        <Button variant="ghost" size="sm" onClick={handleLogout} disabled={logoutMutation.isPending}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  )
}
