"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { axiosInstance } from "@/lib/axios"
import { PlusCircle, Trash2, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

interface Product {
  _id: string
  id?: string
  name: string
  sellingPrice?: number
  mrp?: number
}

interface User {
  _id: string
  id?: string
  name: string
  email: string
  phone: string
  userType?: string
}

interface Address {
  _id: string
  title: string
  name: string
  phone: string
  address: string
  city: string
  state: string
  pincode: string
  email?: string
}

interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
  mrp?: number
}

const emptyAddress = {
  name: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  email: "",
}

export default function CreateOrderPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [customerType, setCustomerType] = useState<"guest" | "user">("guest")
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [address, setAddress] = useState(emptyAddress)
  const [items, setItems] = useState<OrderItem[]>([])
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online" | "partial">("cod")
  const [promoCode, setPromoCode] = useState("")
  const [specialRequests, setSpecialRequests] = useState("")
  const [timing, setTiming] = useState("")

  const [addProductId, setAddProductId] = useState("")
  const [addQuantity, setAddQuantity] = useState(1)

  useEffect(() => {
    const fetch = async () => {
      try {
        const [prodRes, userRes] = await Promise.all([
          axiosInstance.get("/admin/products"),
          axiosInstance.get("/admin/users"),
        ])
        const prodList = prodRes.data?.products ?? prodRes.data?.data ?? []
        setProducts(Array.isArray(prodList) ? prodList : [])
        const userList = userRes.data?.users ?? userRes.data?.data ?? []
        const all = Array.isArray(userList) ? userList : []
        setUsers(all.filter((u: User) => u.userType === "buyer" || !u.userType))
      } catch (e) {
        toast({ title: "Error", description: "Failed to load data", variant: "destructive" })
      } finally {
        setLoadingProducts(false)
        setLoadingUsers(false)
      }
    }
    fetch()
  }, [toast])

  useEffect(() => {
    if (customerType !== "user" || !selectedUserId) {
      setAddresses([])
      setAddress(emptyAddress)
      return
    }
    axiosInstance
      .get(`/admin/users/${selectedUserId}/addresses`)
      .then((res) => {
        const list = res.data?.addresses ?? []
        setAddresses(list)
        if (list.length > 0) {
          const a = list[0]
          setAddress({
            name: a.name ?? "",
            phone: a.phone ?? "",
            address: a.address ?? "",
            city: a.city ?? "",
            state: a.state ?? "",
            pincode: a.pincode ?? "",
            email: a.email ?? "",
          })
        } else {
          setAddress(emptyAddress)
        }
      })
      .catch(() => {
        setAddresses([])
        setAddress(emptyAddress)
      })
  }, [customerType, selectedUserId])

  const selectAddress = (a: Address) => {
    setAddress({
      name: a.name ?? "",
      phone: a.phone ?? "",
      address: a.address ?? "",
      city: a.city ?? "",
      state: a.state ?? "",
      pincode: a.pincode ?? "",
      email: a.email ?? "",
    })
  }

  const addItem = () => {
    const product = products.find((p) => (p._id || p.id) === addProductId)
    if (!product) return
    const price = product.sellingPrice ?? product.mrp ?? 0
    const existing = items.find((i) => i.productId === (product._id || product.id))
    if (existing) {
      setItems(items.map((i) => (i.productId === existing.productId ? { ...i, quantity: i.quantity + addQuantity } : i)))
    } else {
      setItems([
        ...items,
        {
          productId: product._id || product.id || "",
          name: product.name,
          price: Number(price),
          quantity: addQuantity,
          mrp: product.mrp,
        },
      ])
    }
    setAddProductId("")
    setAddQuantity(1)
  }

  const removeItem = (productId: string) => {
    setItems(items.filter((i) => i.productId !== productId))
  }

  const updateItemQty = (productId: string, quantity: number) => {
    if (quantity < 1) return
    setItems(items.map((i) => (i.productId === productId ? { ...i, quantity } : i)))
  }

  const updateItemPrice = (productId: string, price: number) => {
    setItems(items.map((i) => (i.productId === productId ? { ...i, price } : i)))
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const totalAmount = subtotal + Number(deliveryFee)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) {
      toast({ title: "Add items", description: "Add at least one product to the order", variant: "destructive" })
      return
    }
    if (!address.name?.trim() || !address.phone?.trim() || !address.address?.trim() || !address.city?.trim() || !address.state?.trim() || !address.pincode?.trim()) {
      toast({ title: "Address required", description: "Fill in all address fields", variant: "destructive" })
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        userId: customerType === "user" && selectedUserId ? selectedUserId : undefined,
        items: items.map((i) => ({ productId: i.productId, name: i.name, price: i.price, quantity: i.quantity, mrp: i.mrp })),
        address: {
          name: address.name,
          phone: address.phone,
          address: address.address,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          email: address.email || undefined,
        },
        paymentMethod,
        deliveryFee: Number(deliveryFee) || 0,
        promoCode: promoCode.trim() || undefined,
        specialRequests: specialRequests.trim() || undefined,
        timing: timing.trim() || undefined,
      }
      const res = await axiosInstance.post("/admin/orders", payload)
      const order = res.data?.order
      toast({ title: "Order created", description: `Order ${order?.orderId ?? ""} has been created.` })
      router.push("/orders")
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err && err.response && typeof (err.response as { data?: { message?: string } }).data?.message === "string"
        ? (err.response as { data: { message: string } }).data.message
        : "Failed to create order"
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6 p-5 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Create Order Manually</h1>
            <p className="text-muted-foreground mt-1">Place an order on behalf of a customer or as guest</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer */}
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
              <CardDescription>Choose existing customer or enter details for guest order</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={customerType === "guest"} onChange={() => setCustomerType("guest")} className="rounded" />
                  Guest
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={customerType === "user"} onChange={() => setCustomerType("user")} className="rounded" />
                  Existing customer
                </label>
              </div>
              {customerType === "user" && (
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="">Select customer</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                  {addresses.length > 1 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {addresses.map((a) => (
                        <Button key={a._id} type="button" variant="outline" size="sm" onClick={() => selectAddress(a)}>
                          {a.title}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping address */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping address</CardTitle>
              <CardDescription>Delivery details for this order</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
                <Label>Name *</Label>
                <Input value={address.name} onChange={(e) => setAddress({ ...address, name: e.target.value })} placeholder="Full name" required />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} placeholder="10-digit mobile" required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={address.email} onChange={(e) => setAddress({ ...address, email: e.target.value })} placeholder="Optional" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Address *</Label>
                <Input value={address.address} onChange={(e) => setAddress({ ...address, address: e.target.value })} placeholder="Street, area" required />
              </div>
              <div className="space-y-2">
                <Label>City *</Label>
                <Input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} placeholder="City" required />
              </div>
              <div className="space-y-2">
                <Label>State *</Label>
                <Input value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} placeholder="State" required />
              </div>
              <div className="space-y-2">
                <Label>Pincode *</Label>
                <Input value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} placeholder="Pincode" required />
              </div>
            </CardContent>
          </Card>

          {/* Order items */}
          <Card>
            <CardHeader>
              <CardTitle>Order items</CardTitle>
              <CardDescription>Add products and quantities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <select
                  value={addProductId}
                  onChange={(e) => setAddProductId(e.target.value)}
                  className="min-w-[200px] px-3 py-2 border border-border rounded-md bg-background"
                  disabled={loadingProducts}
                >
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} — ₹{p.sellingPrice ?? p.mrp ?? 0}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  min={1}
                  value={addQuantity}
                  onChange={(e) => setAddQuantity(Number(e.target.value) || 1)}
                  className="w-20"
                />
                <Button type="button" onClick={addItem} disabled={!addProductId}>
                  <PlusCircle className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No items yet. Add products above.</p>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="text-left p-3">Product</th>
                        <th className="text-left p-3 w-24">Price</th>
                        <th className="text-left p-3 w-24">Qty</th>
                        <th className="text-right p-3 w-24">Total</th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((i) => (
                        <tr key={i.productId} className="border-b last:border-0">
                          <td className="p-3">{i.name}</td>
                          <td className="p-3">
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              value={i.price}
                              onChange={(e) => updateItemPrice(i.productId, Number(e.target.value) || 0)}
                              className="h-8 w-20"
                            />
                          </td>
                          <td className="p-3">
                            <Input
                              type="number"
                              min={1}
                              value={i.quantity}
                              onChange={(e) => updateItemQty(i.productId, Number(e.target.value) || 1)}
                              className="h-8 w-16"
                            />
                          </td>
                          <td className="p-3 text-right font-medium">₹{(i.price * i.quantity).toLocaleString()}</td>
                          <td className="p-3">
                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(i.productId)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment & delivery */}
          <Card>
            <CardHeader>
              <CardTitle>Payment & delivery</CardTitle>
              <CardDescription>Method, delivery fee, and optional notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment method</Label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as "cod" | "online" | "partial")}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  >
                    <option value="cod">Cash on Delivery (COD)</option>
                    <option value="online">Online</option>
                    <option value="partial">Partial</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Delivery fee (₹)</Label>
                  <Input type="number" min={0} step={1} value={deliveryFee} onChange={(e) => setDeliveryFee(Number(e.target.value) || 0)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Promo code (optional)</Label>
                <Input value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="PROMO" />
              </div>
              <div className="space-y-2">
                <Label>Special requests (optional)</Label>
                <Input value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} placeholder="Delivery instructions" />
              </div>
              <div className="space-y-2">
                <Label>Delivery timing (optional)</Label>
                <Input value={timing} onChange={(e) => setTiming(e.target.value)} placeholder="e.g. 10 AM - 2 PM" />
              </div>
              <div className="pt-2 border-t">
                <p className="text-lg font-semibold">
                  Subtotal: ₹{subtotal.toLocaleString()} + Delivery: ₹{Number(deliveryFee).toLocaleString()} = Total: ₹{totalAmount.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={submitting || items.length === 0}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {submitting ? "Creating…" : "Create order"}
            </Button>
            <Link href="/orders">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
