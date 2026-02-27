"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart, Bar, LineChart, Line, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, XAxis, YAxis } from "recharts"
import { axiosInstance } from "@/lib/axios"
import { ShoppingCart, Users, Package, IndianRupee, TrendingUp, Clock, Star, Zap, BarChart3, LineChart as LineIcon, Download, Table2, Info } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Stats {
  totalUsers: number
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  today: {
    placed: number
    confirmed: number
    projectedRevenue: number
  }
  breakdown: Record<string, number>
  repeatOrders: {
    avgPerCustomer: number
    totalCustomers: number
  }
  customerRating: {
    average: number
    count: number
  }
  dailyTrends: Array<{
    date: string
    orders: number
    revenue: number
  }>
  monthlyTrends: Array<{
    month: string
    year: number
    revenue: number
    orders: number
  }>
  avgOrderValue: number
  stockHealth: number
  conversionRate: string
  paymentModeBreakdown?: { cod: number; online: number; partial: number }
  stateWiseOrders?: Array<{ state: string; count: number; percentage: number }>
}

// Shopdeck-style compact stat card
const StatCard = ({
  title,
  value,
  icon,
  trend,
}: { title: string; value: string | number; icon: React.ReactNode; trend?: number }) => (
  <Card className="border border-slate-200 shadow-none hover:shadow-sm transition-all duration-150 bg-white rounded-lg">
    <CardContent className="p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-md bg-indigo-50 text-indigo-600">
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`text-[10px] font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${trend > 0 ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"}`}>
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-[11px] font-medium text-slate-500 tracking-wide mb-0.5">{title}</p>
      <h3 className="text-xl font-bold text-slate-900 leading-none">{value}</h3>
    </CardContent>
  </Card>
)

// Compact summary card
const SummaryCard = ({ title, value, subtext }: { title: string; value: string | number; subtext?: string }) => (
  <Card className="border border-slate-200 shadow-none hover:shadow-sm transition-shadow bg-white rounded-lg">
    <CardContent className="p-4 flex flex-col justify-center h-full">
      <p className="text-[11px] font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-xl font-bold text-slate-900 leading-none">{value}</h3>
      {subtext && <p className="text-[10px] text-slate-400 mt-1">{subtext}</p>}
    </CardContent>
  </Card>
)

