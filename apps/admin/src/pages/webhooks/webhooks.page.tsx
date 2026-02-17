import type { WebhookEventType } from '@ecommerce/api-client'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { FullPageSpinner, LoadingSpinner } from '@/components/shared/loading-spinner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCreateWebhook, useDeleteWebhook, useWebhooks } from '@/hooks/use-webhooks'
import { formatDate } from '@/lib/utils'

const EVENT_TYPES: WebhookEventType[] = [
  'order.submitted', 'order.confirmed', 'order.paid', 'order.shipped', 'order.cancelled',
  'catalog.item.created', 'catalog.item.price_changed', 'catalog.item.deleted',
  'identity.user.registered', 'identity.user.deleted',
  'stock.confirmed', 'stock.rejected',
  'payment.succeeded', 'payment.failed',
]

const webhookSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  token: z.string().min(8, 'Token must be at least 8 characters').max(255),
  eventType: z.enum([
    'order.submitted', 'order.confirmed', 'order.paid', 'order.shipped', 'order.cancelled',
    'catalog.item.created', 'catalog.item.price_changed', 'catalog.item.deleted',
    'identity.user.registered', 'identity.user.deleted',
    'stock.confirmed', 'stock.rejected',
    'payment.succeeded', 'payment.failed',
  ] as const),
})

type WebhookValues = z.infer<typeof webhookSchema>

export function WebhooksPage() {
  const [isOpen, setIsOpen] = useState(false)
  const { data: webhooks, isLoading } = useWebhooks()
  const createMutation = useCreateWebhook()
  const deleteMutation = useDeleteWebhook()

  const form = useForm<WebhookValues>({
    resolver: zodResolver(webhookSchema),
    defaultValues: { url: '', token: '', eventType: 'order.submitted' },
  })

  function onSubmit(values: WebhookValues) {
    createMutation.mutate(values, {
      onSuccess: () => {
        setIsOpen(false)
        form.reset()
      },
    })
  }

  if (isLoading) return <FullPageSpinner />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Webhooks</h1>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Webhook
        </Button>
      </div>

      {!webhooks?.length ? (
        <EmptyState
          title="No webhooks"
          description="Create a webhook to receive event notifications."
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>URL</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map((wh) => (
                <TableRow key={wh.id}>
                  <TableCell className="max-w-50 truncate font-mono text-xs">{wh.url}</TableCell>
                  <TableCell>
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">
                      {wh.eventType}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{wh.token.slice(0, 4)}••••</TableCell>
                  <TableCell>{formatDate(wh.createdAt)}</TableCell>
                  <TableCell>
                    <ConfirmDialog
                      trigger={
                        <Button variant="destructive" size="sm" disabled={deleteMutation.isPending}>
                          Delete
                        </Button>
                      }
                      title="Delete webhook?"
                      description="This will stop sending events to this URL."
                      onConfirm={() => deleteMutation.mutate(wh.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Webhook Subscription</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endpoint URL</FormLabel>
                    <FormControl><Input placeholder="https://your-server.com/webhook" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="token"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secret Token</FormLabel>
                    <FormControl><Input placeholder="Minimum 8 characters" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="eventType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EVENT_TYPES.map((et) => (
                          <SelectItem key={et} value={et}>{et}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <LoadingSpinner size="sm" /> : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
