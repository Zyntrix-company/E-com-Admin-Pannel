"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { axiosInstance } from "@/lib/axios"
import { Eye, Download } from "lucide-react"
import { OrderDetailsDrawer } from "@/components/order-details-drawer"

interface Order {
  _id: string
  orderId: string
  userId: string
  timing?: string
  address: {
    name: string
    phone: string
    address: string
    city: string
    state: string
    pincode: string
  }
  items: Array<{
    productId: string
    name: string
    quantity: number
    price: number
    variantLabel?: string
  }>
  subtotal: number
  deliveryFee: number
  taxAmount: number
  discountAmount: number
  convenienceFee: number
  totalAmount: number
  promoCode?: string
  promoCodeDiscount: number
  totalPaid: number
  remainingAmount: number
  paymentMethod: string
  paymentStatus: string
  orderStatus: string
  shipmentStatus: string
  adminRemarks?: string
  specialRequests?: string
  remarks?: string
  createdAt: string
  updatedAt: string
}

const statusColors = {
  pending: "bg-yellow-100/80 text-yellow-700",
  confirmed: "bg-blue-100/80 text-blue-700",
  shipped: "bg-purple-100/80 text-purple-700",
  delivered: "bg-green-100/80 text-green-700",
  cancelled: "bg-red-100/80 text-red-700",
}

const paymentStatusColors = {
  paid: "bg-green-100/80 text-green-700",
  partial: "bg-yellow-100/80 text-yellow-700",
  pending: "bg-red-100/80 text-red-700",
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { toast } = useToast()

  const fetchOrders = async () => {
    try {
      const response = await axiosInstance.get("/admin/orders")
      const payload = response.data

      // Extract orders array from response
      const ordersList = payload?.orders || payload?.data?.orders || []

      setOrders(ordersList)
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      const response = await axiosInstance.get(`/admin/orders/${orderId}/invoice`, {
        responseType: "blob",
      })

      const blob = response.data as Blob
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Invoice-${orderId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: "Invoice downloaded successfully",
      })
    } catch (error) {
      console.error("Error downloading invoice:", error)
      toast({
        title: "Error",
        description: "Failed to download invoice",
        variant: "destructive",
      })
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.address?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.address?.phone?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || order.orderStatus === statusFilter

    return matchesSearch && matchesStatus
  })

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  const getTiming = (order: Order) => {
    const raw = (order as unknown as { timing?: unknown; deliveryTiming?: unknown; slot?: unknown }).timing ??
      (order as unknown as { timing?: unknown; deliveryTiming?: unknown; slot?: unknown }).deliveryTiming ??
      (order as unknown as { timing?: unknown; deliveryTiming?: unknown; slot?: unknown }).slot
    return typeof raw === "string" ? raw : ""
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Order Management</h1>
          <p className="text-muted-foreground mt-2">View and manage customer orders</p>
        </div>

        {/* Search and Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Search by order ID, customer name, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Orders Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{orders.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-600">
                {orders.filter((o) => o.orderStatus === "pending").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Delivered Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {orders.filter((o) => o.orderStatus === "delivered").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">
                ₹{orders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Orders List</CardTitle>
            <CardDescription>
              Showing {filteredOrders.length} of {orders.length} orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4 py-4 border-b last:border-b-0">
                    <Skeleton className="h-4 w-20" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-60" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No orders found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-sm">Order ID</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Customer</th>
                      <th className="hidden lg:table-cell text-left py-3 px-4 font-medium text-sm">Address</th>
                      <th className="hidden md:table-cell text-left py-3 px-4 font-medium text-sm">City</th>
                      <th className="hidden xl:table-cell text-left py-3 px-4 font-medium text-sm">Timing</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Date</th>
                      <th className="text-right py-3 px-4 font-medium text-sm">Amount</th>
                      <th className="hidden md:table-cell text-right py-3 px-4 font-medium text-sm">Paid</th>
                      <th className="hidden md:table-cell text-center py-3 px-4 font-medium text-sm">Payment Mode</th>
                      <th className="text-center py-3 px-4 font-medium text-sm">Payment Status</th>
                      <th className="text-center py-3 px-4 font-medium text-sm">Status</th>
                      <th className="text-right py-3 px-4 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr
                        key={order._id}
                        className="border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedOrder(order)
                          setDrawerOpen(true)
                        }}
                      >
                        <td className="py-4 px-4">
                          <p className="font-mono font-semibold text-sm">{order.orderId}</p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm">
                            <p className="font-medium">{order.address?.name || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">{order.address?.phone || 'N/A'}</p>
                          </div>
                        </td>
                        <td className="hidden lg:table-cell py-4 px-4 text-sm text-muted-foreground">
                          {order.address?.address || "-"}
                        </td>
                        <td className="hidden md:table-cell py-4 px-4 text-sm text-muted-foreground">
                          {order.address?.city || "-"}
                        </td>
                        <td className="hidden xl:table-cell py-4 px-4 text-sm text-muted-foreground">
                          {getTiming(order) || "-"}
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-right font-semibold">₹{order.totalAmount.toLocaleString()}</td>
                        <td className="hidden md:table-cell py-4 px-4 text-right font-semibold">
                          ₹{(typeof order.totalPaid === "number" ? order.totalPaid : 0).toLocaleString()}
                        </td>
                        <td className="hidden md:table-cell py-4 px-4 text-center text-sm text-muted-foreground">
                          {order.paymentMethod || "-"}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded inline-block ${paymentStatusColors[order.paymentStatus as keyof typeof paymentStatusColors] || 'bg-gray-100/80 text-gray-700'
                              }`}
                          >
                            {capitalizeFirstLetter(order.paymentStatus)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded inline-block ${statusColors[order.orderStatus as keyof typeof statusColors] || 'bg-gray-100/80 text-gray-700'
                              }`}
                          >
                            {capitalizeFirstLetter(order.orderStatus)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownloadInvoice(order._id)
                            }}
                            className="gap-1"
                          >
                            <Download className="w-4 h-4" />
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
      </div>

      {/* Order Details Drawer */}
      {selectedOrder && (
        <OrderDetailsDrawer
          order={selectedOrder}
          open={drawerOpen}
          onOpenChangeAction={setDrawerOpen}
          onStatusChangeAction={() => {
            fetchOrders()
            setDrawerOpen(false)
          }}
        />
      )}
    </AdminLayout>
  )
}