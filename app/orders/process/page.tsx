"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { axiosInstance } from "@/lib/axios"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Printer, Package, Truck, Search, Download,
    Clock, AlertCircle, CheckCircle2, MoreVertical,
    Filter, ChevronRight, FileText
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

export default function ProcessOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [activeTab, setActiveTab] = useState("non-dispatched")
    const [currentStage, setCurrentStage] = useState<"print" | "pack" | "handover">("print")
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
        currentStage === "pack" ? inPack :
            inHandover;

    const finalOrders = stageFilteredOrders.filter(o =>
        o.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.address.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleUpdateStage = async (orderId: string, nextStage: string) => {
        try {
            // Optimitic update
            setOrders(prev => prev.map(o => o._id === orderId ? { ...o, processingStage: nextStage as any } : o))

            await axiosInstance.patch(`/admin/orders/${orderId}/stage`, { stage: nextStage })

            toast({
                title: "Stage Updated",
                description: `Order moved to ${nextStage} stage.`,
            })
        } catch (error) {
            toast({ title: "Error", description: "Failed to update order stage", variant: "destructive" })
            fetchOrders() // Rollback
        }
    }

    const renderSummaryCard = (title: string, count: number, icon: any, color: string, stage?: "print" | "pack" | "handover") => (
        <Card
            onClick={() => stage && setCurrentStage(stage)}
            className={`border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all cursor-pointer ${currentStage === stage ? 'ring-2 ring-primary ring-offset-2' : ''}`}
        >
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
                        <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{count}</h3>
                    </div>
                    <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    return (
        <AdminLayout>
            <div className="space-y-8 p-6 bg-[#F8F9FC] min-h-screen">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Process Orders</h1>
                        <p className="text-sm font-medium text-slate-500">End-to-end fulfillment workflow management</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="bg-white rounded-xl font-bold text-xs uppercase tracking-widest gap-2 shadow-sm border-none">
                            <Filter className="w-4 h-4 text-primary" /> Filter
                        </Button>
                        <Button className="rounded-xl font-black text-xs uppercase tracking-widest bg-primary shadow-lg shadow-primary/20 gap-2">
                            <Printer className="w-4 h-4" /> Bulk Print
                        </Button>
                    </div>
                </div>

                {/* Summary Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {renderSummaryCard("Total Non-Dispatched", nonDispatched.length, <Package className="w-5 h-5 text-blue-600" />, "bg-blue-600")}
                    {renderSummaryCard("In Print Queue", inPrint.length, <Printer className="w-5 h-5 text-orange-600" />, "bg-orange-600", "print")}
                    {renderSummaryCard("In Pack", inPack.length, <Package className="w-5 h-5 text-purple-600" />, "bg-purple-600", "pack")}
                    {renderSummaryCard("In Handover", inHandover.length, <Truck className="w-5 h-5 text-green-600" />, "bg-green-600", "handover")}
                    {renderSummaryCard("Delayed Orders", 0, <Clock className="w-5 h-5 text-red-600" />, "bg-red-600")}
                </div>

                {/* Workflow Tabs */}
                <Tabs defaultValue="non-dispatched" className="space-y-6">
                    <TabsList className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 h-12">
                        <TabsTrigger value="non-dispatched" className="rounded-lg font-black uppercase text-[10px] px-8 tracking-widest data-[state=active]:bg-slate-100">Non-Dispatched ({nonDispatched.length})</TabsTrigger>
                        <TabsTrigger value="expired" className="rounded-lg font-black uppercase text-[10px] px-8 tracking-widest data-[state=active]:bg-slate-100">Expired AWB (0)</TabsTrigger>
                        <TabsTrigger value="pg-pending" className="rounded-lg font-black uppercase text-[10px] px-8 tracking-widest data-[state=active]:bg-slate-100">PG Pending (0)</TabsTrigger>
                        <TabsTrigger value="cancelled" className="rounded-lg font-black uppercase text-[10px] px-8 tracking-widest data-[state=active]:bg-slate-100">Cancelled</TabsTrigger>
                    </TabsList>

                    <TabsContent value="non-dispatched">
                        <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                                <div className="flex flex-wrap items-center gap-4">
                                    <div className="flex bg-white rounded-xl p-1 shadow-sm border border-slate-200">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setCurrentStage("print")}
                                            className={`rounded-lg font-black uppercase text-[10px] px-6 h-9 transition-all ${currentStage === "print" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-slate-400 hover:text-slate-600"}`}
                                        >
                                            Print
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setCurrentStage("pack")}
                                            className={`rounded-lg font-black uppercase text-[10px] px-6 h-9 transition-all ${currentStage === "pack" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-slate-400 hover:text-slate-600"}`}
                                        >
                                            Pack
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setCurrentStage("handover")}
                                            className={`rounded-lg font-black uppercase text-[10px] px-6 h-9 transition-all ${currentStage === "handover" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-slate-400 hover:text-slate-600"}`}
                                        >
                                            Handover
                                        </Button>
                                    </div>
                                    <div className="relative flex-1 max-w-xs group ml-auto">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                        <Input
                                            placeholder="Search Order ID or Name..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="pl-12 bg-white rounded-xl border-slate-200 focus:ring-0 focus:border-primary font-medium text-sm h-11"
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-100">
                                                <th className="w-12 py-4 px-6"><input type="checkbox" className="rounded-md border-slate-300" /></th>
                                                <th className="text-left py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Order Details</th>
                                                <th className="text-left py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Product</th>
                                                <th className="text-left py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Payment</th>
                                                <th className="text-left py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Customer</th>
                                                <th className="text-center py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Stage</th>
                                                <th className="text-right py-4 px-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {isLoading ? (
                                                [...Array(5)].map((_, i) => (
                                                    <tr key={i} className="border-b border-slate-50">
                                                        <td colSpan={7} className="p-4"><Skeleton className="h-12 w-full rounded-xl" /></td>
                                                    </tr>
                                                ))
                                            ) : finalOrders.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="py-20 text-center">
                                                        <div className="flex flex-col items-center gap-4">
                                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                                                                <FileText className="w-8 h-8 text-slate-200" />
                                                            </div>
                                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No data available for the desired view</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                finalOrders.map(order => (
                                                    <tr key={order._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                                        <td className="py-5 px-6"><input type="checkbox" className="rounded-md border-slate-300" /></td>
                                                        <td className="py-5 px-4">
                                                            <p className="text-sm font-black text-slate-800 tracking-tight">#{order.orderId}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{new Date(order.createdAt).toLocaleDateString()}</p>
                                                        </td>
                                                        <td className="py-5 px-4">
                                                            <div className="space-y-1">
                                                                {order.items.slice(0, 1).map((item, idx) => (
                                                                    <p key={idx} className="text-xs font-bold text-slate-700 leading-tight line-clamp-1">{item.name}</p>
                                                                ))}
                                                                {order.items.length > 1 && (
                                                                    <p className="text-[10px] font-black text-primary uppercase">+{order.items.length - 1} more items</p>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-5 px-4">
                                                            <div className="flex flex-col">
                                                                <span className={`text-[10px] font-black uppercase tracking-widest ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>
                                                                    {order.paymentStatus}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-slate-400 uppercase">{order.paymentMethod}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-5 px-4">
                                                            <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{order.address.name}</p>
                                                            <p className="text-[10px] font-bold text-slate-400">{order.address.phone}</p>
                                                        </td>
                                                        <td className="py-5 px-4 text-center">
                                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${!order.processingStage || order.processingStage === 'print' ? 'bg-orange-100 text-orange-700' :
                                                                order.processingStage === 'pack' ? 'bg-purple-100 text-purple-700' :
                                                                    'bg-green-100 text-green-700'
                                                                }`}>
                                                                {!order.processingStage || order.processingStage === 'print' ? 'Print Ready' :
                                                                    order.processingStage === 'pack' ? 'In Packing' : 'Handover Ready'}
                                                            </div>
                                                        </td>
                                                        <td className="py-5 px-6 text-right">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    const next = !order.processingStage || order.processingStage === 'print' ? 'pack' :
                                                                        order.processingStage === 'pack' ? 'handover' : 'dispatched';
                                                                    handleUpdateStage(order._id, next);
                                                                }}
                                                                className="h-9 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest border-slate-200 hover:bg-primary hover:text-white hover:border-primary transition-all group-hover:shadow-md"
                                                            >
                                                                {!order.processingStage || order.processingStage === 'print' ? 'Mark Packed' :
                                                                    order.processingStage === 'pack' ? 'Ready Handover' : 'Mark Dispatched'}
                                                                <ChevronRight className="w-3 h-3 ml-2" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AdminLayout>
    )
}
