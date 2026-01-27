"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { axiosInstance } from "@/lib/axios"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Copy, Check } from "lucide-react"

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

interface OrderDetailsDrawerProps {
  order: Order
  open: boolean
  onOpenChangeAction: (open: boolean) => void
  onStatusChangeAction: () => void
}

export function OrderDetailsDrawer({ order, open, onOpenChangeAction, onStatusChangeAction }: OrderDetailsDrawerProps) {
  const [selectedStatus, setSelectedStatus] = useState(order.orderStatus)
  const [adminRemarks, setAdminRemarks] = useState(order.adminRemarks || "")
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState(false)
  const { toast } = useToast()

  const handleUpdateStatus = async () => {
    setIsLoading(true)

    try {
      await axiosInstance.put(`/orders/${order._id}/status`, {
        status: selectedStatus,
        adminRemarks: adminRemarks,
      })

      toast({
        title: "Success",
        description: "Order status updated successfully",
      })

      onStatusChangeAction()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const remainingAmount = order.totalAmount - order.totalPaid
  const timing =
    (order as unknown as { timing?: unknown; deliveryTiming?: unknown; slot?: unknown }).timing ??
    (order as unknown as { timing?: unknown; deliveryTiming?: unknown; slot?: unknown }).deliveryTiming ??
    (order as unknown as { timing?: unknown; deliveryTiming?: unknown; slot?: unknown }).slot
  const timingLabel = typeof timing === "string" ? timing : ""

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Order #{(order.orderId || order._id || '').toString().slice(0, 8)}
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1"
              onClick={() => copyToClipboard(order.orderId || order._id || '')}
              title="Copy full order ID"
            >
              {copiedId ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </DialogTitle>
          <DialogDescription>Placed on {new Date(order.createdAt).toLocaleString()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Customer Information</h3>
            <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-medium">{order.address.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium">{order.address.phone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Shipping Address</p>
                <p className="font-medium text-sm">{order.address.address}</p>
                <p className="text-sm text-muted-foreground">
                  {[order.address.city, order.address.state, order.address.pincode].filter(Boolean).join(", ")}
                </p>
              </div>
              {timingLabel && (
                <div>
                  <p className="text-xs text-muted-foreground">Timing</p>
                  <p className="font-medium text-sm">{timingLabel}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Order Items */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Order Items</h3>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-start p-3 bg-secondary/30 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">₹{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Payment Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Payment Information</h3>
            <div className="space-y-2">
              <div className="flex justify-between p-3 bg-secondary/30 rounded-lg">
                <span className="text-sm">Payment Mode</span>
                <span className="font-medium text-sm">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between p-3 bg-secondary/30 rounded-lg">
                <span className="text-sm">Payment Status</span>
                <span className="font-medium text-sm">{order.paymentStatus}</span>
              </div>
              <div className="flex justify-between p-3 bg-secondary/30 rounded-lg">
                <span className="text-sm">Total Amount</span>
                <span className="font-semibold">₹{order.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-3 bg-green-100/30 rounded-lg border border-green-200/50">
                <span className="text-sm">Paid Amount</span>
                <span className="font-semibold text-green-700">₹{order.totalPaid.toLocaleString()}</span>
              </div>
              {remainingAmount > 0 && (
                <div className="flex justify-between p-3 bg-yellow-100/30 rounded-lg border border-yellow-200/50">
                  <span className="text-sm">Remaining Amount</span>
                  <span className="font-semibold text-yellow-700">₹{remainingAmount.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Status Update */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Order Status</h3>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <div>
              <label className="text-sm font-medium block mb-2">Admin Remarks</label>
              <textarea
                value={adminRemarks}
                onChange={(e) => setAdminRemarks(e.target.value)}
                placeholder="Add any notes about this order..."
                className="w-full px-3 py-2 border border-border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                rows={3}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChangeAction(false)}>
            Close
          </Button>
          <Button onClick={handleUpdateStatus} className="bg-primary hover:bg-primary/90" disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
