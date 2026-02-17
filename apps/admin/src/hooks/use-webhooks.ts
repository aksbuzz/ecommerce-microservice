import { ApiError, type WebhookEventType, webhooksApi } from '@ecommerce/api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/use-toast'

export function useWebhooks() {
  return useQuery({
    queryKey: ['webhooks'],
    queryFn: webhooksApi.list,
  })
}

export function useCreateWebhook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { url: string; token: string; eventType: WebhookEventType }) =>
      webhooksApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['webhooks'] })
      toast({ title: 'Webhook created' })
    },
    onError: (e) => {
      toast({ title: 'Error', description: e instanceof ApiError ? e.message : 'Failed to create webhook', variant: 'destructive' })
    },
  })
}

export function useDeleteWebhook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: webhooksApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['webhooks'] })
      toast({ title: 'Webhook deleted' })
    },
    onError: (e) => {
      toast({ title: 'Error', description: e instanceof ApiError ? e.message : 'Failed to delete webhook', variant: 'destructive' })
    },
  })
}
