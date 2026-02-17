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
import { useBrands, useCreateBrand, useDeleteBrand } from '@/hooks/use-catalog-brands'

const brandSchema = z.object({ brand: z.string().min(1, 'Brand name is required').max(100) })
type BrandValues = z.infer<typeof brandSchema>

export function BrandsPage() {
  const [isOpen, setIsOpen] = useState(false)
  const { data: brands, isLoading } = useBrands()
  const createMutation = useCreateBrand()
  const deleteMutation = useDeleteBrand()

  const form = useForm<BrandValues>({
    resolver: zodResolver(brandSchema),
    defaultValues: { brand: '' },
  })

  function onSubmit(values: BrandValues) {
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
        <h1 className="text-2xl font-bold">Brands</h1>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Brand
        </Button>
      </div>

      {!brands?.length ? (
        <EmptyState title="No brands" description="Create your first brand to get started." />
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
              {brands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell className="font-mono text-xs">{brand.id}</TableCell>
                  <TableCell className="font-medium">{brand.brand}</TableCell>
                  <TableCell>
                    <ConfirmDialog
                      trigger={
                        <Button variant="destructive" size="sm" disabled={deleteMutation.isPending}>
                          Delete
                        </Button>
                      }
                      title="Delete brand?"
                      description={`Are you sure you want to delete "${brand.brand}"? This cannot be undone.`}
                      onConfirm={() => deleteMutation.mutate(brand.id)}
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
            <DialogTitle>Add Brand</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Nike" {...field} />
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
