"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { axiosInstance } from "@/lib/axios"
import { Download, ChevronLeft, ChevronRight } from "lucide-react"
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
  awbNumber?: string
  shippingProvider?: string
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

const PAGE_SIZES = [10, 20, 50, 100]

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [canceledPage, setCanceledPage] = useState(1)
  const [canceledPageSize, setCanceledPageSize] = useState(10)
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
    const isCancelled = order.orderStatus === "cancelled"
    // Main list excludes cancelled (they appear in separate section)
    if (isCancelled) return false
    return matchesSearch && matchesStatus
  })

  const canceledOrders = orders.filter((order) => order.orderStatus === "cancelled")

  // Pagination for main orders (non-canceled)
  const totalActive = filteredOrders.length
  const totalPages = Math.max(1, Math.ceil(totalActive / pageSize))
  const startIndex = (page - 1) * pageSize
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + pageSize)

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [searchQuery, statusFilter, pageSize])

  // Pagination for canceled orders
  const canceledTotalPages = Math.max(1, Math.ceil(canceledOrders.length / canceledPageSize))
  const canceledStartIndex = (canceledPage - 1) * canceledPageSize
  const paginatedCanceled = canceledOrders.slice(canceledStartIndex, canceledStartIndex + canceledPageSize)

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
      <div className="space-y-6 p-5 max-w-7xl mx-auto">
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
          </select>
        </div>

        {/* Orders Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{orders.filter((o) => o.orderStatus !== "cancelled").length}</p>
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Canceled Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                {canceledOrders.length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Orders</CardTitle>
                <CardDescription>
                  Showing {totalActive === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + pageSize, totalActive)} of {totalActive} orders (excluding canceled)
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Rows per page</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                  className="h-9 w-16 px-2 border border-border rounded-md bg-background text-sm"
                >
                  {PAGE_SIZES.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>
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
                    {paginatedOrders.map((order) => (
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

            {/* Pagination */}
            {!isLoading && totalActive > 0 && (
              <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="h-9"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="h-9"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Canceled Orders - Separate Section */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-red-700">Canceled Orders</CardTitle>
                <CardDescription>
                  {canceledOrders.length === 0
                    ? "0 canceled order(s)"
                    : `Showing ${canceledStartIndex + 1}–${Math.min(canceledStartIndex + canceledPageSize, canceledOrders.length)} of ${canceledOrders.length} canceled order(s)`}
                </CardDescription>
              </div>
              {canceledOrders.length > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">Rows per page</span>
                  <select
                    value={canceledPageSize}
                    onChange={(e) => { setCanceledPageSize(Number(e.target.value)); setCanceledPage(1) }}
                    className="h-9 w-16 px-2 border border-border rounded-md bg-background text-sm"
                  >
                    {PAGE_SIZES.filter((n) => n <= 50).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {canceledOrders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No canceled orders</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-sm">Order ID</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Customer</th>
                      <th className="hidden md:table-cell text-left py-3 px-4 font-medium text-sm">Date</th>
                      <th className="text-right py-3 px-4 font-medium text-sm">Amount</th>
                      <th className="text-right py-3 px-4 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCanceled.map((order) => (
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
                            <p className="font-medium">{order.address?.name || "N/A"}</p>
                            <p className="text-xs text-muted-foreground">{order.address?.phone || "N/A"}</p>
                          </div>
                        </td>
                        <td className="hidden md:table-cell py-4 px-4 text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-right font-semibold">₹{order.totalAmount.toLocaleString()}</td>
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
            {canceledOrders.length > 0 && (
              <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Page {canceledPage} of {canceledTotalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCanceledPage((p) => Math.max(1, p - 1))}
                    disabled={canceledPage <= 1}
                    className="h-9"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCanceledPage((p) => Math.min(canceledTotalPages, p + 1))}
                    disabled={canceledPage >= canceledTotalPages}
                    className="h-9"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
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