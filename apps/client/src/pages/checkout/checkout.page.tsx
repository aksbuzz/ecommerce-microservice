import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useCurrentUser } from '@/hooks/use-auth'
import { useBasket, useCheckout } from '@/hooks/use-basket'
import { formatCurrency } from '@/lib/utils'

const checkoutSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
})

type CheckoutValues = z.infer<typeof checkoutSchema>

export function CheckoutPage() {
  const navigate = useNavigate()
  const { data: user } = useCurrentUser()
  const { data: basket } = useBasket()
  const checkoutMutation = useCheckout()

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    values: {
      street: user?.street ?? '',
      city: user?.city ?? '',
      state: user?.state ?? '',
      country: user?.country ?? '',
      zipCode: user?.zipCode ?? '',
    },
  })

  const items = basket?.items ?? []
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)

  function onSubmit(values: CheckoutValues) {
    checkoutMutation.mutate(values, {
      onSuccess: () => navigate('/checkout/success', { replace: true }),
      onError: (err) => form.setError('root', { message: err.message }),
    })
  }

  if (!items.length) {
    navigate('/', { replace: true })
    return null
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Delivery Address</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="checkout-form">
                <FormField control={form.control} name="street" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl><Input placeholder="123 Main St" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl><Input placeholder="New York" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="state" render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl><Input placeholder="NY" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="country" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl><Input placeholder="USA" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="zipCode" render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl><Input placeholder="10001" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                {form.formState.errors.root && (
                  <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span>{item.productName} × {item.quantity}</span>
                  <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
            </CardContent>
          </Card>
          <Button
            form="checkout-form"
            type="submit"
            className="w-full"
            size="lg"
            disabled={checkoutMutation.isPending}
          >
            {checkoutMutation.isPending ? <><LoadingSpinner size="sm" /> Processing...</> : 'Place Order'}
          </Button>
        </div>
      </div>
    </div>
  )
}
