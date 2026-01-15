"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { axiosInstance } from "@/lib/axios"

interface Stats {
  totalUsers: number
  totalProducts: number
  totalOrders: number
  totalRevenue: number
}

interface TrendData {
  month: string
  revenue: number
  orders: number
}

const chartData: TrendData[] = [
  { month: "Jan", revenue: 4000, orders: 24 },
  { month: "Feb", revenue: 3000, orders: 21 },
  { month: "Mar", revenue: 2000, orders: 29 },
  { month: "Apr", revenue: 2780, orders: 39 },
  { month: "May", revenue: 1890, orders: 23 },
  { month: "Jun", revenue: 2390, orders: 34 },
]

const StatCard = ({
  title,
  value,
  icon,
  trend,
}: { title: string; value: string | number; icon: string; trend?: number }) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-baseline justify-between">
        <div className="text-3xl font-bold text-foreground">{value}</div>
        <span className="text-2xl">{icon}</span>
      </div>
      {trend !== undefined && (
        <p className="text-xs text-muted-foreground mt-3">
          <span className={trend > 0 ? "text-primary font-semibold" : "text-red-600 font-semibold"}>
            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>{" "}
          <span>from last month</span>
        </p>
      )}
    </CardContent>
  </Card>
)

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axiosInstance.get("/admin/stats")
        
        // Extract stats from response - it's inside response.data.stats
        const statsData = response.data?.stats

        const toNumber = (value: unknown) => {
          if (typeof value === "number") return value
          if (typeof value === "string") {
            const num = Number(value)
            return Number.isFinite(num) ? num : 0
          }
          return 0
        }

        setStats({
          totalUsers: toNumber(statsData?.totalUsers),
          totalProducts: toNumber(statsData?.totalProducts),
          totalOrders: toNumber(statsData?.totalOrders),
          totalRevenue: toNumber(statsData?.totalRevenue),
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-balance">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-2">Monitor your business metrics at a glance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-20 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : stats ? (
            <>
              <StatCard title="Total Users" value={stats.totalUsers} icon="👤" trend={12} />
              <StatCard title="Total Products" value={stats.totalProducts} icon="📦" trend={8} />
              <StatCard title="Total Orders" value={stats.totalOrders} icon="🧾" trend={-2} />
              <StatCard title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} icon="💰" trend={15} />
            </>
          ) : null}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue over the past 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--color-muted-foreground)" style={{ fontSize: "12px" }} />
                  <YAxis stroke="var(--color-muted-foreground)" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: `1px solid var(--color-border)`,
                    }}
                    cursor={{ fill: "rgba(47, 125, 50, 0.1)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-primary)", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Orders Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Orders Trend</CardTitle>
              <CardDescription>Monthly orders over the past 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--color-muted-foreground)" style={{ fontSize: "12px" }} />
                  <YAxis stroke="var(--color-muted-foreground)" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: `1px solid var(--color-border)`,
                    }}
                    cursor={{ fill: "rgba(47, 125, 50, 0.1)" }}
                  />
                  <Bar dataKey="orders" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Additional metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-secondary/30">
                <p className="text-sm text-muted-foreground mb-1">Avg Order Value</p>
                <p className="text-2xl font-bold text-primary">₹2,450</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30">
                <p className="text-sm text-muted-foreground mb-1">Active Products</p>
                <p className="text-2xl font-bold text-primary">{stats?.totalProducts || 0}</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30">
                <p className="text-sm text-muted-foreground mb-1">Conversion Rate</p>
                <p className="text-2xl font-bold text-primary">3.24%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
