"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { axiosInstance } from "@/lib/axios"
import {
    Calculator,
    Calendar,
    CreditCard,
    Wallet,
    AlertCircle,
    CheckCircle,
    ArrowRight,
    TrendingUp,
    Search,
    Image as ImageIcon,
    Edit,
    History
} from "lucide-react"
import { OrderDetailsDrawer } from "@/components/order-details-drawer"
import { OrderAuditDialog } from "@/components/order-audit-dialog"

interface SummaryMetric {
    count: number
    totalValue: number
    paymentReceived: number
    auditPending: number
}

interface AccountingSummary {
    cod: SummaryMetric
    online: SummaryMetric
    partial: SummaryMetric
    total: SummaryMetric
}

export default function OrderAuditPage() {
    const [summary, setSummary] = useState<AccountingSummary | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<"summary" | "detailed">("summary")
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0])
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

    const [orders, setOrders] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedOrder, setSelectedOrder] = useState<any>(null)
    const [auditDialogOpen, setAuditDialogOpen] = useState(false)

    const { toast } = useToast()

    const fetchSummary = async () => {
        setIsLoading(true)
        try {
            const response = await axiosInstance.get(`/admin/reports/accounting-summary?startDate=${startDate}&endDate=${endDate}`)
            setSummary(response.data.summary)

            // Also fetch detailed orders for this period
            const ordersRes = await axiosInstance.get("/admin/orders")
            const list = ordersRes.data.orders || []
            // Filter by date client-side for now or we could add backend filtering
            const filtered = list.filter((o: any) => {
                const d = new Date(o.createdAt)
                return d >= new Date(startDate) && d <= new Date(endDate + "T23:59:59")
            })
            setOrders(filtered)
        } catch (error) {
            toast({ title: "Error", description: "Failed to fetch accounting data", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchSummary()
    }, [startDate, endDate])

    const MetricCard = ({ title, data, icon: Icon, color }: { title: string, data: SummaryMetric, icon: any, color: string }) => (
        <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden group hover:scale-[1.02] transition-transform">
            <CardHeader className={`${color}/10 border-b border-${color}/5 pb-4`}>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">{title}</CardTitle>
                    <div className={`p-2 rounded-xl ${color} text-white`}>
                        <Icon className="w-4 h-4" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-3xl font-black text-foreground">{data.count}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Orders</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-black text-primary">₹{data.totalValue.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Order Value</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-secondary">
                    <div>
                        <p className="text-sm font-black text-emerald-600">₹{data.paymentReceived.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Received</p>
                    </div>
                    <div>
                        <p className="text-sm font-black text-rose-500">{data.auditPending}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Audit Pending</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    return (
        <AdminLayout>
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                            <Calculator className="w-8 h-8 text-primary" />
                            Accounting Audit
                        </h1>
                        <p className="text-muted-foreground text-sm font-medium">Verify payments and reconcile shipping partner accounts</p>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-secondary">
                        <div className="flex items-center gap-2 px-3">
                            <Calendar className="w-4 h-4 text-primary" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="text-xs font-bold border-none bg-transparent focus:ring-0"
                            />
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        <div className="flex items-center gap-2 px-3">
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="text-xs font-bold border-none bg-transparent focus:ring-0"
                            />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 p-1.5 bg-secondary/30 rounded-2xl w-fit">
                    <button
                        onClick={() => setActiveTab("summary")}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "summary" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Summary View
                    </button>
                    <button
                        onClick={() => setActiveTab("detailed")}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "detailed" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Audit Detailed
                    </button>
                </div>

                {activeTab === "summary" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {!summary ? (
                            [...Array(4)].map((_, i) => <div key={i} className="h-48 bg-white/50 animate-pulse rounded-[2rem]" />)
                        ) : (
                            <>
                                <MetricCard title="Total Analysis" data={summary.total} icon={TrendingUp} color="bg-primary" />
                                <MetricCard title="COD Orders" data={summary.cod} icon={Wallet} color="bg-orange-500" />
                                <MetricCard title="Prepaid (Online)" data={summary.online} icon={CreditCard} color="bg-blue-500" />
                                <MetricCard title="Partial Payments" data={summary.partial} icon={CheckCircle} color="bg-purple-500" />
                            </>
                        )}
                    </div>
                )}

                {activeTab === "detailed" && (
                    <div className="space-y-6">
                        <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
                            <CardHeader className="bg-secondary/10 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg font-black text-foreground">Pending Audit Registry</CardTitle>
                                    <CardDescription className="text-xs font-medium">Verify transactions for the selected period</CardDescription>
                                </div>
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search Order ID..."
                                        className="pl-10 h-10 bg-white border-secondary rounded-xl font-bold"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-secondary/5 border-b border-secondary">
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Order ID</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Gateway</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Audit Status</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-secondary/30">
                                            {orders.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-20 text-center text-muted-foreground italic">No matching orders found</td>
                                                </tr>
                                            ) : (
                                                orders.filter(o => o.orderId.toLowerCase().includes(searchQuery.toLowerCase())).map((order) => (
                                                    <tr key={order._id} className="hover:bg-secondary/5 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <p className="text-sm font-black text-foreground">{order.orderId}</p>
                                                            <p className="text-[10px] font-bold text-muted-foreground">{order.address.name}</p>
                                                        </td>
                                                        <td className="px-6 py-4 text-xs font-bold text-muted-foreground">
                                                            {new Date(order.createdAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${order.paymentMethod === 'cod' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                                                }`}>
                                                                {order.paymentMethod}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-black text-foreground">₹{order.totalAmount.toLocaleString()}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                {order.audit?.status === 'verified' ? (
                                                                    <span className="flex items-center gap-1.5 text-emerald-600 font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-lg">
                                                                        <CheckCircle className="w-3 h-3" /> Verified
                                                                    </span>
                                                                ) : order.audit?.status === 'discrepancy' ? (
                                                                    <span className="flex items-center gap-1.5 text-rose-600 font-black text-[10px] uppercase tracking-widest bg-rose-50 px-2 py-1 rounded-lg">
                                                                        <AlertCircle className="w-3 h-3" /> Error
                                                                    </span>
                                                                ) : (
                                                                    <span className="flex items-center gap-1.5 text-orange-600 font-black text-[10px] uppercase tracking-widest bg-orange-50 px-2 py-1 rounded-lg">
                                                                        <History className="w-3 h-3" /> Pending
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                className="rounded-xl h-8 px-4 font-black text-[10px] uppercase tracking-widest gap-2"
                                                                onClick={() => {
                                                                    setSelectedOrder(order)
                                                                    setAuditDialogOpen(true)
                                                                }}
                                                            >
                                                                <Edit className="w-3.5 h-3.5" />
                                                                Audit
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
                    </div>
                )}
            </div>

            {selectedOrder && (
                <OrderAuditDialog
                    order={selectedOrder}
                    open={auditDialogOpen}
                    onOpenChangeAction={setAuditDialogOpen}
                    onSuccessAction={() => {
                        fetchSummary()
                        setAuditDialogOpen(false)
                    }}
                />
            )}
        </AdminLayout>
    )
}
