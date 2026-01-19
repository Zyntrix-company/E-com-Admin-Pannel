"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { axiosInstance } from "@/lib/axios"
import { AlertCircle, MoreVertical, CheckCircle, XCircle, Download, ChevronDown, ChevronUp, User as UserIcon, Mail, Phone, Calendar, Shield, MapPin, Package, ShoppingBag, CreditCard, Truck } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface User {
  id: string
  _id?: string
  firstName: string
  lastName: string
  name: string
  email: string
  phone: string
  alternatePhone?: string
  userType: "buyer" | "admin"
  profileImage?: string
  isVerified: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Address {
  _id: string
  userId: string
  title: string
  name: string
  phone: string
  address: string
  city: string
  state: string
  pincode: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

interface Order {
  _id: string
  userId: string
  orderId: string
  items: Array<{
    productId: string
    name: string
    price: number
    mrp?: number
    quantity: number
    variantLabel?: string
  }>
  address: {
    name: string
    phone: string
    address: string
    city: string
    state: string
    pincode: string
  }
  subtotal: number
  deliveryFee: number
  taxAmount: number
  discountAmount: number
  convenienceFee: number
  totalAmount: number
  promoCode?: string
  promoCodeDiscount: number
  paymentMethod: "cod" | "online" | "partial"
  paymentStatus: "pending" | "paid" | "partially_paid" | "failed" | "refunded"
  paymentId?: string
  razorpayOrderId?: string
  totalPaid: number
  remainingAmount: number
  orderStatus: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "cancellation-pending"
  awbNumber?: string
  shipmentStatus: string
  estimatedDelivery?: string
  deliveredAt?: string
  cancelledAt?: string
  cancellationReason?: string
  cancellationInitiatedBy?: "user" | "admin"
  adminRemarks: string
  invoiceUrl?: string
  invoiceGeneratedAt?: string
  specialRequests?: string
  remarks: string
  paidAt?: string
  refundedAt?: string
  timing?: string
  createdAt: string
  updatedAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false)
  const [userToToggle, setUserToToggle] = useState<User | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [userAddresses, setUserAddresses] = useState<Map<string, Address[]>>(new Map())
  const [userOrders, setUserOrders] = useState<Map<string, Order[]>>(new Map())
  const [loadingAddresses, setLoadingAddresses] = useState<Set<string>>(new Set())
  const [loadingOrders, setLoadingOrders] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get("/admin/users")
      const payload = response.data as unknown
      const list =
        Array.isArray(payload)
          ? payload
          : Array.isArray((payload as { users?: unknown })?.users)
            ? (payload as { users: unknown[] }).users
            : Array.isArray((payload as { data?: unknown })?.data)
              ? ((payload as { data: unknown[] }).data as unknown[])
              : Array.isArray((payload as { data?: { users?: unknown } })?.data?.users)
                ? ((payload as { data: { users: unknown[] } }).data.users as unknown[])
                : []

      const normalized = (list as unknown[]).map((raw) => {
        if (!raw || typeof raw !== "object") return raw
        const obj = raw as Record<string, unknown>
        const normalizedId =
          (typeof obj.id === "string" && obj.id) ||
          (typeof obj._id === "string" && obj._id) ||
          (typeof obj.userId === "string" && obj.userId) ||
          ""

        return {
          ...obj,
          id: normalizedId,
        }
      })

      setUsers(normalized as User[])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleToggleStatus = async () => {
    if (!userToToggle) return
    if (!userToToggle.id) {
      toast({
        title: "Error",
        description: "Cannot update this user because their id is missing in the API response",
        variant: "destructive",
      })
      return
    }

    try {
      await axiosInstance.patch(`/admin/users/${userToToggle.id}/toggle-status`)

      setUsers(users.map((u) => (u.id === userToToggle.id ? { ...u, isActive: !u.isActive } : u)))

      toast({
        title: "Success",
        description: `User ${userToToggle.isActive ? "disabled" : "enabled"} successfully. ${!userToToggle.isActive ? "They can now log in again." : "They will not be able to log in."
          }`,
      })

      setToggleDialogOpen(false)
      setUserToToggle(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle user status",
        variant: "destructive",
      })
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery),
  )

  const toggleRowExpansion = async (userId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
        // Fetch addresses and orders when expanding
        fetchUserAddresses(userId)
        fetchUserOrders(userId)
      }
      return newSet
    })
  }

  const fetchUserAddresses = async (userId: string) => {
    // Don't fetch if already loaded
    if (userAddresses.has(userId)) return

    setLoadingAddresses((prev) => new Set(prev).add(userId))
    try {
      const response = await axiosInstance.get(`/admin/users/${userId}/addresses`)
      const addresses = response.data.addresses || []
      setUserAddresses((prev) => new Map(prev).set(userId, addresses))
    } catch (error) {
      console.error("Failed to fetch addresses:", error)
      setUserAddresses((prev) => new Map(prev).set(userId, []))
    } finally {
      setLoadingAddresses((prev) => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const fetchUserOrders = async (userId: string) => {
    // Don't fetch if already loaded
    if (userOrders.has(userId)) return

    setLoadingOrders((prev) => new Set(prev).add(userId))
    try {
      const response = await axiosInstance.get(`/admin/users/${userId}/orders`)
      const orders = response.data.orders || []
      setUserOrders((prev) => new Map(prev).set(userId, orders))
    } catch (error) {
      console.error("Failed to fetch orders:", error)
      setUserOrders((prev) => new Map(prev).set(userId, []))
    } finally {
      setLoadingOrders((prev) => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const escapeCsvValue = (value: unknown) => {
    if (value === null || value === undefined) return ""
    const str = typeof value === "string" ? value : typeof value === "number" || typeof value === "boolean" ? String(value) : JSON.stringify(value)
    const escaped = str.replace(/\r\n|\r|\n/g, " ").replace(/"/g, '""')
    return `"${escaped}"`
  }

  const downloadCsv = async () => {
    if (users.length === 0) return

    setIsDownloading(true)
    try {
      // Fetch all addresses and orders in parallel for efficiency
      const [addressesRes, ordersRes] = await Promise.all([
        axiosInstance.get("/admin/addresses"),
        axiosInstance.get("/admin/orders"),
      ])

      const allAddresses = (addressesRes.data.addresses || []) as Address[]
      const allOrders = (ordersRes.data.orders || []) as Order[]

      // Create maps for quick lookup
      const addressMap = new Map<string, Address[]>()
      allAddresses.forEach((addr) => {
        const list = addressMap.get(addr.userId) || []
        list.push(addr)
        addressMap.set(addr.userId, list)
      })

      const orderMap = new Map<string, Order[]>()
      allOrders.forEach((order) => {
        const list = orderMap.get(order.userId) || []
        list.push(order)
        orderMap.set(order.userId, list)
      })

      const rows = users.map((user) => {
        const userId = user.id || user._id || ""
        const userAddresses = addressMap.get(userId) || []
        const userOrders = orderMap.get(userId) || []

        // Format addresses for CSV
        const formattedAddresses = userAddresses
          .map((a) => `${a.title}: ${a.address}, ${a.city}, ${a.state} - ${a.pincode} (${a.phone})`)
          .join(" | ")

        // Format orders for CSV
        const orderSummary = userOrders
          .map((o) => `Order #${o.orderId}: ₹${o.totalAmount} (${o.orderStatus}, ${o.paymentStatus})`)
          .join(" | ")

        const totalSpent = userOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)

        return {
          id: userId,
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          alternatePhone: user.alternatePhone || "",
          userType: user.userType || "",
          isVerified: user.isVerified ? "Yes" : "No",
          isActive: user.isActive ? "Yes" : "No",
          createdAt: new Date(user.createdAt).toLocaleString(),
          updatedAt: new Date(user.updatedAt).toLocaleString(),
          totalOrders: userOrders.length,
          totalSpent: `₹${totalSpent}`,
          addresses: formattedAddresses,
          recentOrdersSummary: orderSummary,
        }
      })

      if (rows.length === 0) return

      const headers = Object.keys(rows[0])
      const csv = [
        headers.map(escapeCsvValue).join(","),
        ...rows.map((r) => headers.map((h) => escapeCsvValue(r[h as keyof typeof r])).join(",")),
      ].join("\n")

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `users-full-report-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: "Full user report downloaded successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download CSV",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground mt-2">Manage user accounts and access</p>
          </div>
          <Button
            variant="outline"
            className="gap-2 w-full sm:w-auto"
            onClick={downloadCsv}
            disabled={isLoading || isDownloading || users.length === 0}
          >
            <Download className="w-4 h-4" />
            {isDownloading ? "Preparing..." : "Download CSV"}
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </CardContent>
        </Card>

        {/* Users Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{users.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{users.filter((u) => u.isActive).length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Disabled Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{users.filter((u) => !u.isActive).length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users List</CardTitle>
            <CardDescription>
              Showing {filteredUsers.length} of {users.length} users
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4 py-4 border-b last:border-b-0">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-60" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-sm w-12"></th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-sm">Phone</th>
                      <th className="text-center py-3 px-4 font-medium text-sm">Type</th>
                      <th className="text-center py-3 px-4 font-medium text-sm">Verified</th>
                      <th className="text-center py-3 px-4 font-medium text-sm">Status</th>
                      <th className="text-right py-3 px-4 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const isExpanded = expandedRows.has(user.id)
                      return (
                        <>
                          <tr
                            key={user.id}
                            className="border-b border-border hover:bg-secondary/30 transition-colors cursor-pointer"
                            onClick={() => toggleRowExpansion(user.id)}
                          >
                            <td className="py-4 px-4">
                              <div className="h-8 w-8 flex items-center justify-center">
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                {user.profileImage ? (
                                  <img
                                    src={user.profileImage}
                                    alt={user.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                                    {user.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium">{user.name}</p>
                                  {user.firstName && user.lastName && (
                                    <p className="text-xs text-muted-foreground">
                                      {user.firstName} {user.lastName}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-sm text-muted-foreground">{user.email}</td>
                            <td className="py-4 px-4 text-sm text-muted-foreground">{user.phone}</td>
                            <td className="py-4 px-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${user.userType === "admin"
                                  ? "bg-purple-100/80 text-purple-700"
                                  : "bg-blue-100/80 text-blue-700"
                                  }`}
                              >
                                <Shield className="w-3 h-3" />
                                {user.userType}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              {user.isVerified ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100/80 text-green-700">
                                  <CheckCircle className="w-3 h-3" />
                                  Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100/80 text-yellow-700">
                                  <AlertCircle className="w-3 h-3" />
                                  Unverified
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <div
                                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${user.isActive ? "bg-green-100/80 text-green-700" : "bg-red-100/80 text-red-700"
                                  }`}
                              >
                                {user.isActive ? (
                                  <>
                                    <CheckCircle className="w-3 h-3" />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3 h-3" />
                                    Disabled
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setUserToToggle(user)
                                      setToggleDialogOpen(true)
                                    }}
                                    className="cursor-pointer"
                                  >
                                    {user.isActive ? "Disable User" : "Enable User"}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${user.id}-details`} className="border-b border-border bg-secondary/20">
                              <td colSpan={8} className="py-4 px-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                                      <UserIcon className="w-3 h-3" />
                                      User ID
                                    </p>
                                    <p className="text-sm font-mono">{user._id || user.id}</p>
                                  </div>

                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                                      <UserIcon className="w-3 h-3" />
                                      First Name
                                    </p>
                                    <p className="text-sm">{user.firstName || "N/A"}</p>
                                  </div>

                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                                      <UserIcon className="w-3 h-3" />
                                      Last Name
                                    </p>
                                    <p className="text-sm">{user.lastName || "N/A"}</p>
                                  </div>

                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                                      <Mail className="w-3 h-3" />
                                      Email Address
                                    </p>
                                    <p className="text-sm">{user.email}</p>
                                  </div>

                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                                      <Phone className="w-3 h-3" />
                                      Primary Phone
                                    </p>
                                    <p className="text-sm">{user.phone}</p>
                                  </div>

                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                                      <Phone className="w-3 h-3" />
                                      Alternate Phone
                                    </p>
                                    <p className="text-sm">{user.alternatePhone || "N/A"}</p>
                                  </div>

                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                                      <Shield className="w-3 h-3" />
                                      User Type
                                    </p>
                                    <p className="text-sm capitalize">{user.userType}</p>
                                  </div>

                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                                      <CheckCircle className="w-3 h-3" />
                                      Email Verified
                                    </p>
                                    <p className="text-sm">{user.isVerified ? "Yes" : "No"}</p>
                                  </div>

                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                                      <CheckCircle className="w-3 h-3" />
                                      Account Status
                                    </p>
                                    <p className="text-sm">{user.isActive ? "Active" : "Disabled"}</p>
                                  </div>

                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                                      <Calendar className="w-3 h-3" />
                                      Created At
                                    </p>
                                    <p className="text-sm">{new Date(user.createdAt).toLocaleString()}</p>
                                  </div>

                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                                      <Calendar className="w-3 h-3" />
                                      Updated At
                                    </p>
                                    <p className="text-sm">{new Date(user.updatedAt).toLocaleString()}</p>
                                  </div>

                                  {user.profileImage && (
                                    <div className="space-y-1">
                                      <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                                        <UserIcon className="w-3 h-3" />
                                        Profile Image
                                      </p>
                                      <a
                                        href={user.profileImage}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-primary hover:underline"
                                      >
                                        View Image
                                      </a>
                                    </div>
                                  )}
                                </div>

                                {/* Addresses Section */}
                                <div className="mt-6 border-t pt-4">
                                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <MapPin className="w-5 h-5" />
                                    Saved Addresses ({userAddresses.get(user.id)?.length || 0})
                                  </h3>
                                  {loadingAddresses.has(user.id) ? (
                                    <div className="space-y-3">
                                      <Skeleton className="h-24 w-full" />
                                      <Skeleton className="h-24 w-full" />
                                    </div>
                                  ) : userAddresses.get(user.id)?.length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic">No addresses saved</p>
                                  ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {userAddresses.get(user.id)?.map((address) => (
                                        <Card key={address._id} className="p-4">
                                          <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                              <h4 className="font-semibold text-sm flex items-center gap-2">
                                                <MapPin className="w-4 h-4" />
                                                {address.title}
                                              </h4>
                                              {address.isDefault && (
                                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                                  Default
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-sm space-y-1">
                                              <p className="font-medium">{address.name}</p>
                                              <p className="text-muted-foreground">{address.phone}</p>
                                              <p className="text-muted-foreground">{address.address}</p>
                                              <p className="text-muted-foreground">
                                                {address.city}, {address.state} - {address.pincode}
                                              </p>
                                            </div>
                                          </div>
                                        </Card>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Orders Section */}
                                <div className="mt-6 border-t pt-4">
                                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <ShoppingBag className="w-5 h-5" />
                                    Order History ({userOrders.get(user.id)?.length || 0})
                                  </h3>
                                  {loadingOrders.has(user.id) ? (
                                    <div className="space-y-3">
                                      <Skeleton className="h-32 w-full" />
                                      <Skeleton className="h-32 w-full" />
                                    </div>
                                  ) : userOrders.get(user.id)?.length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic">No orders placed yet</p>
                                  ) : (
                                    <div className="space-y-4">
                                      {userOrders.get(user.id)?.map((order) => (
                                        <Card key={order._id} className="p-4">
                                          <div className="space-y-3">
                                            {/* Order Header */}
                                            <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b">
                                              <div>
                                                <p className="font-semibold text-sm flex items-center gap-2">
                                                  <Package className="w-4 h-4" />
                                                  Order #{order.orderId}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                  {new Date(order.createdAt).toLocaleDateString()} at{" "}
                                                  {new Date(order.createdAt).toLocaleTimeString()}
                                                </p>
                                              </div>
                                              <div className="flex flex-wrap gap-2">
                                                <span
                                                  className={`text-xs px-2 py-1 rounded-full font-medium ${order.orderStatus === "delivered"
                                                    ? "bg-green-100 text-green-700"
                                                    : order.orderStatus === "cancelled"
                                                      ? "bg-red-100 text-red-700"
                                                      : order.orderStatus === "shipped"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-yellow-100 text-yellow-700"
                                                    }`}
                                                >
                                                  {order.orderStatus.toUpperCase()}
                                                </span>
                                                <span
                                                  className={`text-xs px-2 py-1 rounded-full font-medium ${order.paymentStatus === "paid"
                                                    ? "bg-green-100 text-green-700"
                                                    : order.paymentStatus === "failed"
                                                      ? "bg-red-100 text-red-700"
                                                      : "bg-yellow-100 text-yellow-700"
                                                    }`}
                                                >
                                                  {order.paymentStatus.toUpperCase()}
                                                </span>
                                              </div>
                                            </div>

                                            {/* Order Items */}
                                            <div className="space-y-2">
                                              <p className="text-xs font-medium text-muted-foreground">Items:</p>
                                              {order.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between text-sm">
                                                  <span>
                                                    {item.name} {item.variantLabel && `(${item.variantLabel})`} x{" "}
                                                    {item.quantity}
                                                  </span>
                                                  <span className="font-medium">₹{item.price * item.quantity}</span>
                                                </div>
                                              ))}
                                            </div>

                                            {/* Order Details Grid */}
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs pt-3 border-t">
                                              <div>
                                                <p className="text-muted-foreground flex items-center gap-1">
                                                  <CreditCard className="w-3 h-3" />
                                                  Payment
                                                </p>
                                                <p className="font-medium capitalize">{order.paymentMethod}</p>
                                              </div>
                                              <div>
                                                <p className="text-muted-foreground">Total Amount</p>
                                                <p className="font-medium">₹{order.totalAmount}</p>
                                              </div>
                                              {order.paymentMethod === "partial" && (
                                                <>
                                                  <div>
                                                    <p className="text-muted-foreground">Paid</p>
                                                    <p className="font-medium text-green-600">₹{order.totalPaid}</p>
                                                  </div>
                                                  <div>
                                                    <p className="text-muted-foreground">Remaining</p>
                                                    <p className="font-medium text-orange-600">
                                                      ₹{order.remainingAmount}
                                                    </p>
                                                  </div>
                                                </>
                                              )}
                                              {order.awbNumber && (
                                                <div>
                                                  <p className="text-muted-foreground flex items-center gap-1">
                                                    <Truck className="w-3 h-3" />
                                                    AWB Number
                                                  </p>
                                                  <p className="font-medium font-mono">{order.awbNumber}</p>
                                                </div>
                                              )}
                                            </div>

                                            {/* Delivery Address */}
                                            <div className="pt-3 border-t">
                                              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                Delivery Address:
                                              </p>
                                              <div className="text-xs text-muted-foreground space-y-1">
                                                <p className="font-medium text-foreground">{order.address.name}</p>
                                                <p>{order.address.phone}</p>
                                                <p>
                                                  {order.address.address}, {order.address.city}, {order.address.state} -{" "}
                                                  {order.address.pincode}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        </Card>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Toggle Status Confirmation Dialog */}
      <Dialog open={toggleDialogOpen} onOpenChange={setToggleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              {userToToggle?.isActive ? "Disable User" : "Enable User"}
            </DialogTitle>
            <DialogDescription>
              {userToToggle?.isActive ? (
                <div className="space-y-2 mt-2">
                  <p>Are you sure you want to disable "{userToToggle?.name}"?</p>
                  <p className="text-sm">
                    Once disabled, they will not be able to log in to their account. Their data will remain intact.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 mt-2">
                  <p>Are you sure you want to enable "{userToToggle?.name}"?</p>
                  <p className="text-sm">They will be able to log in to their account again.</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToggleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleToggleStatus}
              className={userToToggle?.isActive ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary/90"}
            >
              {userToToggle?.isActive ? "Disable User" : "Enable User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  )
}