// Compact breakdown card
const BreakdownCard = ({ title, value, percentage }: { title: string; value: number; percentage: number }) => (
  <Card className="border border-slate-200 shadow-none hover:shadow-sm transition-shadow bg-white rounded-lg">
    <CardContent className="p-4 flex flex-col justify-between h-full">
      <div className="flex justify-between items-center mb-2">
        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{title}</p>
        <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">{percentage}%</span>
      </div>
      <h4 className="text-xl font-bold text-slate-900 leading-none">{value}</h4>
    </CardContent>
  </Card>
)

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [paymentTableOpen, setPaymentTableOpen] = useState(false)
  const [stateTableOpen, setStateTableOpen] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axiosInstance.get("/admin/stats")
        setStats(response.data.stats)
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  const confirmedTotal = stats ? Object.values(stats.breakdown).reduce((a, b) => a + b, 0) : 0

  const paymentModeData = stats?.paymentModeBreakdown
    ? [
        { name: "COD", value: stats.paymentModeBreakdown.cod, color: "#6366F1" },
        { name: "Online", value: stats.paymentModeBreakdown.online, color: "#10B981" },
        { name: "Partial", value: stats.paymentModeBreakdown.partial, color: "#F59E0B" },
      ].filter((d) => d.value > 0)
    : []

  const totalPaymentOrders = paymentModeData.reduce((s, d) => s + d.value, 0)

  const downloadPaymentCsv = () => {
    const rows = [
      ["Payment Mode", "Orders", "Percentage"],
      ...paymentModeData.map((d) => [d.name, d.value, totalPaymentOrders ? ((d.value / totalPaymentOrders) * 100).toFixed(1) + "%" : "0%"]),
    ]
    const csv = rows.map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `payment-mode-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadStateCsv = () => {
    const rows = [
      ["State", "Orders", "Order Volume Contribution %"],
      ...(stats?.stateWiseOrders || []).map((d) => [d.state, d.count, `${d.percentage}%`]),
    ]
    const csv = rows.map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `state-wise-orders-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-5 space-y-4 max-w-7xl mx-auto">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {[...Array(12)].map((_, i) => <Skeleton key={i} className="h-[110px] rounded-lg" />)}
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-5 max-w-7xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 text-xs mt-0.5">Welcome back! Here's what's happening with your store today.</p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-none w-fit">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            Updated: {new Date().toLocaleDateString('en-GB')}, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Section: Key Metrics */}
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Key Metrics</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <StatCard title="Total Customers" value={stats?.totalUsers || 0} icon={<Users className="w-4 h-4" />} trend={12} />
            <StatCard title="Total Revenue" value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`} icon={<IndianRupee className="w-4 h-4" />} trend={8} />
            <StatCard title="Total Orders" value={stats?.totalOrders || 0} icon={<Package className="w-4 h-4" />} trend={15} />
            <StatCard title="Avg. Ticket" value={`₹${(stats?.avgOrderValue || 0).toLocaleString()}`} icon={<TrendingUp className="w-4 h-4" />} />
            <StatCard title="Active Products" value={stats?.totalProducts || 0} icon={<Package className="w-4 h-4" />} />
            <StatCard title="Conversion" value={`${stats?.conversionRate || 0}%`} icon={<Zap className="w-4 h-4" />} />
          </div>
        </div>

        {/* Section: Today's Summary */}
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Today's Summary</p>
          <div className="grid grid-cols-3 gap-2.5">
            <SummaryCard title="Orders Placed" value={stats?.today.placed || 0} subtext="Today" />
            <SummaryCard title="Orders Confirmed" value={stats?.today.confirmed || 0} subtext="Today" />
            <SummaryCard title="Proj. Revenue" value={`₹${(stats?.today.projectedRevenue || 0).toLocaleString()}`} subtext="Today" />
          </div>
        </div>

        {/* Section: Payment Mode & State-wise Order Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Payment Mode */}
          <Card className="border border-slate-200 shadow-none bg-white rounded-lg">
            <CardHeader className="border-b border-slate-100 p-4 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-semibold text-slate-900">Payment Mode</CardTitle>
                  <span className="text-slate-400 cursor-help" title="Distribution of orders by payment method (COD, Online, Partial)">
                    <Info className="w-4 h-4" />
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={downloadPaymentCsv}
                    className="p-2 rounded-md hover:bg-slate-100 text-slate-500"
                    title="Download CSV"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentTableOpen(true)}
                    className="p-2 rounded-md hover:bg-slate-100 text-slate-500"
                    title="View table"
                  >
                    <Table2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {paymentModeData.length === 0 ? (
                <div className="h-[240px] flex items-center justify-center text-slate-400 text-sm">No payment data yet</div>
              ) : (
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentModeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {paymentModeData.map((entry, index) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [value, "Orders"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* State-wise Order Distribution */}
          <Card className="border border-slate-200 shadow-none bg-white rounded-lg">
            <CardHeader className="border-b border-slate-100 p-4 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-slate-900">State-wise Order Distribution</CardTitle>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={downloadStateCsv}
                    className="p-2 rounded-md hover:bg-slate-100 text-slate-500"
                    title="Download CSV"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setStateTableOpen(true)}
                    className="p-2 rounded-md hover:bg-slate-100 text-slate-500"
                    title="View table"
                  >
                    <Table2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {(stats?.stateWiseOrders?.length ?? 0) === 0 ? (
                <div className="h-[240px] flex items-center justify-center text-slate-400 text-sm">No state-wise data yet</div>
              ) : (
                <div className="max-h-[320px] overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/50">
                  <div className="divide-y divide-slate-100">
                    {(stats?.stateWiseOrders || [])
                      .slice()
                      .sort((a, b) => b.count - a.count)
                      .map((row, i) => (
                        <div
                          key={row.state}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                        >
                          <span className="text-slate-500 text-xs font-medium tabular-nums w-6">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{row.state}</p>
                            <div className="mt-1 h-1.5 w-full max-w-[120px] rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-indigo-500"
                                style={{ width: `${Math.min(100, row.percentage)}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-semibold text-slate-900">{row.count}</span>
                            <span className="text-slate-400 text-xs ml-1">orders</span>
                            <span className="block text-[11px] text-slate-500">{row.percentage}%</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Section: Order Breakdown + Charts side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Order Breakdown */}
          <div className="lg:col-span-2">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Order Breakdown</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2.5">
              <BreakdownCard title="Confirmed" value={stats?.breakdown.confirmed || 0} percentage={stats ? Math.round(((stats.breakdown.confirmed || 0) / confirmedTotal) * 100) || 0 : 0} />
              <BreakdownCard title="Packed" value={stats?.breakdown.packed || 0} percentage={stats ? Math.round(((stats.breakdown.packed || 0) / confirmedTotal) * 100) || 0 : 0} />
              <BreakdownCard title="Shipped" value={stats?.breakdown.shipped || 0} percentage={stats ? Math.round(((stats.breakdown.shipped || 0) / confirmedTotal) * 100) || 0 : 0} />
              <BreakdownCard title="Delivered" value={stats?.breakdown.delivered || 0} percentage={stats ? Math.round(((stats.breakdown.delivered || 0) / confirmedTotal) * 100) || 0 : 0} />
              <BreakdownCard title="RTO" value={stats?.breakdown.rto || 0} percentage={stats ? Math.round(((stats.breakdown.rto || 0) / confirmedTotal) * 100) || 0 : 0} />
              <BreakdownCard title="Returned" value={stats?.breakdown.returned || 0} percentage={stats ? Math.round(((stats.breakdown.returned || 0) / confirmedTotal) * 100) || 0 : 0} />
              <BreakdownCard title="Lost" value={stats?.breakdown.lost || 0} percentage={stats ? Math.round(((stats.breakdown.lost || 0) / confirmedTotal) * 100) || 0 : 0} />
            </div>
          </div>

          {/* Customer Insights */}
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Customer Insights</p>
            <div className="flex flex-col gap-2.5">
              {/* Rating Card */}
              <Card className="border border-slate-200 shadow-none bg-white rounded-lg">
                <CardContent className="p-4 flex items-center gap-4">
                  <h3 className="text-2xl font-bold text-slate-900">{stats?.customerRating.average || 0}</h3>
                  <div>
                    <div className="flex gap-0.5 mb-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < (stats?.customerRating.average || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400">{stats?.customerRating.count || 0} ratings</p>
                  </div>
                </CardContent>
              </Card>

              {/* Repeat Rate Card */}
              <Card className="border border-slate-200 shadow-none bg-white rounded-lg">
                <CardContent className="p-4">
                  <p className="text-[11px] font-medium text-slate-500 mb-1">Repeat Rate</p>
                  <h4 className="text-xl font-bold text-slate-900 leading-none">{stats?.repeatOrders.avgPerCustomer || 0}x</h4>
                  <p className="text-[10px] text-slate-400 mt-1">Avg orders per customer</p>
                </CardContent>
              </Card>

              {/* Stock Health Card */}
              <Card className="border border-slate-200 shadow-none bg-indigo-50 border-indigo-100 rounded-lg">
                <CardContent className="p-4">
                  <p className="text-[11px] font-semibold text-indigo-600 mb-1">Stock Health</p>
                  <h4 className="text-xl font-bold text-indigo-900 leading-none">{stats?.stockHealth || 0}%</h4>
                  <p className="text-[10px] text-indigo-500 mt-1">Inventory Status</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Section: Charts */}
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Trends</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">

            {/* Revenue Trends */}
            <Card className="border border-slate-200 shadow-none bg-white rounded-lg">
              <CardHeader className="border-b border-slate-100 p-3 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-indigo-50">
                    <LineIcon className="w-3 h-3 text-indigo-600" />
                  </div>
                  <CardTitle className="text-xs font-semibold text-slate-900">Revenue Trends</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-2" style={{ height: 140 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats?.monthlyTrends || []}>
                    <Tooltip contentStyle={{ borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
                    <Line type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Order Volume */}
            <Card className="border border-slate-200 shadow-none bg-white rounded-lg">
              <CardHeader className="border-b border-slate-100 p-3 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-indigo-50">
                    <BarChart3 className="w-3 h-3 text-indigo-600" />
                  </div>
                  <CardTitle className="text-xs font-semibold text-slate-900">Order Volume</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-2" style={{ height: 140 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.monthlyTrends || []}>
                    <Tooltip contentStyle={{ borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
                    <Bar dataKey="orders" fill="#6366F1" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Daily Orders */}
            <Card className="border border-slate-200 shadow-none bg-white rounded-lg">
              <CardHeader className="border-b border-slate-100 p-3 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-indigo-50">
                    <BarChart3 className="w-3 h-3 text-indigo-600" />
                  </div>
                  <CardTitle className="text-xs font-semibold text-slate-900">Daily Orders</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-2" style={{ height: 140 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.dailyTrends || []}>
                    <Tooltip contentStyle={{ borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
                    <Bar dataKey="orders" fill="#6366F1" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Daily Revenue */}
            <Card className="border border-slate-200 shadow-none bg-white rounded-lg">
              <CardHeader className="border-b border-slate-100 p-3 pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-indigo-50">
                    <LineIcon className="w-3 h-3 text-indigo-600" />
                  </div>
                  <CardTitle className="text-xs font-semibold text-slate-900">Daily Revenue</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-2" style={{ height: 140 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats?.dailyTrends || []}>
                    <Tooltip contentStyle={{ borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '11px' }} />
                    <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Payment Mode Table Dialog */}
        <Dialog open={paymentTableOpen} onOpenChange={setPaymentTableOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Payment Mode – Table View</DialogTitle>
            </DialogHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Payment Mode</th>
                    <th className="text-right py-2 font-medium">Orders</th>
                    <th className="text-right py-2 font-medium">%</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentModeData.map((d) => (
                    <tr key={d.name} className="border-b">
                      <td className="py-2">{d.name}</td>
                      <td className="text-right py-2">{d.value}</td>
                      <td className="text-right py-2">{totalPaymentOrders ? ((d.value / totalPaymentOrders) * 100).toFixed(1) : 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DialogContent>
        </Dialog>

        {/* State-wise Table Dialog */}
        <Dialog open={stateTableOpen} onOpenChange={setStateTableOpen}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>State-wise Order Distribution – Table View</DialogTitle>
            </DialogHeader>
            <div className="overflow-auto flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">State</th>
                    <th className="text-right py-2 font-medium">Orders</th>
                    <th className="text-right py-2 font-medium">Order Volume %</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.stateWiseOrders || []).map((row) => (
                    <tr key={row.state} className="border-b">
                      <td className="py-2">{row.state}</td>
                      <td className="text-right py-2">{row.count}</td>
                      <td className="text-right py-2">{row.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
