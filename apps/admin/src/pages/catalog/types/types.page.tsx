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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCreateType, useDeleteType, useTypes } from '@/hooks/use-catalog-types'

const typeSchema = z.object({ type: z.string().min(1, 'Type name is required').max(100) })
type TypeValues = z.infer<typeof typeSchema>

export function TypesPage() {
  const [isOpen, setIsOpen] = useState(false)
  const { data: types, isLoading } = useTypes()
  const createMutation = useCreateType()
  const deleteMutation = useDeleteType()

  const form = useForm<TypeValues>({
    resolver: zodResolver(typeSchema),
    defaultValues: { type: '' },
  })

  function onSubmit(values: TypeValues) {
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
        <h1 className="text-2xl font-bold">Types</h1>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Type
        </Button>
      </div>

      {!types?.length ? (
        <EmptyState title="No types" description="Create your first product type to get started." />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.id}</TableCell>
                  <TableCell className="font-medium">{t.type}</TableCell>
                  <TableCell>
                    <ConfirmDialog
                      trigger={
                        <Button variant="destructive" size="sm" disabled={deleteMutation.isPending}>
                          Delete
                        </Button>
                      }
                      title="Delete type?"
                      description={`Are you sure you want to delete "${t.type}"? This cannot be undone.`}
                      onConfirm={() => deleteMutation.mutate(t.id)}
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
            <DialogTitle>Add Type</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Electronics" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
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
