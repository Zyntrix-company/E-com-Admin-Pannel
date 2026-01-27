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
  color = "primary",
}: { title: string; value: string | number; icon: React.ReactNode; trend?: number, color?: string }) => (
  <Card className="border border-border/50 shadow-sm hover:shadow-md transition-all duration-200 bg-white">
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg bg-primary/10 text-primary`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`text-xs font-bold flex items-center ${trend > 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] mb-1">{title}</p>
        <h3 className="text-2xl font-black text-foreground tracking-tighter">{value}</h3>
      </div>
    </CardContent>
  </Card>
)

const SummaryCard = ({ title, value, subtext }: { title: string; value: string | number; subtext?: string }) => (
  <Card className="border-none shadow-sm bg-white rounded-xl overflow-hidden hover:shadow-md transition-shadow">
    <CardContent className="p-6">
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-black text-foreground tracking-tighter">{value}</h3>
      </div>
      {subtext && <p className="text-[10px] font-bold text-muted-foreground/60 mt-1 uppercase">{subtext}</p>}
    </CardContent>
  </Card>
)

const BreakdownCard = ({ title, value, percentage }: { title: string; value: number; percentage: number }) => (
  <Card className="border-none shadow-sm bg-white rounded-xl overflow-hidden">
    <CardContent className="p-4 flex flex-col justify-between h-80px]">
      <div className="flex justify-between items-start mb-2">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tight leading-tight max-w-[80px]">{title}</p>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-black text-primary">{percentage}%</span>
        </div>
      </div>
      <h4 className="text-xl font-black text-foreground tracking-tighter">{value}</h4>
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
        <div className="space-y-6 p-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[400px] rounded-2xl" />
            <Skeleton className="h-[400px] rounded-2xl" />
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8 pb-12 bg-[#F8F9FC] -m-6 p-8 min-h-screen">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Executive Overview</h1>
            <p className="text-muted-foreground text-sm font-medium">Holistic performance tracking for your Ayurveda ecosystem</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 bg-white shadow-sm px-4 py-2 rounded-full border border-border/50 uppercase tracking-widest">
            <Clock className="w-3.5 h-3.5 text-primary" />
            UPDATED: {new Date().toLocaleDateString('en-GB')}, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Overall Order Summary: Top 6 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={<Users className="w-5 h-5" />} trend={1} />
          <StatCard title="Total Revenue" value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} trend={1} />
          <StatCard title="Total Orders" value={stats?.totalOrders || 0} icon={<Package className="w-5 h-5" />} trend={1} />
          <StatCard title="Average Ticket" value={`₹${(stats?.avgOrderValue || 0).toLocaleString()}`} icon={<TrendingUp className="w-5 h-5" />} />
          <StatCard title="Active Products" value={stats?.totalProducts || 0} icon={<Package className="w-5 h-5" />} />
          <StatCard title="Conversion" value={`${stats?.conversionRate || 0}%`} icon={<Zap className="w-5 h-5" />} />
        </div>

        {/* Previous Elements: Monthly Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardHeader className="border-b border-border/10 bg-slate-50/50 pb-4">
              <div className="flex items-center gap-2">
                <LineIcon className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-black uppercase text-slate-800">Revenue Dynamics</CardTitle>
              </div>
              <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly Growth Analysis</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats?.monthlyTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F1" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: '900' }} />
                  <Line type="monotone" dataKey="revenue" stroke="#1B4332" strokeWidth={4} dot={{ r: 4, fill: '#1B4332', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardHeader className="border-b border-border/10 bg-slate-50/50 pb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-black uppercase text-slate-800">Order Fulfilment</CardTitle>
              </div>
              <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Historical Volume Trends</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats?.monthlyTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F1" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: '900' }} />
                  <Bar dataKey="orders" fill="#1B4332" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Split Section: Today Summary & Reviews */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-8 space-y-6">
            <h2 className="text-sm font-black text-slate-700 uppercase tracking-tight">Today&apos;s Order Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SummaryCard title="Order Placed" value={stats?.today.placed || 0} subtext="Real-time intake" />
              <SummaryCard title="Order Confirmed" value={stats?.today.confirmed || 0} subtext="Verified orders" />
              <SummaryCard title="Projected Revenue" value={`₹${(stats?.today.projectedRevenue || 0).toLocaleString()}`} subtext="Gross potential" />
            </div>

            {/* Confirmed Order Summary Table-like cards */}
            <div className="space-y-4">
              <h2 className="text-sm font-black text-slate-700 uppercase tracking-tight">Confirmed Order Summary</h2>
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

          <div className="xl:col-span-4 space-y-8">
            <h2 className="text-sm font-black text-slate-700 uppercase tracking-tight">Customer Reviews</h2>
            <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardContent className="p-8 space-y-8">
                <div className="flex flex-col items-center text-center p-6 bg-slate-50/50 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Average Rating</p>
                  <h3 className="text-6xl font-black text-slate-800 tracking-tighter mb-4">{stats?.customerRating.average || 0}</h3>
                  <div className="flex gap-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-5 h-5 ${i < (stats?.customerRating.average || 0) ? 'fill-blue-500 text-blue-500' : 'text-slate-200'}`} />
                    ))}
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-4">Out of {stats?.customerRating.count || 0} total ratings</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center group cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">Repeat Orders</p>
                      <h4 className="text-xl font-black text-slate-800">{stats?.repeatOrders.avgPerCustomer || 0} x</h4>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
                  </div>

                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <p className="text-[10px] font-black text-primary uppercase tracking-wider mb-2">Operational Insight</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">Stock Health</span>
                      <span className="text-xs font-black text-primary">{stats?.stockHealth || 0}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Trends */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-700 uppercase tracking-tight">Recent Daily Trends</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-8">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-6">Order vs Date (Daily)</p>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={stats?.dailyTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F1" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: '900' }} />
                    <Bar dataKey="orders" fill="#5356FF" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardContent className="p-8">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-6">Revenue vs Date (Daily)</p>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={stats?.dailyTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F1" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748B' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: '900' }} />
                    <Line type="monotone" dataKey="revenue" stroke="#22C55E" strokeWidth={3} dot={{ r: 4, fill: '#22C55E' }} />
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
