"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { axiosInstance } from "@/lib/axios"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Printer, Package, Truck, Search,
    Clock, Filter, ChevronRight, FileText, X, MonitorOff
} from "lucide-react"

interface Order {
    _id: string
    orderId: string
    userId: string
    customerName?: string
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
    }>
    totalAmount: number
    paymentMethod: "cod" | "online" | "partial"
    paymentStatus: string
    orderStatus: string
    processingStage?: "print" | "pack" | "handover" | "dispatched"
    createdAt: string
}

type TopTab = "non-dispatched" | "expired" | "pg-pending" | "cancelled"
type SubStage = "print" | "pack" | "handover"

export default function ProcessOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [activeTab, setActiveTab] = useState<TopTab>("non-dispatched")
    const [currentStage, setCurrentStage] = useState<SubStage>("print")
    const [selectedOrders, setSelectedOrders] = useState<string[]>([])
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [filters, setFilters] = useState({
        paymentMethod: "all",
        paymentStatus: "all",
        dateRange: "all"
    })
    const { toast } = useToast()

    const fetchOrders = async () => {
        try {
            const response = await axiosInstance.get("/admin/orders")
            const list = response.data.orders || response.data.data?.orders || []
            setOrders(list)
        } catch (error) {
            toast({ title: "Error", description: "Failed to load orders", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => { fetchOrders() }, [])

    // Filtering logic for summary cards
    const nonDispatched = orders.filter(o => !["delivered", "cancelled", "shipped"].includes(o.orderStatus))
    const inPrint = nonDispatched.filter(o => !o.processingStage || o.processingStage === "print")
    const inPack = nonDispatched.filter(o => o.processingStage === "pack")
    const inHandover = nonDispatched.filter(o => o.processingStage === "handover")

    // Filtered list for the current active sub-stage
    const stageFilteredOrders = currentStage === "print" ? inPrint :
        currentStage === "pack" ? inPack : inHandover

    // Apply search and additional filters
    let finalOrders = stageFilteredOrders.filter(o =>
        o.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.address.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (filters.paymentMethod !== "all") {
        finalOrders = finalOrders.filter(o => o.paymentMethod === filters.paymentMethod)
    }
    if (filters.paymentStatus !== "all") {
        finalOrders = finalOrders.filter(o => o.paymentStatus === filters.paymentStatus)
    }
    if (filters.dateRange !== "all") {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        finalOrders = finalOrders.filter(o => {
            const orderDate = new Date(o.createdAt)
            const orderDay = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate())
            switch (filters.dateRange) {
                case "today": return orderDay.getTime() === today.getTime()
                case "yesterday":
                    const yesterday = new Date(today)
                    yesterday.setDate(yesterday.getDate() - 1)
                    return orderDay.getTime() === yesterday.getTime()
                case "last7days":
                    const last7 = new Date(today)
                    last7.setDate(last7.getDate() - 7)
                    return orderDay >= last7
                case "last30days":
                    const last30 = new Date(today)
                    last30.setDate(last30.getDate() - 30)
                    return orderDay >= last30
                default: return true
            }
        })
    }

    // Selection handlers
    const handleSelectAll = (checked: boolean) => {
        setSelectedOrders(checked ? finalOrders.map(o => o._id) : [])
    }
    const handleSelectOrder = (orderId: string, checked: boolean) => {
        setSelectedOrders(prev => checked ? [...prev, orderId] : prev.filter(id => id !== orderId))
    }

    // Bulk print
    const handleBulkPrint = () => {
        if (selectedOrders.length === 0) {
            toast({ title: "No Orders Selected", description: "Please select at least one order to print labels.", variant: "destructive" })
            return
        }
        const ordersToPrint = orders.filter(o => selectedOrders.includes(o._id))
        const printWindow = window.open('', '_blank')
        if (!printWindow) {
            toast({ title: "Error", description: "Please allow popups to print labels.", variant: "destructive" })
            return
        }
        let printContent = `<!DOCTYPE html><html><head><title>Shipping Labels</title><style>
            @media print { @page { size: 4in 6in; margin: 0; } .label { page-break-after: always; } }
            .label { width:4in;height:6in;padding:.25in;border:2px solid #000;margin-bottom:.5in;box-sizing:border-box;font-family:Arial,sans-serif; }
            .header { text-align:center;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:10px; }
            .order-id { font-size:18px;font-weight:bold;margin:5px 0; }
            .section { margin:10px 0; } .section-title { font-weight:bold;font-size:12px;margin-bottom:5px;text-transform:uppercase; }
            .address { font-size:14px;line-height:1.4; }
            .items { font-size:11px;margin-top:10px;border-top:1px solid #ccc;padding-top:10px; }
            .footer { position:absolute;bottom:.25in;left:.25in;right:.25in;text-align:center;font-size:10px;border-top:1px solid #000;padding-top:5px; }
        </style></head><body>`
        ordersToPrint.forEach(order => {
            printContent += `<div class="label">
                <div class="header"><div style="font-size:20px;font-weight:bold;">SHIPPING LABEL</div>
                <div class="order-id">Order #${order.orderId}</div>
                <div style="font-size:10px;">${new Date(order.createdAt).toLocaleDateString()}</div></div>
                <div class="section"><div class="section-title">Ship To:</div>
                <div class="address"><div style="font-weight:bold;font-size:16px;">${order.address.name}</div>
                <div>${order.address.phone}</div><div>${order.address.address}</div>
                <div>${order.address.city}, ${order.address.state}</div>
                <div style="font-weight:bold;">PIN: ${order.address.pincode}</div></div></div>
                <div class="items"><div class="section-title">Items (${order.items.length}):</div>
                ${order.items.map(item => `<div>• ${item.name} (Qty: ${item.quantity})</div>`).join('')}</div>
                <div class="footer"><div style="font-weight:bold;">Payment: ${order.paymentMethod.toUpperCase()} - ${order.paymentStatus.toUpperCase()}</div>
                <div>Total Amount: ₹${order.totalAmount}</div></div></div>`
        })
        printContent += `</body></html>`
        printWindow.document.write(printContent)
        printWindow.document.close()
        printWindow.onload = () => { printWindow.focus(); printWindow.print() }
        toast({ title: "Print Ready", description: `Printing ${selectedOrders.length} shipping label(s)` })
    }

    const clearFilters = () => setFilters({ paymentMethod: "all", paymentStatus: "all", dateRange: "all" })
    const hasActiveFilters = filters.paymentMethod !== "all" || filters.paymentStatus !== "all" || filters.dateRange !== "all"

    const handleUpdateStage = async (orderId: string, nextStage: string) => {
        try {
            setOrders(prev => prev.map(o => o._id === orderId ? { ...o, processingStage: nextStage as any } : o))
            await axiosInstance.patch(`/admin/orders/${orderId}/stage`, { stage: nextStage })
            toast({ title: "Stage Updated", description: `Order moved to ${nextStage} stage.` })
        } catch (error) {
            toast({ title: "Error", description: "Failed to update order stage", variant: "destructive" })
            fetchOrders()
        }
    }

    const summaryCards = [
        {
            label: "TOTAL NON-DISPATCHED",
            count: nonDispatched.length,
            iconBg: "bg-blue-100",
            iconColor: "text-blue-600",
            icon: <Package className="w-5 h-5" />,
            stage: undefined as SubStage | undefined,
        },
        {
            label: "IN PRINT QUEUE",
            count: inPrint.length,
            iconBg: "bg-orange-100",
            iconColor: "text-orange-600",
            icon: <Printer className="w-5 h-5" />,
            stage: "print" as SubStage,
        },
        {
            label: "IN PACK",
            count: inPack.length,
            iconBg: "bg-purple-100",
            iconColor: "text-purple-600",
            icon: <Package className="w-5 h-5" />,
            stage: "pack" as SubStage,
        },
        {
            label: "IN HANDOVER",
            count: inHandover.length,
            iconBg: "bg-green-100",
            iconColor: "text-green-600",
            icon: <Truck className="w-5 h-5" />,
            stage: "handover" as SubStage,
        },
        {
            label: "DELAYED ORDERS",
            count: 0,
            iconBg: "bg-red-100",
            iconColor: "text-red-600",
            icon: <Clock className="w-5 h-5" />,
            stage: undefined as SubStage | undefined,
        },
    ]

    const topTabs: { value: TopTab; label: string; count?: number }[] = [
        { value: "non-dispatched", label: "NON-DISPATCHED", count: nonDispatched.length },
        { value: "expired", label: "EXPIRED AWB", count: 0 },
        { value: "pg-pending", label: "PG PENDING", count: 0 },
        { value: "cancelled", label: "CANCELLED" },
    ]

    return (
        <AdminLayout>
            <div className="p-5 max-w-7xl mx-auto min-h-screen" style={{ background: "#F5F6FA" }}>

                {/* ── Header ─────────────────────────────────────────────── */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Process Orders</h1>
                        <p className="text-sm text-slate-500 mt-0.5">End-to-end fulfillment workflow management</p>
                    </div>
                    <div className="flex gap-2">
                        {/* Filter Sheet */}
                        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                            <SheetTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={`bg-white border border-slate-200 rounded-lg font-bold text-xs uppercase tracking-widest gap-2 h-9 shadow-none ${hasActiveFilters ? "border-primary text-primary" : "text-slate-600"}`}
                                >
                                    <Filter className="w-3.5 h-3.5" />
                                    Filter
                                    {hasActiveFilters && (
                                        <span className="ml-1 bg-primary text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px]">
                                            {Object.values(filters).filter(v => v !== "all").length}
                                        </span>
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="w-[400px] sm:w-[480px]">
                                <SheetHeader>
                                    <SheetTitle className="text-lg font-black uppercase tracking-tight">Filter Orders</SheetTitle>
                                    <SheetDescription>Apply filters to narrow down your order list</SheetDescription>
                                </SheetHeader>
                                <div className="mt-8 space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="payment-method" className="text-xs font-black uppercase tracking-widest text-slate-500">Payment Method</Label>
                                        <Select value={filters.paymentMethod} onValueChange={v => setFilters(p => ({ ...p, paymentMethod: v }))}>
                                            <SelectTrigger id="payment-method" className="rounded-lg"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Methods</SelectItem>
                                                <SelectItem value="cod">Cash on Delivery</SelectItem>
                                                <SelectItem value="online">Online Payment</SelectItem>
                                                <SelectItem value="partial">Partial Payment</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="payment-status" className="text-xs font-black uppercase tracking-widest text-slate-500">Payment Status</Label>
                                        <Select value={filters.paymentStatus} onValueChange={v => setFilters(p => ({ ...p, paymentStatus: v }))}>
                                            <SelectTrigger id="payment-status" className="rounded-lg"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Statuses</SelectItem>
                                                <SelectItem value="paid">Paid</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="failed">Failed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="date-range" className="text-xs font-black uppercase tracking-widest text-slate-500">Date Range</Label>
                                        <Select value={filters.dateRange} onValueChange={v => setFilters(p => ({ ...p, dateRange: v }))}>
                                            <SelectTrigger id="date-range" className="rounded-lg"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Time</SelectItem>
                                                <SelectItem value="today">Today</SelectItem>
                                                <SelectItem value="yesterday">Yesterday</SelectItem>
                                                <SelectItem value="last7days">Last 7 Days</SelectItem>
                                                <SelectItem value="last30days">Last 30 Days</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <Button variant="outline" onClick={clearFilters} className="flex-1 rounded-lg font-bold uppercase text-xs tracking-widest">
                                            <X className="w-3.5 h-3.5 mr-2" />Clear All
                                        </Button>
                                        <Button onClick={() => setIsFilterOpen(false)} className="flex-1 rounded-lg font-bold uppercase text-xs tracking-widest bg-primary">
                                            Apply Filters
                                        </Button>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>

                        {/* Bulk Print */}
                        <Button
                            onClick={handleBulkPrint}
                            disabled={selectedOrders.length === 0}
                            className="h-9 rounded-lg font-black text-xs uppercase tracking-widest gap-2 disabled:opacity-50"
                            style={{ background: "#1a6b4a", color: "#fff" }}
                        >
                            <Printer className="w-3.5 h-3.5" />
                            Bulk Print {selectedOrders.length > 0 && `(${selectedOrders.length})`}
                        </Button>
                    </div>
                </div>

                {/* ── Summary Cards ───────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                    {summaryCards.map((card) => {
                        const isActive = card.stage !== undefined && currentStage === card.stage
                        return (
                            <div
                                key={card.label}
                                onClick={() => card.stage && setCurrentStage(card.stage)}
                                className={`bg-white rounded-xl p-5 flex items-center justify-between transition-all
                                    ${card.stage ? "cursor-pointer hover:shadow-md" : "cursor-default"}
                                    ${isActive ? "ring-2 ring-slate-800 shadow-md" : "shadow-sm"}`}
                            >
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 leading-tight">{card.label}</p>
                                    <p className="text-3xl font-black text-slate-800 leading-none">{card.count}</p>
                                </div>
                                <div className={`w-11 h-11 rounded-2xl flex-shrink-0 flex items-center justify-center ${card.iconBg} ${card.iconColor}`}>
                                    {card.icon}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* ── Top-Level Tabs ──────────────────────────────────────── */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {/* Tab Bar */}
                    <div className="flex border-b border-slate-100">
                        {topTabs.map(tab => (
                            <button
                                key={tab.value}
                                onClick={() => setActiveTab(tab.value)}
                                className={`px-5 py-3.5 text-[11px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap
                                    ${activeTab === tab.value
                                        ? "text-slate-800 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-slate-800"
                                        : "text-slate-400 hover:text-slate-600"
                                    }`}
                            >
                                {tab.label}{tab.count !== undefined ? ` (${tab.count})` : ""}
                            </button>
                        ))}
                    </div>

                    {/* ── Non-Dispatched Panel ─────────────────────────────── */}
                    {activeTab === "non-dispatched" && (
                        <>
                            {/* Sub-stage toggle + Search row */}
                            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                                {/* Sub-stage buttons */}
                                <div className="flex gap-1">
                                    {(["print", "pack", "handover"] as SubStage[]).map(stage => (
                                        <button
                                            key={stage}
                                            onClick={() => setCurrentStage(stage)}
                                            className={`px-5 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all
                                                ${currentStage === stage
                                                    ? "text-white shadow-sm"
                                                    : "text-slate-500 hover:text-slate-700 bg-white border border-slate-200"
                                                }`}
                                            style={currentStage === stage ? { background: "#1a6b4a" } : {}}
                                        >
                                            {stage}
                                        </button>
                                    ))}
                                </div>
                                {/* Search */}
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    <Input
                                        placeholder="Search Order ID or Name..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="pl-9 h-9 text-sm bg-white border-slate-200 rounded-lg focus-visible:ring-0 focus:border-slate-400"
                                    />
                                </div>
                            </div>

                            {/* ── Orders Table ─────────────────────────────── */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-100">
                                            <th className="w-10 py-3 px-5">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-300 cursor-pointer accent-slate-800"
                                                    checked={finalOrders.length > 0 && selectedOrders.length === finalOrders.length}
                                                    onChange={e => handleSelectAll(e.target.checked)}
                                                />
                                            </th>
                                            <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Order Details</th>
                                            <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Product</th>
                                            <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Payment</th>
                                            <th className="text-left py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Customer</th>
                                            <th className="text-center py-3 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Stage</th>
                                            <th className="text-right py-3 px-5 text-[10px] font-black uppercase text-slate-400 tracking-widest">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoading ? (
                                            [...Array(5)].map((_, i) => (
                                                <tr key={i} className="border-b border-slate-50">
                                                    <td colSpan={7} className="p-4"><Skeleton className="h-10 w-full rounded-lg" /></td>
                                                </tr>
                                            ))
                                        ) : finalOrders.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="py-24 text-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center">
                                                            <MonitorOff className="w-9 h-9 text-slate-300" />
                                                        </div>
                                                        <p className="text-sm font-black text-slate-400">No data available</p>
                                                        <p className="text-xs text-slate-300">There is currently no data available for the desired view</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            finalOrders.map(order => {
                                                const stage = order.processingStage
                                                const stageLabel = !stage || stage === "print" ? "PRINT READY"
                                                    : stage === "pack" ? "IN PACKING" : "HANDOVER READY"
                                                const stageBg = !stage || stage === "print" ? "bg-orange-100 text-orange-700"
                                                    : stage === "pack" ? "bg-purple-100 text-purple-700"
                                                        : "bg-green-100 text-green-700"
                                                const nextLabel = !stage || stage === "print" ? "MARK PACKED"
                                                    : stage === "pack" ? "READY HANDOVER" : "MARK DISPATCHED"
                                                const nextStage = !stage || stage === "print" ? "pack"
                                                    : stage === "pack" ? "handover" : "dispatched"

                                                return (
                                                    <tr key={order._id} className="border-b border-slate-50 hover:bg-slate-50/70 transition-colors">
                                                        <td className="py-4 px-5">
                                                            <input
                                                                type="checkbox"
                                                                className="rounded border-slate-300 cursor-pointer accent-slate-800"
                                                                checked={selectedOrders.includes(order._id)}
                                                                onChange={e => handleSelectOrder(order._id, e.target.checked)}
                                                            />
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <p className="text-sm font-black text-slate-800">#{order.orderId}</p>
                                                            <p className="text-[10px] text-slate-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</p>
                                                        </td>
                                                        <td className="py-4 px-4 max-w-[180px]">
                                                            {order.items.slice(0, 1).map((item, idx) => (
                                                                <p key={idx} className="text-xs font-semibold text-slate-700 line-clamp-2 leading-snug">{item.name}</p>
                                                            ))}
                                                            {order.items.length > 1 && (
                                                                <p className="text-[10px] font-black text-primary mt-0.5">+{order.items.length - 1} more</p>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <span className={`text-[10px] font-black uppercase tracking-widest ${order.paymentStatus === "paid" ? "text-green-600" : "text-orange-500"}`}>
                                                                {order.paymentStatus}
                                                            </span>
                                                            <p className="text-[10px] text-slate-400 uppercase mt-0.5">{order.paymentMethod}</p>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <p className="text-xs font-bold text-slate-800 uppercase">{order.address.name}</p>
                                                            <p className="text-[10px] text-slate-400 mt-0.5">{order.address.phone}</p>
                                                        </td>
                                                        <td className="py-4 px-4 text-center">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${stageBg}`}>
                                                                {stageLabel}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-5 text-right">
                                                            <button
                                                                onClick={() => handleUpdateStage(order._id, nextStage)}
                                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-800 hover:bg-slate-800 hover:text-white transition-all"
                                                            >
                                                                {nextLabel}
                                                                <ChevronRight className="w-3 h-3" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* ── Other Tabs (placeholder) ─────────────────────── */}
                    {activeTab !== "non-dispatched" && (
                        <div className="py-24 flex flex-col items-center gap-3 text-center">
                            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center">
                                <FileText className="w-9 h-9 text-slate-300" />
                            </div>
                            <p className="text-sm font-black text-slate-400">No data available</p>
                            <p className="text-xs text-slate-300">There is currently no data available for the desired view</p>
                        </div>
                    )}
                </div>

            </div>
        </AdminLayout>
    )
}
