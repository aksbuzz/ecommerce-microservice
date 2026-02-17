import type { CatalogItem } from '@ecommerce/api-client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useBrands } from '@/hooks/use-catalog-brands'
import { useCreateItem, useUpdateItem } from '@/hooks/use-catalog-items'
import { useTypes } from '@/hooks/use-catalog-types'

const itemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(2000).default(''),
  price: z.coerce.number({ invalid_type_error: 'Price must be a number' }).min(0, 'Price must be ≥ 0'),
  catalogTypeId: z.coerce.number().int().positive('Select a type'),
  catalogBrandId: z.coerce.number().int().positive('Select a brand'),
  availableStock: z.coerce.number().int().min(0).default(0),
  maxStockThreshold: z.coerce.number().int().min(0).default(100),
  restockThreshold: z.coerce.number().int().min(0).default(10),
  pictureFileName: z.string().optional(),
})

type ItemValues = z.infer<typeof itemSchema>

interface ItemFormProps {
  open: boolean
  item: CatalogItem | null
  onClose: () => void
}

export function ItemFormDialog({ open, item, onClose }: ItemFormProps) {
  const { data: brands } = useBrands()
  const { data: types } = useTypes()
  const createMutation = useCreateItem()
  const updateMutation = useUpdateItem()

  const isEditing = item !== null
  const isPending = createMutation.isPending || updateMutation.isPending

  const form = useForm<ItemValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      catalogTypeId: 0,
      catalogBrandId: 0,
      availableStock: 0,
      maxStockThreshold: 100,
      restockThreshold: 10,
      pictureFileName: '',
    },
  })

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name,
        description: item.description,
        price: item.price,
        catalogTypeId: item.catalogTypeId,
        catalogBrandId: item.catalogBrandId,
        availableStock: item.availableStock,
        maxStockThreshold: item.maxStockThreshold,
        restockThreshold: item.restockThreshold,
        pictureFileName: item.pictureFileName ?? '',
      })
    } else {
      form.reset({
        name: '',
        description: '',
        price: 0,
        catalogTypeId: 0,
        catalogBrandId: 0,
        availableStock: 0,
        maxStockThreshold: 100,
        restockThreshold: 10,
        pictureFileName: '',
      })
    }
  }, [item, form])

  function onSubmit(values: ItemValues) {
    if (isEditing) {
      updateMutation.mutate({ id: item.id, data: values }, { onSuccess: onClose })
    } else {
      createMutation.mutate(values as any, { onSuccess: onClose })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Item' : 'Create Item'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Name</FormLabel>
                    <FormControl><Input placeholder="Product name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl><Input placeholder="Product description" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl><Input type="number" step="0.01" min="0" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pictureFileName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Picture Filename</FormLabel>
                    <FormControl><Input placeholder="image.jpg" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="catalogBrandId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ? String(field.value) : ''}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {brands?.map((b) => (
                          <SelectItem key={b.id} value={String(b.id)}>{b.brand}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="catalogTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ? String(field.value) : ''}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {types?.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>{t.type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="availableStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available Stock</FormLabel>
                    <FormControl><Input type="number" min="0" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxStockThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Stock Threshold</FormLabel>
                    <FormControl><Input type="number" min="0" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="restockThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Restock Threshold</FormLabel>
                    <FormControl><Input type="number" min="0" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <LoadingSpinner size="sm" /> : isEditing ? 'Save Changes' : 'Create Item'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
