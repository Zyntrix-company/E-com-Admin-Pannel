"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { axiosInstance } from "@/lib/axios"

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
}

const StatCard = ({
  title,
  value,
  icon,
  trend,
  color = "indigo",
}: { title: string; value: string | number; icon: React.ReactNode; trend?: number, color?: string }) => (
  <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 bg-white">
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-indigo-50 text-indigo-600`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`text-xs font-semibold flex items-center gap-1 px-2 py-1 rounded-full ${trend > 0 ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"}`}>
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      </div>
    </CardContent>
  </Card>
)

const SummaryCard = ({ title, value, subtext }: { title: string; value: string | number; subtext?: string }) => (
  <Card className="border border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
    <CardContent className="p-6">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
      </div>
      {subtext && <p className="text-xs font-medium text-slate-400 mt-1">{subtext}</p>}
    </CardContent>
  </Card>
)

const BreakdownCard = ({ title, value, percentage }: { title: string; value: number; percentage: number }) => (
  <Card className="border border-slate-200 shadow-sm bg-white hover:shadow-md transition-shadow">
    <CardContent className="p-4 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide leading-tight">{title}</p>
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-indigo-600">{percentage}%</span>
        </div>
      </div>
      <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
    </CardContent>
  </Card>
)

import { ShoppingCart, Users, Package, DollarSign, TrendingUp, Clock, Star, ArrowRight, Zap, X, BarChart3, LineChart as LineIcon } from "lucide-react"

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[400px] rounded-xl" />
            <Skeleton className="h-[400px] rounded-xl" />
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Welcome back! Here's what's happening with your store today.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-white shadow-sm px-4 py-2.5 rounded-lg border border-slate-200">
            <Clock className="w-4 h-4 text-indigo-500" />
            Updated: {new Date().toLocaleDateString('en-GB')}, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Overall Order Summary: Top 6 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={<Users className="w-5 h-5" />} trend={12} />
          <StatCard title="Total Revenue" value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} trend={8} />
          <StatCard title="Total Orders" value={stats?.totalOrders || 0} icon={<Package className="w-5 h-5" />} trend={15} />
          <StatCard title="Average Ticket" value={`₹${(stats?.avgOrderValue || 0).toLocaleString()}`} icon={<TrendingUp className="w-5 h-5" />} />
          <StatCard title="Active Products" value={stats?.totalProducts || 0} icon={<Package className="w-5 h-5" />} />
          <StatCard title="Conversion" value={`${stats?.conversionRate || 0}%`} icon={<Zap className="w-5 h-5" />} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50">
                  <LineIcon className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">Revenue Trends</CardTitle>
                  <CardDescription className="text-xs text-slate-500">Monthly revenue analysis</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats?.monthlyTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500, fill: '#64748B' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: '600' }} />
                  <Line type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={3} dot={{ r: 4, fill: '#6366F1', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-slate-900">Order Volume</CardTitle>
                  <CardDescription className="text-xs text-slate-500">Monthly order trends</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats?.monthlyTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500, fill: '#64748B' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: '600' }} />
                  <Bar dataKey="orders" fill="#6366F1" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Split Section: Today Summary & Reviews */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 space-y-6">
            <h2 className="text-base font-semibold text-slate-900">Today's Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SummaryCard title="Orders Placed" value={stats?.today.placed || 0} subtext="New orders today" />
              <SummaryCard title="Orders Confirmed" value={stats?.today.confirmed || 0} subtext="Verified orders" />
              <SummaryCard title="Projected Revenue" value={`₹${(stats?.today.projectedRevenue || 0).toLocaleString()}`} subtext="Expected earnings" />
            </div>

            {/* Confirmed Order Summary */}
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-900">Order Breakdown</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <BreakdownCard title="Confirmed" value={stats?.breakdown.confirmed || 0} percentage={stats ? Math.round(((stats.breakdown.confirmed || 0) / confirmedTotal) * 100) || 0 : 0} />
                <BreakdownCard title="Packed" value={stats?.breakdown.packed || 0} percentage={stats ? Math.round(((stats.breakdown.packed || 0) / confirmedTotal) * 100) || 0 : 0} />
                <BreakdownCard title="Shipped" value={stats?.breakdown.shipped || 0} percentage={stats ? Math.round(((stats.breakdown.shipped || 0) / confirmedTotal) * 100) || 0 : 0} />
                <BreakdownCard title="Delivered" value={stats?.breakdown.delivered || 0} percentage={stats ? Math.round(((stats.breakdown.delivered || 0) / confirmedTotal) * 100) || 0 : 0} />
                <BreakdownCard title="RTO" value={stats?.breakdown.rto || 0} percentage={stats ? Math.round(((stats.breakdown.rto || 0) / confirmedTotal) * 100) || 0 : 0} />
                <BreakdownCard title="Returned" value={stats?.breakdown.returned || 0} percentage={stats ? Math.round(((stats.breakdown.returned || 0) / confirmedTotal) * 100) || 0 : 0} />
                <BreakdownCard title="Lost" value={stats?.breakdown.lost || 0} percentage={stats ? Math.round(((stats.breakdown.lost || 0) / confirmedTotal) * 100) || 0 : 0} />
              </div>
            </div>
          </div>

          <div className="xl:col-span-4 space-y-6">
            <h2 className="text-base font-semibold text-slate-900">Customer Insights</h2>
            <Card className="border border-slate-200 shadow-sm bg-white">
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-col items-center text-center p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Average Rating</p>
                  <h3 className="text-5xl font-bold text-slate-900 mb-3">{stats?.customerRating.average || 0}</h3>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-5 h-5 ${i < (stats?.customerRating.average || 0) ? 'fill-indigo-500 text-indigo-500' : 'text-slate-300'}`} />
                    ))}
                  </div>
                  <p className="text-xs font-medium text-slate-500 mt-3">{stats?.customerRating.count || 0} total ratings</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group">
                    <div>
                      <p className="text-xs font-medium uppercase text-slate-500">Repeat Orders</p>
                      <h4 className="text-xl font-bold text-slate-900">{stats?.repeatOrders.avgPerCustomer || 0}x</h4>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </div>

                  <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                    <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-2">Stock Health</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">Inventory Status</span>
                      <span className="text-sm font-bold text-indigo-600">{stats?.stockHealth || 0}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Daily Trends */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-slate-200 shadow-sm bg-white">
              <CardContent className="p-6">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-4">Daily Orders</p>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={stats?.dailyTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500, fill: '#64748B' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500, fill: '#64748B' }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: '600' }} />
                    <Bar dataKey="orders" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm bg-white">
              <CardContent className="p-6">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-4">Daily Revenue</p>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={stats?.dailyTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500, fill: '#64748B' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500, fill: '#64748B' }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: '600' }} />
                    <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
